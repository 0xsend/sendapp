import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts'
import { assert } from 'app/utils/assert'
import type { EphemeralKeyPair, ClaimSendCheckPayload } from 'app/features/checks/types'
import { type Hex, isHex, keccak256, isAddress } from 'viem'
import type { UserOperation } from 'permissionless'
import { defaultUserOp } from 'app/utils/useUserOpTransferMutation'

/**
 * Generates a URL for claiming a /send check.
 *
 * The URL encodes information required for /send check retrieval. See {@see ClaimSendCheckPayload } for more information
 * @param {string} senderId - The sender's /send account id.
 * @param {EphemeralKeyPair} ephemeralKeyPair - An object containing the ephemeral private key and address.
 * @returns {string} The generated URL for claiming the check.
 */
export const encodeClaimCheckUrl = (
  senderId: string,
  ephemeralKeyPair: EphemeralKeyPair
): string => {
  const encodedPayload = encodeURIComponent(
    `${senderId}:${ephemeralKeyPair.ephemeralPrivateKey}:${ephemeralKeyPair.ephemeralAddress}`
  )
  return `/checks/claim#${encodedPayload}`
}

export const decodeClaimCheckUrl = (encodedPayload: string): ClaimSendCheckPayload => {
  const decodedPayload = decodeURIComponent(encodedPayload)
  const sendCheckPayload: ClaimSendCheckPayload = validateDecodedPayload(decodedPayload)
  return sendCheckPayload
}

/**
 * Validates a /send check receive URL.
 * @param {string} decodedPayload - a decoded claim /send check payload. { @see decodeClaimCheckUrl }
 * @returns {ClaimSendCheckPayload} - decoded claim /send check payload
 */
const validateDecodedPayload = (decodedPayload: string): ClaimSendCheckPayload => {
  const payloadParts = decodedPayload.split(':')
  assert(payloadParts.length === 3, 'Invalid payload length')

  payloadParts.forEach((part, idx) => {
    assert(!!part, 'Invalid payload part')
    assert(part.length > 0, 'Invalid payload part')

    if (idx > 0) {
      assert(isHex(part), `Ephemeral key is not a hex string. Received: ${part}`)
    }
  })

  const senderAccountId = payloadParts[0] as string
  const ephemeralKeypair = {
    ephemeralPrivateKey: payloadParts[1] as Hex,
    ephemeralAddress: payloadParts[2] as Hex,
  }

  return {
    senderAccountUuid: senderAccountId,
    ephemeralKeypair,
  }
}

/**
 * Generates an ephemeral key pair for a /send check.
 * This includes both an ephemeral private key and address.
 *
 * @returns {EphemeralKeyPair} The generated ephemeral key pair.
 */
export const generateEphemeralKeypair = (): EphemeralKeyPair => {
  const ephemeralPrivateKey = generatePrivateKey()
  const ephemeralAddress = privateKeyToAccount(ephemeralPrivateKey).address
  return {
    ephemeralPrivateKey,
    ephemeralAddress,
  }
}

/**
 * Generates a claim /send check URL.
 * @param {Hex} recipient - recipient address
 * @param {Hex} ephemeralPrivateKey - ephemeral private key
 * @returns {string} claim /send check URL.
 */
export const getCheckClaimSignature = async (
  recipient: Hex,
  ephemeralPrivateKey: Hex
): Promise<Hex> => {
  const account = privateKeyToAccount(ephemeralPrivateKey)
  const message = keccak256(recipient)
  return await account.signMessage({
    message: {
      raw: message,
    },
  })
}

/**
 * Helper function determining whether a claim /send check signature can be created.
 * @param {Hex} ephemeralPrivateKey - ephemeral private key
 * @param {Hex} recipient
 * @returns {boolean} true if a claim /send check signature can be created, false otherwise.
 */
export const canCreateClaimCheckSignature = (
  ephemeralPrivateKey: Hex,
  recipient?: Hex
): boolean => {
  try {
    assert(!!recipient && isAddress(recipient), `Invalid receiver. Received: [${recipient}]`)
    assert(
      !!ephemeralPrivateKey && isHex(ephemeralPrivateKey),
      `Invalid ephemeralPrivateKey. Received: [${ephemeralPrivateKey}]`
    )
    return true
  } catch (e) {
    return false
  }
}

/**
 * Default /send check userOp.
 *
 * TODO: revisit gas limits
 */
export const defaultSendCheckUserOp: Pick<
  UserOperation<'v0.7'>,
  | 'callGasLimit'
  | 'verificationGasLimit'
  | 'preVerificationGas'
  | 'maxFeePerGas'
  | 'maxPriorityFeePerGas'
  | 'paymasterVerificationGasLimit'
  | 'paymasterPostOpGasLimit'
> = {
  ...defaultUserOp,
  callGasLimit: 1000000n,
  verificationGasLimit: 5500000n,
}
