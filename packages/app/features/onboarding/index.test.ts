import { expect, test } from '@jest/globals'

import { baseMainnetClient, baseMainnetBundlerClient as bundlerClient } from 'app/utils/viem/client'
import { daimoAccountFactoryABI } from '@my/wagmi'
import debug from 'debug'
export const log = debug('app:features:onboarding:screen')
import crypto from 'node:crypto'
import {
  Hex,
  PublicClient,
  bytesToHex,
  concat,
  createWalletClient,
  encodeAbiParameters,
  getAbiItem,
  hexToBytes,
  http,
  ContractFunctionExecutionError,
  ContractFunctionRevertedError,
  decodeEventLog,
  formatEther,
} from 'viem'
import { privateKeyToAccount } from 'viem/accounts'

import { encodeFunctionData, getContract, createTestClient, parseEther, numberToBytes } from 'viem'
import { daimoAccountABI, iEntryPointABI } from '@my/wagmi'
import { generatePrivateKey } from 'viem/accounts'
import { base64urlnopad } from '@scure/base'
import { USEROP_VALID_UNTIL, generateUserOp } from 'app/utils/userop'
import SuperJSON from 'superjson'

const privateKey = generatePrivateKey()
const dummyAccount = privateKeyToAccount(privateKey)
const walletClient = createWalletClient({
  chain: baseMainnetClient.chain,
  transport: http(baseMainnetClient.transport.url),
  account: dummyAccount,
})

const receiverAccount = privateKeyToAccount(generatePrivateKey())
console.log('receiverAccount.address', receiverAccount.address)

const testClient = createTestClient({
  chain: baseMainnetClient.chain,
  transport: http(baseMainnetClient.transport.url),
  mode: 'anvil',
})
const daimoAccountFactoryAddress = '0x0DCd1Bf9A1b36cE34237eEaFef220932846BCD82'

const daimoAccountFactory = getContract({
  abi: daimoAccountFactoryABI,
  publicClient: baseMainnetClient,
  address: daimoAccountFactoryAddress,
})

const entrypoint = getContract({
  abi: [getAbiItem({ abi: iEntryPointABI, name: 'getUserOpHash' })],
  publicClient: baseMainnetClient,
  address: '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789',
})

test('can create a new account', async () => {
  console.log('dummyAccount.address', dummyAccount.address)

  // Viem
  const chain = baseMainnetClient.chain
  const publicClient = baseMainnetClient
  console.log(`Connected to ${chain.name}, ${publicClient.transport.url}`)

  // Generate keypair
  const p256 = { name: 'ECDSA', namedCurve: 'P-256', hash: 'SHA-256' }
  const key = await crypto.subtle.generateKey(p256, true, ['sign', 'verify'])
  const pubKeyDer = await crypto.subtle.exportKey('spki', key.publicKey)
  const pubKeyHex = Buffer.from(pubKeyDer).toString('hex')
  console.log(`Generated pubkey: ${pubKeyHex}`)

  // Daimo account
  const signer = async (challenge: Hex) => {
    console.log(`Signing message: ${challenge}`)
    const bChallenge = hexToBytes(challenge)
    const challengeB64URL = base64urlnopad.encode(bChallenge)

    const clientDataJSON = JSON.stringify({
      type: 'webauthn.get',
      challenge: challengeB64URL,
      origin: 'daimo.com',
    })

    // const clientDataHash = new Uint8Array(
    //   await Crypto.digest(
    //     Crypto.CryptoDigestAlgorithm.SHA256,
    //     new TextEncoder().encode(clientDataJSON)
    //   )
    // );
    const clientDataHash = await crypto.subtle.digest('SHA-256', Buffer.from(clientDataJSON))

    const authenticatorData = new Uint8Array(37) // rpIdHash (32) + flags (1) + counter (4)
    authenticatorData[32] = 5 // flags: user present (1) + user verified (4)
    const message = concat([authenticatorData, new Uint8Array(clientDataHash)])

    const sigRaw = await crypto.subtle.sign(p256, key.privateKey, Buffer.from(message))

    // DER encode
    const r = Buffer.from(sigRaw).subarray(0, 32).toString('hex')
    const s = Buffer.from(sigRaw).subarray(32, 64).toString('hex')

    const challengeLocation = BigInt(clientDataJSON.indexOf('"challenge":'))
    const responseTypeLocation = BigInt(clientDataJSON.indexOf('"type":'))

    const signatureStruct = getAbiItem({
      abi: daimoAccountABI,
      name: 'signatureStruct',
    }).inputs

    const sigStruct = {
      authenticatorData: bytesToHex(authenticatorData),
      clientDataJSON,
      challengeLocation,
      responseTypeLocation,
      r: BigInt(`0x${r}`),
      s: BigInt(`0x${s}`),
    }

    console.log('Signature struct:', sigStruct)

    const encodedSig = encodeAbiParameters(signatureStruct, [sigStruct])

    return {
      keySlot: 0,
      encodedSig,
    }
  }

  const pubKey = Buffer.from(pubKeyHex.substring(54), 'hex')
  if (pubKey.length !== 64) {
    throw new Error('Invalid public key, wrong length')
  }

  const key1 = `0x${pubKey.subarray(0, 32).toString('hex')}` as Hex
  const key2 = `0x${pubKey.subarray(32).toString('hex')}` as Hex
  const salt = 0n
  const args = [0, [key1, key2], [], salt] as const

  const address = await daimoAccountFactory.read.getAddress(args)
  console.log(`Daimo account address: ${address}`)

  console.log('Prefunding account. Setting balance...')
  await testClient.setBalance({
    address: address,
    value: parseEther('100'),
  })

  // await deployAccount(args, publicClient, addr)

  const { userOp, userOpHash } = await generateUserOp([key1, key2])

  console.log('UserOp:', SuperJSON.stringify(userOp))

  // get userop hash
  // const userOpHash = await entrypoint.read.getUserOpHash([userOp])
  console.log(`UserOp hash: ${userOpHash}`)

  console.log('Signing userOp...')
  const bVersion = numberToBytes(1, { size: 1 })
  const bValidUntil = numberToBytes(USEROP_VALID_UNTIL, { size: 6 })
  const bOpHash = hexToBytes(userOpHash)
  const bMsg = concat([bVersion, bValidUntil, bOpHash])
  const { keySlot, encodedSig } = await signer(bytesToHex(bMsg))
  const bKeySlot = numberToBytes(keySlot, { size: 1 })
  const signature = bytesToHex(concat([bVersion, bValidUntil, bKeySlot, hexToBytes(encodedSig)]))

  const _userOp = {
    ...userOp,
    signature: signature,
  }
  if (userOpHash !== (await entrypoint.read.getUserOpHash([_userOp]))) {
    throw new Error('Invalid signature')
  }
  // always reverts
  await baseMainnetClient
    .simulateContract({
      address: entrypoint.address,
      functionName: 'simulateValidation',
      abi: iEntryPointABI,
      args: [_userOp],
    })
    .catch((e: ContractFunctionExecutionError) => {
      const cause: ContractFunctionRevertedError = e.cause
      if (cause.data?.errorName !== 'ValidationResult') {
        throw e
      }
      const validationResult = cause.data.args?.[0]
      console.log('Validation result:', validationResult)
    })

  // submit userop
  const _userOpHash = await bundlerClient.sendUserOperation({
    userOperation: _userOp,
    entryPoint: entrypoint.address,
  })

  const userOpReceipt = await bundlerClient.waitForUserOperationReceipt({ hash: _userOpHash })
  console.log('userOpReceipt', userOpReceipt)

  if (!userOpReceipt.success) {
    console.error('UserOp failed:', userOpReceipt)
  }

  const txReceipt = await baseMainnetClient.getTransactionReceipt({
    hash: userOpReceipt.receipt.transactionHash,
  })

  for (const log of txReceipt.logs) {
    try {
      console.log(
        'event emitted',
        decodeEventLog({
          abi: iEntryPointABI,
          data: log.data,
          topics: log.topics,
        })
      )
    } catch (e) {
      console.error('error decoding event log', e)
    }
  }

  const senderBalance = await baseMainnetClient.getBalance({ address: address })
  const receiverBalance = await baseMainnetClient.getBalance({ address: receiverAccount.address })

  console.log('senderBalance', formatEther(senderBalance))
  console.log('receiverBalance', formatEther(receiverBalance))
}, 60_000)

test('can create a new account with bundler', async () => {
  const supportedEntryPoints = await bundlerClient.supportedEntryPoints()
  console.log('supportedEntryPoints', supportedEntryPoints)
  log('TODO: implement bundler test', supportedEntryPoints)
})

test('can get gas user operation gas prices', async () => {
  const gasPrice = await baseMainnetClient.getGasPrice()
  expect(gasPrice).toBeDefined()
  log('gasPrice', gasPrice)
})

// async function deployAccount(args: , publicClient, addr: string) {
//   await testClient.setBalance({
//     address: dummyAccount.address,
//     value: parseEther('100'),
//   })

//   // Deploy account
//   const { request } = await baseMainnetClient.simulateContract({
//     account: dummyAccount,
//     address: daimoAccountFactoryAddress,
//     abi: daimoAccountFactoryABI,
//     functionName: 'createAccount',
//     args: args,
//     value: 0n,
//   })
//   const hash = await walletClient.writeContract(request)
//   console.log(`[API] deploy transaction ${hash}`)
//   const tx = await publicClient.waitForTransactionReceipt({ hash, confirmations: 3 })
//   console.log(`[API] deploy transaction ${tx.status}`)

//   const depositTxHash = await walletClient.writeContract({
//     address: entrypoint.address,
//     abi: iEntryPointABI,
//     functionName: 'depositTo',
//     args: [addr],
//     value: parseEther('1'), // 0.01 ETH
//   })
//   console.log(`Faucet deposited prefund: ${depositTxHash}`)
//   await waitForTx(publicClient as PublicClient, depositTxHash)
// }

async function waitForTx(publicClient: PublicClient, hash: Hex) {
  const receipt = await publicClient.waitForTransactionReceipt({
    hash,
    timeout: 30000,
    confirmations: 3,
  })
  console.log(`...status: ${receipt.status}`)
}
