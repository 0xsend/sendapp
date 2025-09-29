import { Queue } from '@my/temporal'
import { getTemporalClient } from '@my/temporal/client'
import {
  baseMainnet,
  baseMainnetClient,
  entryPointAddress,
  sendVerifyingPaymasterAbi,
  sendVerifyingPaymasterAddress,
} from '@my/wagmi'
import { DepositWorkflow, version } from '@my/workflows'
import { WorkflowExecutionAlreadyStartedError } from '@temporalio/client'
import { TRPCError } from '@trpc/server'
import { assert } from 'app/utils/assert'
import {
  decodeSendEarnDepositUserOp,
  isFactoryDeposit,
  isVaultDeposit,
} from 'app/utils/decodeSendEarnDepositUserOp'
import { packUserOp } from 'app/utils/userop'
import { address } from 'app/utils/zod'
import { UserOperationSchema } from 'app/utils/zod/evm'
import debug from 'debug'
import { ENTRYPOINT_ADDRESS_V07, getUserOperationHash } from 'permissionless'
import { concat, createWalletClient, encodeAbiParameters, http, isAddress } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '../trpc'

const SEND_VERIFYING_PAYMASTER_PRIVATE_KEY = process.env
  .SEND_VERIFYING_PAYMASTER_PRIVATE_KEY as `0x${string}`
if (!SEND_VERIFYING_PAYMASTER_PRIVATE_KEY) {
  throw new Error('SEND_VERIFYING_PAYMASTER_PRIVATE_KEY is required')
}
const paymasterAccount = privateKeyToAccount(SEND_VERIFYING_PAYMASTER_PRIVATE_KEY)
const paymasterClient = createWalletClient({
  account: paymasterAccount,
  chain: baseMainnet,
  transport: http(baseMainnetClient.transport.url),
})

export const sendEarnRouter = createTRPCRouter({
  deposit: protectedProcedure
    .input(
      z.object({
        /**
         * The user op for the deposit.
         */
        userop: UserOperationSchema,
        entryPoint: address,
      })
    )
    .mutation(async ({ ctx: { session }, input: { userop, entryPoint } }) => {
      const log = debug(`api:routers:sendEarn:${session.user.id}:deposit`)
      log('Received deposit request', { userop, entryPoint })

      assert(ENTRYPOINT_ADDRESS_V07 === entryPoint, 'Invalid entry point')

      // validate userop
      const args = decodeSendEarnDepositUserOp({ userOp: userop })
      if (isVaultDeposit(args)) {
        const { owner, assets, vault } = args
        assert(isAddress(owner), 'Invalid owner')
        assert(isAddress(vault), 'Invalid vault')
        assert(assets > 0n, 'Invalid assets')
      } else if (isFactoryDeposit(args)) {
        const { owner, assets, referrer } = args
        assert(isAddress(owner), 'Invalid owner')
        assert(isAddress(referrer), 'Invalid referrer')
        assert(assets > 0n, 'Invalid assets')
      } else {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid deposit type',
        })
      }
      const client = await getTemporalClient()

      // simulate
      await baseMainnetClient
        .call({
          account: entryPointAddress[baseMainnetClient.chain.id],
          to: userop.sender,
          data: userop.callData,
        })
        .catch((e) => {
          throw new TRPCError({
            code: 'PRECONDITION_FAILED',
            message: e.message,
          })
        })

      const userOpHash = getUserOperationHash({
        userOperation: userop,
        entryPoint: entryPoint,
        chainId: baseMainnet.id,
      })
      const workflowId = `temporal/deposit/${session.user.id}/${userOpHash}`
      log(`Starting DepositWorkflow with ID: ${workflowId}`)

      try {
        await client.workflow.start(DepositWorkflow, {
          args: [{ userOp: userop }],
          taskQueue: `${Queue.MONOREPO}@${version}`,
          workflowId: workflowId,
        })
        log(`Workflow ${workflowId} started successfully.`)
      } catch (error) {
        if (error instanceof WorkflowExecutionAlreadyStartedError) {
          log(`Workflow ${workflowId} already exists.`)
        } else {
          log(`Failed to start workflow ${workflowId}`, error)
          console.error(`Failed to start workflow ${workflowId}`, error)
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to start deposit workflow.',
            cause: error,
          })
        }
      }

      return { workflowId }
    }),
  /**
   * Signs a paymaster data for SendEarn deposit operations.
   * This enables gas sponsorship for deposits by signing the UserOp with the verifying paymaster signer.
   */
  paymasterSign: protectedProcedure
    .input(
      z.object({
        /**
         * The user op to sponsor gas for.
         */
        userop: UserOperationSchema,
        entryPoint: address,
      })
    )
    .mutation(async ({ ctx: { session, supabase }, input: { userop, entryPoint } }) => {
      const log = debug(`api:routers:sendEarn:${session.user.id}:paymasterSign`)

      log('Received paymaster sign request for deposit', { userop, entryPoint })

      assert(ENTRYPOINT_ADDRESS_V07 === entryPoint, 'Invalid entry point')

      // Validate that this is a SendEarn deposit operation
      const args = decodeSendEarnDepositUserOp({ userOp: userop })
      if (isVaultDeposit(args)) {
        const { owner, assets, vault } = args
        assert(isAddress(owner), 'Invalid owner')
        assert(isAddress(vault), 'Invalid vault')
        assert(assets > 0n, 'Invalid assets')
      } else if (isFactoryDeposit(args)) {
        const { owner, assets, referrer } = args
        assert(isAddress(owner), 'Invalid owner')
        assert(isAddress(referrer), 'Invalid referrer')
        assert(assets > 0n, 'Invalid assets')
      } else {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid deposit type',
        })
      }

      // Ensure send account exists
      const { data: sendAccount, error: sendAccountError } = await supabase
        .from('send_accounts')
        .select('*')
        .single()
      if (sendAccountError) {
        log('no send account found')
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'No send account found',
        })
      }

      // Create paymaster signature
      const validUntil = Math.floor((Date.now() + 1000 * 120) / 1000) // 2 minutes
      const validAfter = 0
      const paymasterAddress = sendVerifyingPaymasterAddress[sendAccount.chain_id]
      const paymasterUserOpHash = await paymasterClient
        .readContract({
          address: paymasterAddress,
          abi: sendVerifyingPaymasterAbi,
          functionName: 'getHash',
          args: [packUserOp(userop), validUntil, validAfter],
        })
        .catch((e) => {
          log('getHash error', e)
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to get paymaster hash',
          })
        })
      const sig = await paymasterAccount.signMessage({ message: { raw: paymasterUserOpHash } })

      const paymasterData = concat([
        encodeAbiParameters([{ type: 'uint48' }, { type: 'uint48' }], [validUntil, validAfter]),
        sig,
      ])

      log('Generated paymaster signature', { paymasterData })

      return {
        paymasterData,
      }
    }),
})
