import {
  baseMainnet,
  sendAccountAbi,
  sendTokenV0Address,
  sendTokenV0LockboxAddress,
  sendVerifyingPaymasterAbi,
  sendVerifyingPaymasterAddress,
} from '@my/wagmi'
import {
  decodeSendEarnDepositUserOp,
  isFactoryDeposit as isSendEarnFactoryDeposit,
  isVaultDeposit as isSendEarnVaultDeposit,
} from 'app/utils/decodeSendEarnDepositUserOp'
import { TRPCError } from '@trpc/server'
import { address } from 'app/utils/zod'
import { UserOperationSchema, SendAccountCallsSchema } from 'app/utils/zod/evm'
import { packUserOp } from 'app/utils/userop'
import debug from 'debug'
import { ENTRYPOINT_ADDRESS_V07 } from 'permissionless'
import {
  concat,
  createPublicClient,
  createWalletClient,
  encodeAbiParameters,
  encodeFunctionData,
  encodePacked,
  http,
  isAddress,
  parseUnits,
  publicActions,
} from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '../trpc'

const SEND_ACCOUNT_FACTORY_PRIVATE_KEY = process.env
  .SEND_ACCOUNT_FACTORY_PRIVATE_KEY as `0x${string}`
if (!SEND_ACCOUNT_FACTORY_PRIVATE_KEY) {
  throw new Error('SEND_ACCOUNT_FACTORY_PRIVATE_KEY is required')
}
const account = privateKeyToAccount(SEND_ACCOUNT_FACTORY_PRIVATE_KEY)
const paymasterClient = createWalletClient({
  account,
  chain: baseMainnet,
  transport: http(),
}).extend(publicActions)

const MINIMUM_USDC_VAULT_DEPOSIT = parseUnits('5', 6) // 5 USDC

// SendVerifyingPaymaster gas limit estimates
// Conservative estimates based on verification and signature checks
const VERIFYING_PAYMASTER_VERIFICATION_GAS_LIMIT = 70000n
const VERIFYING_PAYMASTER_POSTOP_GAS_LIMIT = 50000n

/**
 * ERC-7677 Sponsored Paymaster Router
 *
 * Implements the ERC-7677 specification for sponsored gas payments.
 * Provides methods for getting paymaster stub data and final paymaster data
 * with gas sponsorship (free for users) for whitelisted operations:
 * 1. Send token V0 upgrade operations
 * 2. SendEarn deposit operations
 *
 * @see https://eips.ethereum.org/EIPS/eip-7677
 */
export const sendSponsoredPaymasterRouter = createTRPCRouter({
  /**
   * pm_getPaymasterStubData - ERC-7677 compliant method
   *
   * Returns stub paymaster data for gas estimation with sponsored gas.
   * Validates that the operation is whitelisted for sponsorship.
   */
  getPaymasterStubData: protectedProcedure
    .input(
      z.object({
        userOp: UserOperationSchema.omit({
          paymasterAndData: true,
          signature: true,
        }).extend({
          signature: z.string().optional(),
        }),
        entryPoint: address,
        sendAccountCalls: SendAccountCallsSchema.optional(),
      })
    )
    .mutation(
      async ({ ctx: { session, supabase }, input: { userOp, entryPoint, sendAccountCalls } }) => {
        const log = debug(
          `api:routers:sendSponsoredPaymaster:getPaymasterStubData:${session.user.id}`
        )

        if (entryPoint !== ENTRYPOINT_ADDRESS_V07) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Invalid entry point',
          })
        }

        // Ensure send account is valid
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

        // Validate that operation is whitelisted for sponsorship
        let isValidOperation = false

        // Try to decode as SendEarn deposit
        try {
          const depositArgs = decodeSendEarnDepositUserOp({
            userOp: { ...userOp, signature: (userOp.signature ?? '0x') as `0x${string}` },
          })
          if (isSendEarnVaultDeposit(depositArgs)) {
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
          } else if (isSendEarnFactoryDeposit(depositArgs)) {
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

        // If not SendEarn, try to validate as send token upgrade
        if (!isValidOperation && sendAccountCalls) {
          const [approval, deposit] = sendAccountCalls

          if (approval && deposit) {
            if (
              approval.dest === sendTokenV0Address[sendAccount.chain_id] &&
              approval.data.startsWith('0x095ea7b3') && // approve(address,uint256)
              deposit.dest === sendTokenV0LockboxAddress[sendAccount.chain_id] &&
              deposit.data.startsWith('0xb6b55f25') // deposit(uint256)
            ) {
              const _calldata = encodeFunctionData({
                abi: sendAccountAbi,
                functionName: 'executeBatch',
                args: [sendAccountCalls],
              })
              if (userOp.callData === _calldata) {
                log('Validated as send token upgrade')
                isValidOperation = true
              } else {
                log('callData mismatch for send token upgrade')
              }
            }
          }
        }

        if (!isValidOperation) {
          log('Operation is not whitelisted for gas sponsorship')
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Operation is not whitelisted for gas sponsorship',
          })
        }

        log('Generating stub paymaster data for sponsored gas')

        const paymasterAddress = sendVerifyingPaymasterAddress[sendAccount.chain_id]

        // Stub paymasterAndData for gas estimation
        const paymasterAndData = concat([
          paymasterAddress,
          encodePacked(
            ['uint128', 'uint128'],
            [VERIFYING_PAYMASTER_VERIFICATION_GAS_LIMIT, VERIFYING_PAYMASTER_POSTOP_GAS_LIMIT]
          ),
        ])

        return {
          paymasterAndData,
          paymasterVerificationGasLimit: VERIFYING_PAYMASTER_VERIFICATION_GAS_LIMIT,
          paymasterPostOpGasLimit: VERIFYING_PAYMASTER_POSTOP_GAS_LIMIT,
        }
      }
    ),
  /**
   * pm_getPaymasterData - ERC-7677 compliant method
   *
   * Returns final paymaster data with signature for sponsored gas.
   * Validates that the operation is whitelisted and signs the paymaster data.
   */
  getPaymasterData: protectedProcedure
    .input(
      z.object({
        userOp: UserOperationSchema.omit({
          paymasterAndData: true,
          signature: true,
        }).extend({
          signature: z.string().optional(),
        }),
        entryPoint: address,
        sendAccountCalls: SendAccountCallsSchema.optional(),
      })
    )
    .mutation(
      async ({ ctx: { session, supabase }, input: { userOp, entryPoint, sendAccountCalls } }) => {
        const log = debug(`api:routers:sendSponsoredPaymaster:getPaymasterData:${session.user.id}`)

        if (entryPoint !== ENTRYPOINT_ADDRESS_V07) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Invalid entry point',
          })
        }

        // Ensure send account is valid
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

        // Validate that operation is whitelisted for sponsorship
        let isValidOperation = false

        // Try to decode as SendEarn deposit
        try {
          const depositArgs = decodeSendEarnDepositUserOp({
            userOp: { ...userOp, signature: (userOp.signature ?? '0x') as `0x${string}` },
          })
          if (isSendEarnVaultDeposit(depositArgs)) {
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
          } else if (isSendEarnFactoryDeposit(depositArgs)) {
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

        // If not SendEarn, try to validate as send token upgrade
        if (!isValidOperation && sendAccountCalls) {
          const [approval, deposit] = sendAccountCalls

          if (approval && deposit) {
            if (
              approval.dest === sendTokenV0Address[sendAccount.chain_id] &&
              approval.data.startsWith('0x095ea7b3') && // approve(address,uint256)
              deposit.dest === sendTokenV0LockboxAddress[sendAccount.chain_id] &&
              deposit.data.startsWith('0xb6b55f25') // deposit(uint256)
            ) {
              const _calldata = encodeFunctionData({
                abi: sendAccountAbi,
                functionName: 'executeBatch',
                args: [sendAccountCalls],
              })
              if (userOp.callData === _calldata) {
                log('Validated as send token upgrade')
                isValidOperation = true
              } else {
                log('callData mismatch for send token upgrade')
              }
            }
          }
        }

        if (!isValidOperation) {
          log('Operation is not whitelisted for gas sponsorship')
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Operation is not whitelisted for gas sponsorship',
          })
        }

        log('Generating paymaster data with signature for sponsored gas')

        // Create paymaster signature
        const validUntil = Math.floor((Date.now() + 1000 * 120) / 1000) // Valid for 2 minutes
        const validAfter = 0
        const paymasterAddress = sendVerifyingPaymasterAddress[sendAccount.chain_id]

        // Create complete userOp for hashing
        const userOpForHash = {
          ...userOp,
          signature: (userOp.signature ?? '0x') as `0x${string}`,
          paymasterVerificationGasLimit: VERIFYING_PAYMASTER_VERIFICATION_GAS_LIMIT,
          paymasterPostOpGasLimit: VERIFYING_PAYMASTER_POSTOP_GAS_LIMIT,
        }

        const paymasterUserOpHash = await paymasterClient
          .readContract({
            address: paymasterAddress,
            abi: sendVerifyingPaymasterAbi,
            functionName: 'getHash',
            args: [packUserOp(userOpForHash), validUntil, validAfter],
          })
          .catch((e) => {
            log('getHash error', e)
            throw new TRPCError({
              code: 'INTERNAL_SERVER_ERROR',
              message: 'Failed to get paymaster hash',
            })
          })

        const signature = await account.signMessage({ message: { raw: paymasterUserOpHash } })

        const paymasterData = concat([
          encodeAbiParameters([{ type: 'uint48' }, { type: 'uint48' }], [validUntil, validAfter]),
          signature,
        ])

        const paymasterAndData = concat([
          paymasterAddress,
          encodePacked(
            ['uint128', 'uint128'],
            [VERIFYING_PAYMASTER_VERIFICATION_GAS_LIMIT, VERIFYING_PAYMASTER_POSTOP_GAS_LIMIT]
          ),
          paymasterData,
        ])

        log('Generated paymaster data with signature')

        return {
          paymasterAndData,
          paymasterVerificationGasLimit: VERIFYING_PAYMASTER_VERIFICATION_GAS_LIMIT,
          paymasterPostOpGasLimit: VERIFYING_PAYMASTER_POSTOP_GAS_LIMIT,
          sponsor: {
            name: 'Send',
            icon: 'https://send.it/favicon.ico',
          },
        }
      }
    ),
})
