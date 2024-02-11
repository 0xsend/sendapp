import { signWithPasskey } from '@daimo/expo-passkeys'
import {
  daimoAccountAbi,
  daimoAccountFactoryAbi,
  daimoAccountFactoryAddress as daimoAccountFactoryAddresses,
  daimoVerifierAbi,
  daimoVerifierProxyAddress,
  iEntryPointAbi,
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
  isHex,
} from 'viem'
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts'
import { parseAndNormalizeSig, parseSignResponse } from './passkeys'
import { baseMainnetClient } from './viem'
import { assert } from './assert'

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
  abi: daimoAccountFactoryAbi,
  address: daimoAccountFactoryAddresses[845337], // TODO: use chain id
  client: baseMainnetClient,
})

export const entrypoint = getContract({
  abi: [getAbiItem({ abi: iEntryPointAbi, name: 'getUserOpHash' })],
  client: baseMainnetClient,
  address: '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789',
})

export const daimoVerifierAddress = daimoVerifierProxyAddress[845337] // TODO: use chain id

export const verifier = getContract({
  abi: daimoVerifierAbi,
  client: baseMainnetClient,
  address: daimoVerifierAddress,
})

/**
 * Verifies a signature against a challenge and public key onchain. Signature is encoded where the first byte is the
 * key-slot and the rest is the encoded signature struct.
 *
 * @param challenge - The challenge to verify the signature against
 * @param signature - The signature to verify
 * @param publicKey - The public key to verify the signature against
 * @returns A promise that resolves to a boolean indicating whether the signature is valid
 *
 * @see signChallenge
 */
export async function verifySignature(
  challenge: Hex,
  signature: Hex,
  publicKey: [Hex, Hex]
): Promise<boolean> {
  const x = BigInt(publicKey[0])
  const y = BigInt(publicKey[1])
  return await verifier.read.verifySignature([challenge, signature, x, y])
}

export const USEROP_VERSION = 1
export const USEROP_VALID_UNTIL = 0
export const USEROP_KEY_SLOT = 0
export const USEROP_SALT = 0n

export function encodeCreateAccountData(publicKey: [Hex, Hex]): Hex {
  return encodeFunctionData({
    abi: [getAbiItem({ abi: daimoAccountFactoryAbi, name: 'createAccount' })],
    args: [
      USEROP_KEY_SLOT, // key slot
      publicKey, // public key
      [], // init calls
      USEROP_SALT, // salt
    ],
  })
}

// @todo needs to accept a send account and signature
// @todo add logic for handling init code
// @todo add logic for handling call data
// @todo add logic for estimating gas
// @todo add logic for paymaster and data
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

/**
 * Generates a DaimoAccount challenge from a user operation hash.
 */
export function generateChallenge({
  userOpHash,
  version = USEROP_VERSION,
  validUntil = USEROP_VALID_UNTIL,
}: { userOpHash: Hex; version?: number; validUntil?: number }): {
  challenge: Hex
  versionBytes: Uint8Array
  validUntilBytes: Uint8Array
} {
  const opHash = hexToBytes(userOpHash)
  const versionBytes = numberToBytes(version, { size: 1 })
  const validUntilBytes = numberToBytes(validUntil, { size: 6 })
  // 1 byte version + 6 bytes validUntil + 32 bytes opHash
  const challenge = bytesToHex(concat([versionBytes, validUntilBytes, opHash]))
  assert(isHex(challenge) && challenge.length === 80, 'Invalid challenge')
  return {
    challenge,
    versionBytes,
    validUntilBytes,
  }
}

/**
 * Signs a challenge using the user's passkey and returns the signature in a format that matches the ABI of a signature
 * struct for the DaimoVerifier contract.
 */
export async function signChallenge(challenge: Hex) {
  assert(isHex(challenge) && challenge.length === 80, 'Invalid challenge')
  const challengeBytes = hexToBytes(challenge)
  const challengeB64 = Buffer.from(challengeBytes).toString('base64')
  const sign = await signWithPasskey({
    domain: window.location.hostname,
    challengeB64,
  })
  const signResult = parseSignResponse(sign)
  const clientDataJSON = signResult.clientDataJSON
  const authenticatorData = bytesToHex(signResult.rawAuthenticatorData)
  const challengeLocation = BigInt(clientDataJSON.indexOf('"challenge":'))
  const responseTypeLocation = BigInt(clientDataJSON.indexOf('"type":'))
  const { r, s } = parseAndNormalizeSig(signResult.derSig)
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
      abi: daimoAccountAbi,
      name: 'signatureStruct',
    }).inputs,
    [webauthnSig]
  )
  assert(isHex(encodedWebAuthnSig), 'Invalid encodedWebAuthnSig')
  return {
    keySlot: signResult.keySlot,
    accountName: signResult.accountName,
    encodedWebAuthnSig,
  }
}

/**
 * Signs a user operation hash and returns the signature in a format for the DaimoVerifier contract.
 */
export async function signUserOp({
  userOpHash,
  version,
  validUntil,
}: {
  userOpHash: Hex
  version: number
  validUntil: number
}) {
  const { challenge, versionBytes, validUntilBytes } = generateChallenge({
    userOpHash,
    version,
    validUntil,
  })
  const { encodedWebAuthnSig, keySlot } = await signChallenge(challenge)
  const signature = concat([
    versionBytes,
    validUntilBytes,
    numberToBytes(keySlot, { size: 1 }),
    hexToBytes(encodedWebAuthnSig),
  ])
  return bytesToHex(signature)
}
