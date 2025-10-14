import { erc7677BundlerClient } from '@my/workflows/utils'
import { baseMainnet } from '@my/wagmi'
import { TRPCError } from '@trpc/server'
import { assert } from 'app/utils/assert'
import {
  decodeSendEarnDepositUserOp,
  isFactoryDeposit,
  isVaultDeposit,
} from 'app/utils/decodeSendEarnDepositUserOp'
import { address } from 'app/utils/zod'
import { UserOperationERC7677InputSchema } from 'app/utils/zod/evm'
import debug from 'debug'
import { ENTRYPOINT_ADDRESS_V07, type UserOperation } from 'permissionless'
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
         * The user op to sponsor (without paymaster data, gas limits optional).
         */
        userop: UserOperationERC7677InputSchema,
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
        // Cast to UserOperation - decodeSendEarnDepositUserOp only uses callData and sender
        depositArgs = decodeSendEarnDepositUserOp({ userOp: userop as UserOperation<'v0.7'> })
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

      // Log the userOp being sent for debugging
      log('Received userOp from frontend:', {
        sender: userop.sender,
        nonce: userop.nonce.toString(),
        callData: `${userop.callData.substring(0, 66)}...`, // First 32 bytes
        callGasLimit: userop.callGasLimit?.toString(),
        verificationGasLimit: userop.verificationGasLimit?.toString(),
        preVerificationGas: userop.preVerificationGas?.toString(),
        maxFeePerGas: userop.maxFeePerGas?.toString(),
        maxPriorityFeePerGas: userop.maxPriorityFeePerGas?.toString(),
      })

      // Standards-first ERC-7677 flow (portable and cost-efficient)
      // We use pm_getPaymasterStubData → eth_estimateUserOperationGas → pm_getPaymasterData
      // instead of pm_sponsorUserOperation because:
      // - It's more portable across different bundler/paymaster providers
      // - We can use our own baseMainnetClient for gas estimation (cheaper on RPC credits)
      // - Follows the ERC-7677 standard more closely
      try {
        // Step 1: Get paymaster stub data for gas estimation
        log('Getting paymaster stub data...')
        const paymasterStub = await erc7677BundlerClient.getPaymasterStubData({
          chain: baseMainnet,
          userOperation: {
            sender: userop.sender,
            nonce: userop.nonce,
            callData: userop.callData,
            maxFeePerGas: userop.maxFeePerGas,
            maxPriorityFeePerGas: userop.maxPriorityFeePerGas,
            signature: userop.signature,
            // Include factory fields if present
            factory: userop.factory,
            factoryData: userop.factoryData,
          } as Parameters<typeof erc7677BundlerClient.getPaymasterStubData>[0]['userOperation'],
        })

        log('Paymaster stub data received:', paymasterStub)

        // Step 2: Estimate gas using our own client (cheaper on RPC credits)
        log('Estimating gas with baseMainnetClient...')
        const gasEstimates = await erc7677BundlerClient.estimateUserOperationGas({
          userOperation: {
            sender: userop.sender,
            nonce: userop.nonce,
            callData: userop.callData,
            maxFeePerGas: userop.maxFeePerGas,
            maxPriorityFeePerGas: userop.maxPriorityFeePerGas,
            signature: userop.signature,
            // Include factory fields if present
            factory: userop.factory,
            factoryData: userop.factoryData,
            // Include paymaster stub data from step 1
            ...paymasterStub,
          } as Parameters<typeof erc7677BundlerClient.estimateUserOperationGas>[0]['userOperation'],
        })

        log('Gas estimates:', gasEstimates)

        // Step 3: Get final paymaster data with gas estimates
        log('Getting final paymaster data...')
        const paymasterData = await erc7677BundlerClient.getPaymasterData({
          chain: baseMainnet,
          userOperation: {
            sender: userop.sender,
            nonce: userop.nonce,
            callData: userop.callData,
            callGasLimit: gasEstimates.callGasLimit,
            verificationGasLimit: gasEstimates.verificationGasLimit,
            preVerificationGas: gasEstimates.preVerificationGas,
            maxFeePerGas: userop.maxFeePerGas,
            maxPriorityFeePerGas: userop.maxPriorityFeePerGas,
            signature: userop.signature,
            // Include factory fields (required by CDP even for deployed accounts)
            factory: userop.factory,
            factoryData: userop.factoryData,
            // Include paymaster stub data from step 1
            ...paymasterStub,
          } as Parameters<typeof erc7677BundlerClient.getPaymasterData>[0]['userOperation'],
        })

        log('Final paymaster data received:', paymasterData)

        // Return both gas estimates and paymaster data
        return {
          ...gasEstimates,
          ...paymasterData,
        }
      } catch (error) {
        // Extract detailed error information
        const errorMessage = error instanceof Error ? error.message : String(error)
        const errorDetails = {
          message: errorMessage,
          name: error instanceof Error ? error.name : 'Unknown',
          stack: error instanceof Error ? error.stack : undefined,
          cause: error?.cause,
          details: error?.details,
          data: error?.data,
        }

        log('Failed to sponsor with ERC-7677 paymaster', errorDetails)

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to sponsor operation: ${errorMessage}`,
          cause: error,
        })
      }
    }),
})
