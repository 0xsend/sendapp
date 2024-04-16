import {
  baseMainnet,
  baseMainnetClient,
  config,
  sendAccountFactoryAbi,
  sendAccountFactoryAddress,
  sendTokenAbi,
  tokenPaymasterAddress,
  usdcAddress,
} from '@my/wagmi'
import { base16 } from '@scure/base'
import { TRPCError } from '@trpc/server'
import { waitForTransactionReceipt } from '@wagmi/core'
import { base16Regex } from 'app/utils/base16Regex'
import { COSEECDHAtoXY } from 'app/utils/passkeys'
import {
  USEROP_KEY_SLOT,
  USEROP_SALT,
  getSendAccountCreateArgs,
  entrypoint,
} from 'app/utils/userop'
import debug from 'debug'
import { getSenderAddress } from 'permissionless'
import {
  concat,
  createWalletClient,
  encodeFunctionData,
  http,
  maxUint256,
  zeroAddress,
  publicActions,
  getAbiItem,
  withRetry,
} from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '../trpc'

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
        const factoryData = encodeFunctionData({
          abi: [getAbiItem({ abi: sendAccountFactoryAbi, name: 'createAccount' })],
          args: getSendAccountCreateArgs(xyPubKey),
        })
        const initCode = concat([factory, factoryData])
        const senderAddress = await getSenderAddress(baseMainnetClient, {
          factory,
          factoryData,
          entryPoint: entrypoint.address,
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

        // @todo ensure address is not already deployed
        // throw new TRPCError({
        //   code: 'INTERNAL_SERVER_ERROR',
        //   message: 'Address already deployed',
        // })

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

        await withRetry(
          async function createAccount() {
            const { request } = await sendAccountFactoryClient.simulateContract({
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

            log('tx request', request)

            const hash = await sendAccountFactoryClient.writeContract(request)

            log('hash', hash)

            await waitForTransactionReceipt(config, {
              chainId: baseMainnetClient.chain.id,
              hash,
            }).catch((e) => {
              log('waitForTransactionReceipt', e)
              throw e
            })
          },
          {
            retryCount: 20,
            delay: ({ count, error }) => {
              const backoff = 500 + Math.random() * 100 // add some randomness to the backoff
              log('delay', 'backoff', `count=${count} backoff=${backoff} error=${error}`)
              return backoff
            },
            shouldRetry({ count, error }) {
              // @todo handle other errors like balance not enough, invalid nonce, etc
              log('shouldRetry', count, error)
              if (error.message.includes('Failed to create send account')) {
                return false
              }
              return true
            },
          }
        ).catch((e) => {
          log('waitForTransactionReceipt', e)
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: e.message })
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

        log('create_send_account', 'done', '@todo add hash')

        if (error) {
          log('create_send_account error', error)
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: error.message,
          })
        }

        return { success: true }
      }
    ),
})
