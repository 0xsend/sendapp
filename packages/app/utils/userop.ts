import { signWithPasskey } from '@daimo/expo-passkeys'
import {
  daimoAccountABI,
  daimoAccountFactoryABI,
  daimoAccountFactoryAddress as daimoAccountFactoryAddresses,
  daimoVerifierABI,
  daimoVerifierProxyAddress,
  iEntryPointABI,
} from '@my/wagmi'
import { UserOperation, getSenderAddress } from 'permissionless'
import {
  http,
  Hex,
  bytesToHex,
  concat,
  createTestClient,
  createWalletClient,
  encodeAbiParameters,
  encodeFunctionData,
  getAbiItem,
  getContract,
  hexToBytes,
  numberToBytes,
  parseEther,
} from 'viem'
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts'
import { parseAndNormalizeSig, parseSignResponse } from './passkeys'
import { baseMainnetClient } from './viem'

// TODO: remove this wallet client and test client
const privateKey = generatePrivateKey()
export const dummyAccount = privateKeyToAccount(privateKey)
export const receiverAccount = privateKeyToAccount(generatePrivateKey())
export const walletClient = createWalletClient({
  chain: baseMainnetClient.chain,
  transport: http(baseMainnetClient.transport.url),
  account: dummyAccount,
})

export const testClient = createTestClient({
  chain: baseMainnetClient.chain,
  transport: http(baseMainnetClient.transport.url),
  mode: 'anvil',
})

export const daimoAccountFactory = getContract({
  abi: daimoAccountFactoryABI,
  address: daimoAccountFactoryAddresses[845337], // TODO: use chain id
  publicClient: baseMainnetClient,
})

export const entrypoint = getContract({
  abi: [getAbiItem({ abi: iEntryPointABI, name: 'getUserOpHash' })],
  publicClient: baseMainnetClient,
  address: '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789',
})

export const daimoVerifierAddress = daimoVerifierProxyAddress[845337] // TODO: use chain id

export const verifier = getContract({
  abi: daimoVerifierABI,
  publicClient: baseMainnetClient,
  address: daimoVerifierAddress,
})

export const USEROP_VERSION = 1
export const USEROP_VALID_UNTIL = 0
export const USEROP_KEY_SLOT = 0
export const USEROP_SALT = 0n

export function encodeCreateAccountData(publicKey: [Hex, Hex]): Hex {
  return encodeFunctionData({
    abi: [getAbiItem({ abi: daimoAccountFactoryABI, name: 'createAccount' })],
    args: [
      USEROP_KEY_SLOT, // key slot
      publicKey, // public key
      [], // init calls
      USEROP_SALT, // salt
    ],
  })
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
    abi: daimoAccountABI,
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
export function generateChallenge(_userOpHash: Hex): Hex {
  const version = numberToBytes(USEROP_VERSION, { size: 1 })
  const validUntil = numberToBytes(USEROP_VALID_UNTIL, { size: 6 })
  const opHash = hexToBytes(_userOpHash)
  const challenge = bytesToHex(concat([version, validUntil, opHash]))
  return challenge
}
export async function signChallenge(challenge: Hex) {
  if (!challenge || challenge.length <= 0) {
    throw new Error('No challenge to sign')
  }
  const challengeBytes = hexToBytes(challenge)
  const challengeB64 = Buffer.from(challengeBytes).toString('base64')
  if (!challengeB64) {
    throw new Error('No challengeB64 to sign')
  }
  const sign = await signWithPasskey({
    domain: window.location.hostname,
    challengeB64,
  })
  const _signResult = parseSignResponse(sign)
  const clientDataJSON = _signResult.clientDataJSON
  const authenticatorData = bytesToHex(_signResult.rawAuthenticatorData)
  const challengeLocation = BigInt(clientDataJSON.indexOf('"challenge":'))
  const responseTypeLocation = BigInt(clientDataJSON.indexOf('"type":'))
  const { r, s } = parseAndNormalizeSig(_signResult.derSig)
  const webauthnSig = {
    authenticatorData,
    clientDataJSON,
    challengeLocation,
    responseTypeLocation,
    r,
    s,
  }

  const encodedWebAuthnSig = encodeAbiParameters(
    getAbiItem({
      abi: daimoAccountABI,
      name: 'signatureStruct',
    }).inputs,
    [webauthnSig]
  )
  return encodedWebAuthnSig
}
