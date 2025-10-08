import { baseMainnet, cdpBundlerClient, entryPointAddress } from '@my/wagmi'
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
      const { data: sendAccount, error: sendAccountError } = await supabase
        .from('send_accounts')
        .select('*')
        .single()
      if (sendAccountError) {
        log('No send account found')
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'No send account found',
        })
      }

      // Validate operation is whitelisted for sponsorship
      let isValidOperation = false

      // Try to decode as SendEarn deposit
      try {
        const depositArgs = decodeSendEarnDepositUserOp({ userOp: userop })

        if (isVaultDeposit(depositArgs)) {
          const { owner, assets, vault } = depositArgs
          if (isAddress(owner) && isAddress(vault) && assets >= MINIMUM_USDC_VAULT_DEPOSIT) {
            log('Validated as SendEarn vault deposit', { assets: assets.toString() })
            isValidOperation = true
          } else if (assets < MINIMUM_USDC_VAULT_DEPOSIT) {
            log('Deposit amount below minimum', {
              assets: assets.toString(),
              minimum: MINIMUM_USDC_VAULT_DEPOSIT.toString(),
            })
          }
        } else if (isFactoryDeposit(depositArgs)) {
          const { owner, assets } = depositArgs
          if (isAddress(owner) && assets >= MINIMUM_USDC_VAULT_DEPOSIT) {
            log('Validated as SendEarn factory deposit', { assets: assets.toString() })
            isValidOperation = true
          } else if (assets < MINIMUM_USDC_VAULT_DEPOSIT) {
            log('Deposit amount below minimum', {
              assets: assets.toString(),
              minimum: MINIMUM_USDC_VAULT_DEPOSIT.toString(),
            })
          }
        }
      } catch (e) {
        log('Not a SendEarn deposit operation', e)
      }

      if (!isValidOperation) {
        log('Operation is not whitelisted for CDP sponsorship')
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Operation is not whitelisted for CDP sponsorship',
        })
      }

      // Request sponsorship from CDP paymaster
      try {
        const sponsorResult = (await cdpBundlerClient.request({
          method: 'pm_sponsorUserOperation',
          params: [userop, entryPoint, { chainId: baseMainnet.id }],
        })) as {
          paymaster?: `0x${string}`
          paymasterData?: `0x${string}`
          callGasLimit?: bigint
          verificationGasLimit?: bigint
          preVerificationGas?: bigint
          paymasterVerificationGasLimit?: bigint
          paymasterPostOpGasLimit?: bigint
        }

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
