import {
  baseMainnet,
  baseMainnetClient,
  entryPointAddress,
  sendAccountAbi,
  sendAccountFactoryAbi,
  sendAccountFactoryAddress,
  sendTokenAbi,
  sendTokenV0Address,
  sendTokenV0LockboxAddress,
  sendVerifyingPaymasterAbi,
  sendVerifyingPaymasterAddress,
  tokenPaymasterAddress,
  usdcAddress,
} from '@my/wagmi'
import {
  decodeSendEarnDepositUserOp,
  isFactoryDeposit as isSendEarnFactoryDeposit,
  isVaultDeposit as isSendEarnVaultDeposit,
} from 'app/utils/decodeSendEarnDepositUserOp'
import { base16 } from '@scure/base'
import { TRPCError } from '@trpc/server'
import { base16Regex } from 'app/utils/base16Regex'
import { hexToBytea } from 'app/utils/hexToBytea'
import { COSEECDHAtoXY } from 'app/utils/passkeys'
import { createSupabaseAdminClient } from 'app/utils/supabase/admin'
import { throwIf } from 'app/utils/throwIf'
import { USEROP_SALT, getSendAccountCreateArgs, packUserOp } from 'app/utils/userop'
import debug from 'debug'
import PQueue from 'p-queue'
import { getSenderAddress } from 'permissionless'
import {
  concat,
  createWalletClient,
  encodeAbiParameters,
  encodeFunctionData,
  getAbiItem,
  type Hex,
  http,
  isAddress,
  maxUint256,
  parseUnits,
  publicActions,
  withRetry,
  zeroAddress,
} from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '../trpc'
import { address } from 'app/utils/zod'
import { SendAccountCallsSchema, UserOperationSchema } from 'app/utils/zod/evm'
import type { Database } from '@my/supabase/database.types'

const SEND_ACCOUNT_FACTORY_PRIVATE_KEY = process.env
  .SEND_ACCOUNT_FACTORY_PRIVATE_KEY as `0x${string}`
if (!SEND_ACCOUNT_FACTORY_PRIVATE_KEY) {
  throw new Error('SEND_ACCOUNT_FACTORY_PRIVATE_KEY is required')
}
const account = privateKeyToAccount(process.env.SEND_ACCOUNT_FACTORY_PRIVATE_KEY as `0x${string}`)
const sendAccountFactoryClient = createWalletClient({
  account,
  chain: baseMainnet,
  transport: http(baseMainnetClient.transport.url),
}).extend(publicActions)

const MINIMUM_USDC_VAULT_DEPOSIT = parseUnits('5', 6) // 5 USDC

// nonce storage to avoid nonce conflicts
const nonceQueue = new PQueue({ concurrency: 1 })

export const sendAccountRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        accountName: z.string().min(1).trim(),
        // passkeyName format `${user.id}.${keySlot}` where user.id is a UUID and keySlot is a number
        passkeyName: z.string().min(1).trim(),
        rawCredentialIDB16: z.string().regex(base16Regex, 'Invalid base16 string'),
        cosePublicKeyB16: z.string().regex(base16Regex, 'Invalid base16 string'),
        rawAttestationObjectB16: z.string().regex(base16Regex, 'Invalid base16 string'),
        keySlot: z.number().min(0).max(255),
      })
    )
    .mutation(
      async ({
        ctx: { session, supabase },
        input: {
          accountName,
          passkeyName,
          rawCredentialIDB16,
          cosePublicKeyB16,
          rawAttestationObjectB16,
          keySlot,
        },
      }) => {
        const log = debug(`api:routers:sendAccount:${session.user.id}`)
        const { error: sendAcctCountErr, count: sendAcctCount } = await supabase
          .from('send_accounts')
          .select('*', { count: 'exact', head: true })

        if (sendAcctCountErr) {
          throw sendAcctCountErr
        }

        if (sendAcctCount !== null && sendAcctCount > 0) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Account already exists',
          })
        }

        const xyPubKey = COSEECDHAtoXY(base16.decode(cosePublicKeyB16))
        const factory = sendAccountFactoryAddress[baseMainnetClient.chain.id]
        const entryPoint = entryPointAddress[baseMainnetClient.chain.id]
        const factoryData = encodeFunctionData({
          abi: [getAbiItem({ abi: sendAccountFactoryAbi, name: 'createAccount' })],
          args: getSendAccountCreateArgs(xyPubKey),
        })
        const initCode = concat([factory, factoryData])
        const senderAddress = await getSenderAddress(baseMainnetClient, {
          factory,
          factoryData,
          entryPoint,
        })
        const raw_credential_id = `\\x${rawCredentialIDB16}`
        const public_key = `\\x${cosePublicKeyB16}`
        const attestation_object = `\\x${rawAttestationObjectB16}`
        const init_code = `\\x${initCode.slice(2)}`

        log('sendAccount create', {
          accountName,
          passkeyName,
          rawCredentialIDB64: rawCredentialIDB16,
          cosePublicKeyB16: cosePublicKeyB16,
          rawAttestationObjectB64: rawAttestationObjectB16,
          keySlot,
        })

        // ensure passkeyName is valid and expected format
        const [uid, keySlotStr] = passkeyName.split('.')
        if (
          (!uid && uid !== session.user.id) || // user id is not the same as the session user id
          !keySlotStr || // key slot is not a string
          !Number.isSafeInteger(Number(keySlotStr)) || // key slot is not a number
          !(Number(keySlotStr) >= 0 && Number(keySlotStr) <= 255) || // key slot is not between 0 and 255
          !(keySlot === Number(keySlotStr)) // key slot is not the same as the one in the passkey name
        ) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Invalid passkey name',
          })
        }

        // ensure sender address is not falsy
        if (!senderAddress) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to get sender address',
          })
        }

        // ensure sender address is not zero address
        if (senderAddress === zeroAddress) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Zero sender address',
          })
        }

        const contractDeployed = await sendAccountFactoryClient.getCode({
          address: senderAddress,
        })
        log('createAccount', 'contractDeployed', contractDeployed)
        if (contractDeployed) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Address already deployed',
          })
        }

        const initCalls = [
          // approve USDC to paymaster
          {
            dest: usdcAddress[baseMainnetClient.chain.id],
            value: 0n,
            data: encodeFunctionData({
              abi: sendTokenAbi,
              functionName: 'approve',
              args: [tokenPaymasterAddress[baseMainnetClient.chain.id], maxUint256],
            }),
          },
        ]

        const { request } = await sendAccountFactoryClient
          .simulateContract({
            address: sendAccountFactoryAddress[sendAccountFactoryClient.chain.id],
            abi: sendAccountFactoryAbi,
            functionName: 'createAccount',
            args: [
              keySlot, // key slot
              xyPubKey, // public key
              initCalls, // init calls
              USEROP_SALT, // salt
            ],
            value: 0n,
          })
          .catch((e) => {
            log('createAccount', 'simulateContract', e)
            throw e
          })

        const hash = await withRetry(
          async function createAccount() {
            const hash = await nonceQueue.add(async () => {
              log('createAccount queue', 'start')
              const nonce = await sendAccountFactoryClient
                .getTransactionCount({
                  address: account.address,
                  blockTag: 'pending',
                })
                .catch((e) => {
                  log('createAccount queue', 'getTransactionCount', e)
                  throw e
                })
              log('createAccount queue', 'tx request', `nonce=${nonce}`)
              const hash = await sendAccountFactoryClient
                .writeContract({
                  ...request,
                  nonce: nonce,
                })
                .catch((e) => {
                  log('createAccount queue', 'writeContract', e)
                  throw e
                })

              log('createAccount queue', `hash=${hash}`)
              return hash
            })

            log('createAccount', `hash=${hash}`)

            return hash
          },
          {
            retryCount: 20,
            delay: ({ count, error }) => {
              const backoff = 500 + Math.random() * 100 // add some randomness to the backoff
              log(`createAccount delay count=${count} backoff=${backoff} error=${error}`)
              return backoff
            },
            shouldRetry({ count, error }) {
              // @todo handle other errors like balance not enough, invalid nonce, etc
              console.error('createAccount failed', count, error)
              if (error.message.includes('Failed to create send account')) {
                return false
              }
              return true
            },
          }
        ).catch((e) => {
          log('createAccount failed', e)
          console.error('createAccount failed', e)
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: e.message })
        })

        if (!hash) {
          log('createAccount', 'hash is null')
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to create send account',
          })
        }

        log('createAccount', `hash=${hash}`)

        await withRetry(
          async function waitForTransactionReceipt() {
            const supabaseAdmin = createSupabaseAdminClient()
            const { count, error } = await supabaseAdmin
              .from('send_account_created')
              .select('*', { count: 'exact', head: true })
              .eq('tx_hash', hexToBytea(hash as `0x${string}`))
              .eq('account', hexToBytea(senderAddress))
              .single()
            throwIf(error)
            log('waitForTransactionReceipt', `hash=${hash}`, `count=${count}`)
            return count
          },
          {
            retryCount: 20,
            delay: ({ count, error }) => {
              const backoff = 500 + Math.random() * 100 // add some randomness to the backoff
              log(`waitForTransactionReceipt delay count=${count} backoff=${backoff}`, error)
              return backoff
            },
            shouldRetry({ count, error }) {
              // @todo handle other errors like balance not enough, invalid nonce, etc
              console.error('waitForTransactionReceipt failed', { count, error, hash })
              if (error.message.includes('Failed to create send account')) {
                return false
              }
              return true
            },
          }
        ).catch((e) => {
          log('waitForTransactionReceipt failed', e)
          console.error('waitForTransactionReceipt failed', e)
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: e.message ? e.message : 'Failed waiting for transaction receipt',
          })
        })

        const { error } = await supabase.rpc('create_send_account', {
          // @ts-expect-error the database provides the other fields
          send_account: {
            address: senderAddress,
            chain_id: baseMainnetClient.chain.id,
            init_code,
          },
          // @ts-expect-error the database provides the other fields
          webauthn_credential: {
            name: passkeyName,
            display_name: accountName,
            raw_credential_id,
            public_key,
            sign_count: 0,
            attestation_object,
            key_type: 'ES256',
          },
          key_slot: keySlot,
        })

        if (error) {
          console.error('create_send_account error', error)
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: error.message,
          })
        }

        return { success: true }
      }
    ),
  /**
   * Requests a signature for a user op from the paymaster.
   *
   * This endpoint sponsors gas for whitelisted operations:
   * 1. Send token V0 upgrade operations
   * 2. SendEarn deposit operations
   *
   * The userop is validated to ensure it's for an approved operation before signing.
   */
  paymasterSign: protectedProcedure
    .input(
      z.object({
        /**
         * The user op to execute on the entry point.
         */
        userop: UserOperationSchema,
        /**
         * Optional: The send account calls for send token upgrade.
         * Required for send token upgrade, not needed for SendEarn deposits.
         */
        sendAccountCalls: SendAccountCallsSchema.optional(),
        entryPoint: address,
      })
    )
    .mutation(
      async ({ ctx: { session, supabase }, input: { userop, sendAccountCalls, entryPoint } }) => {
        const log = debug(`api:routers:sendAccount:paymasterSign:${session.user.id}`)

        log('Received paymaster sign request', { userop, sendAccountCalls, entryPoint })

        // ensure send account is valid
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

        // Determine operation type and validate
        let isValidOperation = false

        // Try to decode as SendEarn deposit
        try {
          const depositArgs = decodeSendEarnDepositUserOp({ userOp: userop })
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
            // Referrer can be zero address (no referral), so we don't validate it
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
              if (userop.callData === _calldata) {
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

        // Create paymaster signature
        const validUntil = Math.floor((Date.now() + 1000 * 120) / 1000)
        const validAfter = 0
        const paymasterAddress = sendVerifyingPaymasterAddress[sendAccount.chain_id]
        const paymasterUserOpHash = await sendAccountFactoryClient
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
        const sig = await account.signMessage({ message: { raw: paymasterUserOpHash } })

        const paymasterData = concat([
          encodeAbiParameters([{ type: 'uint48' }, { type: 'uint48' }], [validUntil, validAfter]),
          sig,
        ])

        return {
          paymasterData,
        }
      }
    ),
  updateMainTag: protectedProcedure
    .input(
      z.object({
        tagId: z.number(),
        sendAccountId: z.string().min(1).trim(),
      })
    )
    .mutation(async ({ ctx: { supabase }, input: { tagId, sendAccountId } }) => {
      // Update main tag
      const { data: result, error: updateError } = await supabase
        .from('send_accounts')
        .update({ main_tag_id: tagId })
        .eq('id', sendAccountId)
        .select()
        .single()

      if (updateError) {
        console.error('Error updating main tag:', updateError)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: updateError.message,
        })
      }

      return result
    }),
})
