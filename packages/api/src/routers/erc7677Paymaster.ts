import { baseMainnetClient, cdpBundlerClient, entryPointAddress } from '@my/wagmi'
import { TRPCError } from '@trpc/server'
import { assert } from 'app/utils/assert'
import {
  decodeSendEarnDepositUserOp,
  isFactoryDeposit,
  isVaultDeposit,
} from 'app/utils/decodeSendEarnDepositUserOp'
import { address } from 'app/utils/zod'
import { UserOperationSchema } from 'app/utils/zod/evm'
import debug from 'debug'
import { ENTRYPOINT_ADDRESS_V07 } from 'permissionless'
import { isAddress, parseUnits } from 'viem'
import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '../trpc'

const MINIMUM_USDC_VAULT_DEPOSIT = parseUnits('5', 6) // 5 USDC

/**
 * ERC-7677 Paymaster Router
 *
 * Handles CDP paymaster sponsorship requests for whitelisted operations.
 * Currently supports: SendEarn deposit operations
 */
export const erc7677PaymasterRouter = createTRPCRouter({
  /**
   * Sponsor a user operation via CDP paymaster.
   *
   * This endpoint validates that the operation is whitelisted (e.g., SendEarn deposits)
   * before requesting sponsorship from CDP. CDP returns paymaster data and gas estimates.
   */
  sponsorUserOperation: protectedProcedure
    .input(
      z.object({
        /**
         * The user op to sponsor (without paymaster data).
         */
        userop: UserOperationSchema,
        entryPoint: address,
      })
    )
    .mutation(async ({ ctx: { session, supabase }, input: { userop, entryPoint } }) => {
      const log = debug(`api:routers:erc7677Paymaster:${session.user.id}:sponsorUserOperation`)
      log('Received sponsor request', { userop, entryPoint })

      assert(ENTRYPOINT_ADDRESS_V07 === entryPoint, 'Invalid entry point')

      // Ensure user has a send account
      const { error: sendAccountError } = await supabase.from('send_accounts').select('*').single()
      if (sendAccountError) {
        log('No send account found')
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'No send account found',
        })
      }

      // Decode and validate operation
      let depositArgs: ReturnType<typeof decodeSendEarnDepositUserOp>
      try {
        depositArgs = decodeSendEarnDepositUserOp({ userOp: userop })
      } catch (e) {
        log('Failed to decode as SendEarn deposit', e)
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Operation is not a valid SendEarn deposit',
        })
      }

      // Validate deposit based on type
      if (isVaultDeposit(depositArgs)) {
        const { owner, assets, vault } = depositArgs
        assert(isAddress(owner), 'Invalid owner address')
        assert(isAddress(vault), 'Invalid vault address')

        if (assets < MINIMUM_USDC_VAULT_DEPOSIT) {
          log('Deposit amount below minimum', {
            assets: assets.toString(),
            minimum: MINIMUM_USDC_VAULT_DEPOSIT.toString(),
          })
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Minimum deposit is ${MINIMUM_USDC_VAULT_DEPOSIT.toString()} USDC`,
          })
        }

        assert(assets > 0n, 'Invalid deposit amount')
        log('Validated as SendEarn vault deposit', { assets: assets.toString() })
      } else if (isFactoryDeposit(depositArgs)) {
        const { owner, assets, referrer } = depositArgs
        assert(isAddress(owner), 'Invalid owner address')
        assert(isAddress(referrer), 'Invalid referrer address')

        if (assets < MINIMUM_USDC_VAULT_DEPOSIT) {
          log('Deposit amount below minimum', {
            assets: assets.toString(),
            minimum: MINIMUM_USDC_VAULT_DEPOSIT.toString(),
          })
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Minimum deposit is ${MINIMUM_USDC_VAULT_DEPOSIT.toString()} USDC`,
          })
        }

        assert(assets > 0n, 'Invalid deposit amount')
        log('Validated as SendEarn factory deposit', { assets: assets.toString() })
      } else {
        log('Unknown deposit type')
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid deposit type',
        })
      }

      // Simulate the transaction to ensure it will succeed
      await baseMainnetClient
        .call({
          account: entryPointAddress[baseMainnetClient.chain.id],
          to: userop.sender,
          data: userop.callData,
        })
        .catch((e) => {
          log('Simulation failed', e)
          throw new TRPCError({
            code: 'PRECONDITION_FAILED',
            message: e.message,
          })
        })

      // Request sponsorship from CDP paymaster (Pimlico-compatible API)
      try {
        const sponsorResult = await cdpBundlerClient.sponsorUserOperation({
          userOperation: userop,
        })

        log('CDP sponsorship result', sponsorResult)

        return sponsorResult
      } catch (error) {
        log('Failed to sponsor with CDP', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to sponsor operation with CDP',
          cause: error,
        })
      }
    }),
})
