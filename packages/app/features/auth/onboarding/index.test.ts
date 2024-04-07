import { expect, test } from '@jest/globals'

import {
  baseMainnetBundlerClient,
  baseMainnetClient,
  baseMainnetBundlerClient as bundlerClient,
  sendAccountFactoryAbi,
  sendAccountFactoryAddress,
  sendTokenAbi,
  tokenPaymasterAbi,
  tokenPaymasterAddress,
  usdcAddress,
} from '@my/wagmi'
import debug from 'debug'
import crypto from 'node:crypto'
import {
  bytesToHex,
  concat,
  createWalletClient,
  encodeAbiParameters,
  encodeFunctionData,
  erc20Abi,
  formatUnits,
  getAbiItem,
  getContract,
  hexToBytes,
  http,
  maxUint256,
  type Account,
  type Hex,
  type WalletClient,
} from 'viem'

const log = debug('app:features:onboarding:screen')

import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts'

import { sendAccountAbi } from '@my/wagmi'
import { base64urlnopad } from '@scure/base'
import { setERC20Balance } from 'app/utils/useSetErc20Balance'
import {
  USEROP_VALID_UNTIL,
  USEROP_VERSION,
  entrypoint,
  generateChallenge,
  getSendAccountCreateArgs,
  testClient,
  verifier,
} from 'app/utils/userop'
import nock from 'nock'
import {
  getRequiredPrefund,
  getSenderAddress,
  getUserOperationHash,
  type UserOperation,
} from 'permissionless'
import { numberToBytes } from 'viem'

const sendAccountFactory = getContract({
  address: sendAccountFactoryAddress[baseMainnetClient.chain.id],
  abi: sendAccountFactoryAbi,
  client: baseMainnetClient,
})

jest.mock('@daimo/expo-passkeys', () => ({
  createPasskey: jest.fn(),
  signWithPasskey: jest.fn(),
}))

const signatureStruct = getAbiItem({
  abi: sendAccountAbi,
  name: 'signatureStruct',
}).inputs

async function createAccountAndVerifySignature() {
  // Generate keypair
  const keygen = { name: 'ECDSA', namedCurve: 'P-256', hash: 'SHA-256' }
  const key = await crypto.subtle.generateKey(keygen, true, ['sign', 'verify'])
  const pubKeyDer = await crypto.subtle.exportKey('spki', key.publicKey)
  const pubKeyHex = Buffer.from(pubKeyDer).toString('hex')

  // Send account
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

  const keyslot = 0
  const key1 = `0x${pubKey.subarray(0, 32).toString('hex')}` as Hex
  const key2 = `0x${pubKey.subarray(32).toString('hex')}` as Hex
  const salt = 0n
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
  const args = [keyslot, [key1, key2], initCalls, salt] as const

  // Simulate user depositing funds to new account
  const address = await sendAccountFactory.read.getAddress(args)
  log('address', address)
  // await testClient.setBalance({
  //   address: address,
  //   value: parseEther('1'),
  // })
  // expect(await baseMainnetClient.getBalance({ address })).toBe(parseEther('1'))

  // log('[API] Faucet deposit prefund')
  // const depositTxHash = await walletClient.writeContract({
  //   address: entrypoint.address,
  //   abi: iEntryPointAbi,
  //   functionName: 'depositTo',
  //   args: [address],
  //   value: parseEther('1'), // 0.01 ETH
  // })
  // log(`[API] Faucet deposited prefund: ${depositTxHash}`)
  // await waitForTx(baseMainnetClient as PublicClient, depositTxHash)

  // Deploy account
  const { request } = await baseMainnetClient.simulateContract({
    account: sendAccountFactoryAccount,
    address: sendAccountFactoryAddress[baseMainnetClient.chain.id],
    abi: sendAccountFactoryAbi,
    functionName: 'createAccount',
    args: args,
    value: 0n,
  })
  const hash = await walletClient.writeContract(request)
  log(`[API] deploy transaction ${hash}`)
  const tx = await baseMainnetClient.waitForTransactionReceipt({ hash, confirmations: 3 })
  log(`[API] deploy transaction ${tx.status}`)

  // fund with USDC
  await setERC20Balance({
    client: testClient,
    tokenAddress: usdcAddress[baseMainnetClient.chain.id],
    address: address,
    value: BigInt(10000e6), // 100 USDC
  })

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
  } as UserOperation<'v0.7'>

  const message = challenge
  const signature = bytesToHex(hexToBytes(opSig).slice(7))
  const x = BigInt(key1)
  const y = BigInt(key2)

  // verify signature
  const result = await verifier.read.verifySignature([message, signature, x, y])
  expect(result).toBe(true)

  // always reverts
  // await baseMainnetClient
  //   .simulateContract({
  //     address: entrypoint.address,
  //     functionName: 'simulateValidation',
  //     abi: iEntryPointSimulationsAbi,
  //     args: [_userOp],
  //   })
  //   .catch((e: ContractFunctionExecutionError) => {
  //     const cause: ContractFunctionRevertedError = e.cause
  //     if (cause.data?.errorName !== 'ValidationResult') {
  //       throw e
  //     }
  //     const validationResult = cause.data.args?.[0]
  //     if ((validationResult as { sigFailed: boolean })?.sigFailed) {
  //       log('Validation result: ', validationResult)
  //       throw new Error('Signature failed')
  //     }
  //   })

  return { userOp: _userOp, userOpHash }
}

export async function generateUserOp(publicKey: [Hex, Hex]) {
  const factory = sendAccountFactoryAddress[baseMainnetClient.chain.id]
  const factoryData = encodeFunctionData({
    abi: [getAbiItem({ abi: sendAccountFactoryAbi, name: 'createAccount' })],
    args: getSendAccountCreateArgs(publicKey),
  })
  const senderAddress = await getSenderAddress(baseMainnetClient, {
    factory,
    factoryData,
    entryPoint: entrypoint.address,
  })

  log('senderAddress', senderAddress)

  // GENERATE THE CALLDATA
  // Finally, we should be able to do a userop from our new Send account.
  const to = receiverAccount.address

  // eth transfer calldata
  // const value = parseEther('0.01')
  // const data: Hex = '0x68656c6c6f' // "hello" encoded to utf-8 bytes
  // const callData = encodeFunctionData({
  //   abi: sendAccountAbi,
  //   functionName: 'executeBatch',
  //   args: [
  //     [
  //       {
  //         dest: to,
  //         value: value,
  //         data: data,
  //       },
  //     ],
  //   ],
  // })

  // usdc transfer calldata
  const callData = encodeFunctionData({
    abi: sendAccountAbi,
    functionName: 'executeBatch',
    args: [
      [
        {
          dest: usdcAddress[baseMainnetClient.chain.id],
          value: 0n,
          data: encodeFunctionData({
            abi: erc20Abi,
            functionName: 'transfer',
            args: [to, BigInt(1e6)],
          }),
        },
      ],
    ],
  })
  const paymaster = tokenPaymasterAddress[baseMainnetClient.chain.id] as `0x${string}`

  log('paymaster', paymaster)

  const userOp: UserOperation<'v0.7'> = {
    sender: senderAddress,
    nonce: 0n,
    // factory,
    // factoryData,
    callData,
    callGasLimit: 100000n,
    verificationGasLimit: 550000n,
    preVerificationGas: 70000n,
    maxFeePerGas: 10000000n,
    maxPriorityFeePerGas: 10000000n,
    paymaster,
    paymasterVerificationGasLimit: 150000n,
    paymasterPostOpGasLimit: 50000n,
    paymasterData: '0x',
    signature: '0x',
  }

  log('userOp', userOp)

  const requiredPreFund = getRequiredPrefund({
    userOperation: userOp,
    entryPoint: entrypoint.address,
  })
  const gasPrices = await baseMainnetClient.getGasPrice()
  const gasEstimate = await baseMainnetBundlerClient.estimateUserOperationGas({
    userOperation: userOp,
  })

  log('gasEstimate', gasEstimate)
  log('gasPrices', gasPrices)
  log('requiredPreFund', requiredPreFund)

  // calculate the required usdc balance
  const [priceMarkup, minEntryPointBalance, refundPostopCost, priceMaxAge, baseFee] =
    await baseMainnetClient.readContract({
      address: tokenPaymasterAddress[baseMainnetClient.chain.id],
      abi: tokenPaymasterAbi,
      functionName: 'tokenPaymasterConfig',
      args: [],
    })
  log(
    'paymasterConfig',
    'priceMarkup=',
    priceMarkup,
    'minEntryPointBalance=',
    minEntryPointBalance,
    'refundPostopCost=',
    refundPostopCost,
    'priceMaxAge=',
    priceMaxAge,
    'baseFee=',
    baseFee
  )
  const cachedPrice = await baseMainnetClient.readContract({
    address: tokenPaymasterAddress[baseMainnetClient.chain.id],
    abi: tokenPaymasterAbi,
    functionName: 'cachedPrice',
    args: [],
  })
  log('cachedPrice', cachedPrice)

  const preChargeNative = requiredPreFund + BigInt(refundPostopCost) * userOp.maxFeePerGas
  log('preChargeNative', preChargeNative)
  const cachedPriceWithMarkup = (cachedPrice * BigInt(1e26)) / priceMarkup
  log('cachedPriceWithMarkup', cachedPriceWithMarkup)

  const requiredUsdcBalance = await baseMainnetClient.readContract({
    address: tokenPaymasterAddress[baseMainnetClient.chain.id],
    abi: tokenPaymasterAbi,
    functionName: 'weiToToken',
    args: [preChargeNative, cachedPriceWithMarkup],
  })
  log('requiredUsdcBalance', requiredUsdcBalance, formatUnits(requiredUsdcBalance, 6))

  // get userop hash
  const userOpHash = getUserOperationHash({
    userOperation: userOp,
    entryPoint: entrypoint.address,
    chainId: baseMainnetClient.chain.id,
  })

  log('userOpHash', userOpHash)

  return {
    userOp,
    userOpHash,
  }
}

let sendAccountFactoryAccount: Account
const receiverAccount = privateKeyToAccount(generatePrivateKey())
type walletClientType = WalletClient<
  ReturnType<typeof http>,
  typeof baseMainnetClient.chain,
  Account
>
let walletClient: walletClientType

beforeEach(async () => {
  nock.enableNetConnect()
})

afterEach(async () => {
  nock.cleanAll()
  nock.disableNetConnect()
})

test('can send with new account and paymaster', async () => {
  sendAccountFactoryAccount = privateKeyToAccount(
    process.env.SEND_ACCOUNT_FACTORY_PRIVATE_KEY as `0x${string}`
  )
  walletClient = createWalletClient({
    chain: baseMainnetClient.chain,
    transport: http(baseMainnetClient.transport.url),
    account: sendAccountFactoryAccount,
  })
  const { userOp } = await createAccountAndVerifySignature()
  const _userOpHash = await bundlerClient.sendUserOperation({ userOperation: userOp })
  //   const senderBalA = await baseMainnetClient.getBalance({
  //     address: userOp.sender,
  // })
  const senderBalA = await baseMainnetClient.readContract({
    address: usdcAddress[baseMainnetClient.chain.id],
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [userOp.sender],
  })
  // const receiverBalA = await baseMainnetClient.getBalance({
  //   address: receiverAccount.address,
  // })
  const receiverBalA = await baseMainnetClient.readContract({
    address: usdcAddress[baseMainnetClient.chain.id],
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [receiverAccount.address],
  })

  const userOpReceipt = await bundlerClient.waitForUserOperationReceipt({ hash: _userOpHash })
  const txReceipt = await baseMainnetClient.getTransactionReceipt({
    hash: userOpReceipt.receipt.transactionHash,
  })

  // const senderBalB = await baseMainnetClient.getBalance({ address: userOp.sender })
  const senderBalB = await baseMainnetClient.readContract({
    address: usdcAddress[baseMainnetClient.chain.id],
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [userOp.sender],
  })
  // const receiverBaB = await baseMainnetClient.getBalance({
  //   address: receiverAccount.address,
  // })
  const receiverBaB = await baseMainnetClient.readContract({
    address: usdcAddress[baseMainnetClient.chain.id],
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [receiverAccount.address],
  })

  expect(txReceipt.status).toBe('success')
  expect(userOpReceipt.success).toBe(true)
  expect(senderBalB).toBeLessThan(senderBalA)
  expect(receiverBaB).toBeGreaterThan(receiverBalA)
  expect(formatUnits(receiverBaB - receiverBalA, 6)).toBe('1')
}, 45_000)

test('can create a new account with bundler', async () => {
  const supportedEntryPoints = await bundlerClient.supportedEntryPoints()
  expect(supportedEntryPoints).toBeDefined()
  expect(supportedEntryPoints.length).toBeGreaterThan(0)
  expect(supportedEntryPoints).toContain(entrypoint.address)
})

test('can get gas user operation gas prices', async () => {
  const gasPrice = await baseMainnetClient.getGasPrice()
  expect(gasPrice).toBeDefined()
  log('gasPrice', gasPrice)
})

// async function waitForTx(publicClient: PublicClient, hash: Hex) {
//   const receipt = await publicClient.waitForTransactionReceipt({
//     hash,
//     timeout: 30000,
//     // confirmations: 3,
//   })
//   log(`...status: ${receipt.status}`)
// }
