import { expect, test } from '@jest/globals'

import { baseMainnetBundlerClient as bundlerClient, baseMainnetClient } from '@my/wagmi'
import debug from 'debug'

const log = debug('app:features:onboarding:screen')
import crypto from 'node:crypto'
import {
  ContractFunctionExecutionError,
  ContractFunctionRevertedError,
  Hex,
  bytesToHex,
  concat,
  encodeAbiParameters,
  encodeFunctionData,
  formatEther,
  getAbiItem,
  hexToBytes,
  parseEther,
} from 'viem'

import { daimoAccountAbi, iEntryPointAbi } from '@my/wagmi'
import { base64urlnopad } from '@scure/base'
import {
  USEROP_KEY_SLOT,
  USEROP_SALT,
  USEROP_VALID_UNTIL,
  USEROP_VERSION,
  daimoAccountFactory,
  encodeCreateAccountData,
  entrypoint,
  generateChallenge,
  receiverAccount,
  testClient,
  verifier,
} from 'app/utils/userop'
import { numberToBytes } from 'viem'
import { getSenderAddress, UserOperation } from 'permissionless'
import nock from 'nock'

jest.mock('@daimo/expo-passkeys', () => ({
  createPasskey: jest.fn(),
  signWithPasskey: jest.fn(),
}))

const signatureStruct = getAbiItem({
  abi: daimoAccountAbi,
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
  const { challenge } = generateChallenge({
    userOpHash,
    version: USEROP_VERSION,
    validUntil: USEROP_VALID_UNTIL,
  })
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
      abi: iEntryPointAbi,
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

export async function generateUserOp(publicKey: [Hex, Hex]) {
  const initCode = concat([daimoAccountFactory.address, encodeCreateAccountData(publicKey)])

  const senderAddress = await getSenderAddress(baseMainnetClient, {
    initCode,
    entryPoint: entrypoint.address,
  })

  const address = await daimoAccountFactory.read.getAddress([
    USEROP_KEY_SLOT,
    publicKey,
    [],
    USEROP_SALT,
  ])

  if (address !== senderAddress) {
    throw new Error('Address mismatch')
  }

  // GENERATE THE CALLDATA
  // Finally, we should be able to do a userop from our new Daimo account.
  const to = receiverAccount.address
  const value = parseEther('0.01')
  const data: Hex = '0x68656c6c6f' // "hello" encoded to utf-8 bytes

  const callData = encodeFunctionData({
    abi: daimoAccountAbi,
    functionName: 'executeBatch',
    args: [
      [
        {
          dest: to,
          value: value,
          data: data,
        },
      ],
    ],
  })
  const userOp: UserOperation = {
    sender: senderAddress,
    nonce: 0n,
    initCode,
    callData,
    callGasLimit: 300000n,
    verificationGasLimit: 700000n,
    preVerificationGas: 300000n,
    maxFeePerGas: 1000000n,
    maxPriorityFeePerGas: 1000000n,
    paymasterAndData: '0x',
    signature: '0x',
  }

  // get userop hash
  const userOpHash = await entrypoint.read.getUserOpHash([userOp])
  return {
    userOp,
    userOpHash,
  }
}

beforeEach(async () => {
  nock.enableNetConnect()
})

afterEach(async () => {
  nock.cleanAll()
  nock.disableNetConnect()
})

test.skip('can create a new account', async () => {
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

test.skip('can create a new account with bundler', async () => {
  const supportedEntryPoints = await bundlerClient.supportedEntryPoints()
  log('TODO: implement bundler test', supportedEntryPoints)
})

test.skip('can get gas user operation gas prices', async () => {
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
//     abi: iEntryPointAbi,
//     functionName: 'depositTo',
//     args: [addr],
//     value: parseEther('1'), // 0.01 ETH
//   })
//   console.log(`Faucet deposited prefund: ${depositTxHash}`)
//   await waitForTx(publicClient as PublicClient, depositTxHash)
// }

// async function waitForTx(publicClient: PublicClient, hash: Hex) {
//   const receipt = await publicClient.waitForTransactionReceipt({
//     hash,
//     timeout: 30000,
//     confirmations: 3,
//   })
//   console.log(`...status: ${receipt.status}`)
// }
