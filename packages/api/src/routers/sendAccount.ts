import {
  baseMainnet,
  baseMainnetClient,
  entryPointAbi,
  entryPointAddress,
  sendAccountFactoryAbi,
  sendAccountFactoryAddress,
  sendTokenAbi,
  sendTokenV0Address,
  sendTokenV0LockboxAddress,
  tokenPaymasterAddress,
  usdcAddress,
} from '@my/wagmi'
import { base16 } from '@scure/base'
import { TRPCError } from '@trpc/server'
import { base16Regex } from 'app/utils/base16Regex'
import { hexToBytea } from 'app/utils/hexToBytea'
import { COSEECDHAtoXY } from 'app/utils/passkeys'
import { supabaseAdmin } from 'app/utils/supabase/admin'
import { throwIf } from 'app/utils/throwIf'
import { USEROP_SALT, getSendAccountCreateArgs } from 'app/utils/userop'
import debug from 'debug'
import PQueue from 'p-queue'
import { getSenderAddress, type UserOperation } from 'permissionless'
import {
  type Address,
  concat,
  createWalletClient,
  encodeFunctionData,
  getAbiItem,
  type Hex,
  http,
  maxUint256,
  pad,
  publicActions,
  toHex,
  withRetry,
  zeroAddress,
} from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '../trpc'
import { address } from 'app/utils/zod'
import { SendAccountCallsSchema, UserOperationSchema } from 'app/utils/zod/evm'

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
          send_account: {
            address: senderAddress,
            chain_id: baseMainnetClient.chain.id,
            init_code,
          },
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
   * Executes a send account user op for upgrading a send token.
   *
   * Requires the user send the userop, plus the send account calls to prove
   * it's for upgrading the send token. This is so we don't inadvertently
   * sponsor userops for other methods.
   */
  upgradeSendToken: protectedProcedure
    .input(
      z.object({
        /**
         * The signed user op to execute on the entry point.
         */
        userop: UserOperationSchema,
        /**
         * The send account calls to prove the userop is for upgrading the send token.
         */
        sendAccountCalls: SendAccountCallsSchema,
        entryPoint: address,
      })
    )
    .mutation(
      async ({ ctx: { session, supabase }, input: { userop, sendAccountCalls, entryPoint } }) => {
        const log = debug(`api:routers:sendTokenUpgrade:${session.user.id}`)

        log('Received send token upgrade userop', { userop, sendAccountCalls, entryPoint })

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
        // ensure send account calls are for send token upgrade
        // 1. approve send token v0 to lockbox
        // 2. call lockbox.deposit
        const [approval, deposit] = sendAccountCalls

        if (!approval || !deposit) {
          log('send account calls are not valid')
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Send account calls are not valid',
          })
        }

        if (
          approval.dest !== sendTokenV0Address[sendAccount.chain_id] ||
          !approval.data.startsWith('0x095ea7b3') // approve(address,uint256)
        ) {
          log('approval.dest is not send token v0')
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Approval call is not for send token v0',
          })
        }
        if (
          deposit.dest !== sendTokenV0LockboxAddress[sendAccount.chain_id] ||
          !deposit.data.startsWith('0xb6b55f25') // deposit(uint256)
        ) {
          log('deposit.dest is not send token v0 lockbox')
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Deposit call is not for send token v0 lockbox',
          })
        }

        // TODO: deploy verifiying paymaster and provide the signed paymasterAndData

        // execute userop
        const { request } = await sendAccountFactoryClient
          .simulateContract({
            address: entryPointAddress[sendAccount.chain_id],
            abi: entryPointAbi,
            functionName: 'handleOps',
            args: [[packUserOp(userop)], account.address],
          })
          .catch((e) => {
            log('createAccount', 'simulateContract', e)
            throw e
          })
        const hash = await withRetry(
          async function sendTokenUpgrade() {
            const hash = await nonceQueue.add(async () => {
              log('sendTokenUpgrade queue', 'start')
              const nonce = await sendAccountFactoryClient
                .getTransactionCount({
                  address: account.address,
                  blockTag: 'pending',
                })
                .catch((e) => {
                  log('sendTokenUpgrade queue', 'getTransactionCount', e)
                  throw e
                })
              log('sendTokenUpgrade queue', 'tx request', `nonce=${nonce}`)
              const hash = await sendAccountFactoryClient
                .writeContract({
                  ...request,
                  nonce: nonce,
                })
                .catch((e) => {
                  log('sendTokenUpgrade queue', 'writeContract', e)
                  throw e
                })

              log('sendTokenUpgrade queue', `hash=${hash}`)
              return hash
            })

            log('sendTokenUpgrade', `hash=${hash}`)

            return hash
          },
          {
            retryCount: 20,
            delay: ({ count, error }) => {
              const backoff = 500 + Math.random() * 100 // add some randomness to the backoff
              log(`sendTokenUpgrade delay count=${count} backoff=${backoff} error=${error}`)
              return backoff
            },
            shouldRetry({ count, error }) {
              // @todo handle other errors like balance not enough, invalid nonce, etc
              console.error('sendTokenUpgrade failed', count, error)
              if (error.message.includes('Failed to create send account')) {
                return false
              }
              return true
            },
          }
        ).catch((e) => {
          log('sendTokenUpgrade failed', e)
          console.error('sendTokenUpgrade failed', e)
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: e.message })
        })

        if (!hash) {
          log('sendTokenUpgrade', 'hash is null')
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to create send account',
          })
        }

        log('sendTokenUpgrade', `hash=${hash}`)

        await withRetry(
          async function waitForTransactionReceipt() {
            const { count, error } = await supabaseAdmin
              .from('send_token_v0_transfers')
              .select('*', { count: 'exact', head: true })
              .eq('tx_hash', hexToBytea(hash as `0x${string}`))
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
      }
    ),
})

function packUserOp(op: UserOperation<'v0.7'>): {
  sender: Address
  nonce: bigint
  initCode: Hex
  callData: Hex
  accountGasLimits: Hex
  preVerificationGas: bigint
  gasFees: Hex
  paymasterAndData: Hex
  signature: Hex
} {
  let paymasterAndData: Hex
  if (!op.paymaster) {
    paymasterAndData = '0x'
  } else {
    if (!op.paymasterVerificationGasLimit || !op.paymasterPostOpGasLimit) {
      throw new Error('paymaster with no gas limits')
    }
    paymasterAndData = packPaymasterData({
      paymaster: op.paymaster,
      paymasterVerificationGasLimit: op.paymasterVerificationGasLimit,
      paymasterPostOpGasLimit: op.paymasterPostOpGasLimit,
      paymasterData: op.paymasterData,
    })
  }
  return {
    sender: op.sender,
    nonce: BigInt(op.nonce),
    initCode: op.factory ?? '0x',
    callData: op.callData,
    accountGasLimits: concat([
      pad(toHex(op.verificationGasLimit), { size: 16 }),
      pad(toHex(op.callGasLimit), { size: 16 }),
    ]),
    preVerificationGas: BigInt(op.preVerificationGas),
    gasFees: concat([
      pad(toHex(op.maxPriorityFeePerGas), { size: 16 }),
      pad(toHex(op.maxFeePerGas), { size: 16 }),
    ]),
    paymasterAndData,
    signature: op.signature,
  }
}

function packPaymasterData({
  paymaster,
  paymasterVerificationGasLimit,
  paymasterPostOpGasLimit,
  paymasterData,
}: {
  paymaster: Hex
  paymasterVerificationGasLimit: bigint
  paymasterPostOpGasLimit: bigint
  paymasterData?: Hex
}): Hex {
  return paymaster
    ? concat([
        paymaster,
        pad(toHex(paymasterVerificationGasLimit || 0n), { size: 16 }),
        pad(toHex(paymasterPostOpGasLimit || 0n), { size: 16 }),
        paymasterData ?? '0x',
      ])
    : '0x'
}
