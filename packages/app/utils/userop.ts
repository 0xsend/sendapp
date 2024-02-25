import { signWithPasskey } from '@daimo/expo-passkeys'
import {
  daimoAccountAbi,
  daimoAccountFactoryAbi,
  daimoAccountFactoryAddress as daimoAccountFactoryAddresses,
  daimoVerifierAbi,
  daimoVerifierProxyAddress,
  entryPointAddress,
  iEntryPointAbi,
  iEntryPointSimulationsAbi,
} from '@my/wagmi'

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
  isHex,
  publicActions,
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
}).extend(publicActions)

export const daimoAccountFactory = getContract({
  abi: daimoAccountFactoryAbi,
  address: daimoAccountFactoryAddresses[845337], // TODO: use chain id
  client: baseMainnetClient,
})

export const entrypoint = getContract({
  abi: iEntryPointAbi,
  address: entryPointAddress[baseMainnetClient.chain.id],
  client: baseMainnetClient,
})

export const entrypointSimulations = getContract({
  abi: iEntryPointSimulationsAbi,
  address: entryPointAddress[baseMainnetClient.chain.id],
  client: baseMainnetClient,
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
