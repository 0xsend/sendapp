import { expect, test } from '@jest/globals'

import { baseMainnetClient, baseMainnetBundlerClient as bundlerClient } from 'app/utils/viem/client'
import debug from 'debug'

const log = debug('app:features:onboarding:screen')
import crypto from 'node:crypto'
import {
  Hex,
  PublicClient,
  bytesToHex,
  concat,
  encodeAbiParameters,
  getAbiItem,
  hexToBytes,
  ContractFunctionExecutionError,
  ContractFunctionRevertedError,
  parseEther,
  formatEther,
} from 'viem'

import { numberToBytes } from 'viem'
import { daimoAccountABI, iEntryPointABI } from '@my/wagmi'
import { base64urlnopad } from '@scure/base'
import {
  USEROP_VALID_UNTIL,
  USEROP_VERSION,
  daimoAccountFactory,
  entrypoint,
  generateUserOp,
  receiverAccount,
  testClient,
  verifier,
} from 'app/utils/userop'

jest.mock('@daimo/expo-passkeys', () => ({
  createPasskey: jest.fn(),
  signWithPasskey: jest.fn(),
}))

const signatureStruct = getAbiItem({
  abi: daimoAccountABI,
  name: 'signatureStruct',
}).inputs

async function createAccountAndVerifySignature() {
  // Generate keypair
  const keygen = { name: 'ECDSA', namedCurve: 'P-256', hash: 'SHA-256' }
  const key = await crypto.subtle.generateKey(keygen, true, ['sign', 'verify'])
  const pubKeyDer = await crypto.subtle.exportKey('spki', key.publicKey)
  const pubKeyHex = Buffer.from(pubKeyDer).toString('hex')

  // Daimo account
  const signer = async (challenge: Hex) => {
    const bChallenge = hexToBytes(challenge)
    const challengeB64URL = base64urlnopad.encode(bChallenge)
    const clientDataJSON = JSON.stringify({
      type: 'webauthn.get',
      challenge: challengeB64URL,
      origin: 'https://send.app.localhost',
    })
    const clientDataHash = await crypto.subtle.digest('SHA-256', Buffer.from(clientDataJSON))

    const authenticatorData = new Uint8Array(37) // rpIdHash (32) + flags (1) + counter (4)
    authenticatorData[32] = 5 // flags: user present (1) + user verified (4)
    const message = concat([authenticatorData, new Uint8Array(clientDataHash)])

    const sigRaw = await crypto.subtle.sign(keygen, key.privateKey, Buffer.from(message))

    // DER encode
    const r = BigInt(`0x${Buffer.from(sigRaw).subarray(0, 32).toString('hex')}`)
    let s = BigInt(`0x${Buffer.from(sigRaw).subarray(32, 64).toString('hex')}`)

    const n = BigInt('0xFFFFFFFF00000000FFFFFFFFFFFFFFFFBCE6FAADA7179E84F3B9CAC2FC632551')
    if (s > n / 2n) {
      s = n - s
    }

    const challengeLocation = BigInt(clientDataJSON.indexOf('"challenge":"'))
    const responseTypeLocation = BigInt(clientDataJSON.indexOf('"type":"webauthn.get"'))

    const sigStruct = {
      authenticatorData: bytesToHex(authenticatorData),
      clientDataJSON,
      challengeLocation,
      responseTypeLocation,
      r,
      s,
    }

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

  // Simulate user depositing funds to new account
  const address = await daimoAccountFactory.read.getAddress(args)
  await testClient.setBalance({
    address: address,
    value: parseEther('1'),
  })

  expect(await baseMainnetClient.getBalance({ address })).toBe(parseEther('1'))

  // await deployAccount(args, publicClient, addr)

  const { userOp, userOpHash } = await generateUserOp([key1, key2])

  const bVersion = numberToBytes(USEROP_VERSION, { size: 1 })
  const bValidUntil = numberToBytes(USEROP_VALID_UNTIL, { size: 6 })
  const bOpHash = hexToBytes(userOpHash)
  const bMsg = concat([bVersion, bValidUntil, bOpHash])
  const challenge = bytesToHex(bMsg)
  const { keySlot, encodedSig: sig } = await signer(challenge)
  const bKeySlot = numberToBytes(keySlot, { size: 1 })
  const opSig = bytesToHex(concat([bVersion, bValidUntil, bKeySlot, hexToBytes(sig)]))

  const _userOp = {
    ...userOp,
    signature: opSig,
  }
  if (userOpHash !== (await entrypoint.read.getUserOpHash([_userOp]))) {
    throw new Error('Invalid signature')
  }

  const message = challenge
  const signature = bytesToHex(hexToBytes(opSig).slice(7))
  const x = BigInt(key1)
  const y = BigInt(key2)

  // verify signature
  const result = await verifier.read.verifySignature([message, signature, x, y])
  expect(result).toBe(true)

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
      if ((validationResult as { sigFailed: boolean })?.sigFailed) {
        console.log('Validation result: ', validationResult)
        throw new Error('Signature failed')
      }
    })

  return { userOp: _userOp, userOpHash }
}

test('can create a new account', async () => {
  const { userOp } = await createAccountAndVerifySignature()
  // submit userop
  const _userOpHash = await bundlerClient.sendUserOperation({
    userOperation: userOp,
    entryPoint: entrypoint.address,
  })
  const senderBalA = await baseMainnetClient.getBalance({ address: userOp.sender })
  const receiverBalA = await baseMainnetClient.getBalance({
    address: receiverAccount.address,
  })

  const userOpReceipt = await bundlerClient.waitForUserOperationReceipt({ hash: _userOpHash })
  const txReceipt = await baseMainnetClient.getTransactionReceipt({
    hash: userOpReceipt.receipt.transactionHash,
  })

  const senderBalB = await baseMainnetClient.getBalance({ address: userOp.sender })
  const receiverBaB = await baseMainnetClient.getBalance({
    address: receiverAccount.address,
  })

  expect(txReceipt.status).toBe('success')
  expect(senderBalB).toBeLessThan(senderBalA)
  expect(receiverBaB).toBeGreaterThan(receiverBalA)
  expect(formatEther(receiverBaB - receiverBalA)).toBe('0.01')
}, 30_000)

test('can create a new account with bundler', async () => {
  const supportedEntryPoints = await bundlerClient.supportedEntryPoints()
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
