import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts'
import type { EphemeralKeyPair } from 'app/features/checks/types'

/**
 * Generates a URL for claiming a check based on the sender's ID and an ephemeral key pair.
 * The URL contains an encoded payload comprising the sender's ID, the ephemeral private key,
 * and the ephemeral address, separated by colons and encoded for URL compatibility.
 *
 * @param {string} senderId - The sender's /send account id.
 * @param {EphemeralKeyPair} ephemeralKeyPair - An object containing the ephemeral private key and address.
 * @returns {string} The generated URL for claiming the check.
 */
export const generateCheckUrl = (senderId: string, ephemeralKeyPair: EphemeralKeyPair): string => {
  const encodedPayload = encodeURIComponent(
    `${senderId}:${ephemeralKeyPair.ephemeralPrivkey}:${ephemeralKeyPair.ephemeralAddress}`
  )
  return `/check/claim/${encodedPayload}`
}

/**
 * Generates an ephemeral key pair for a /send check.
 * This includes both an ephemeral private key and address.
 *
 * @returns {EphemeralKeyPair} The generated ephemeral key pair.
 */
export const generateEphemeralKeypair = (): EphemeralKeyPair => {
  const ephemeralPrivkey = generatePrivateKey()
  const ephemeralAddress = privateKeyToAccount(ephemeralPrivkey).address
  return {
    ephemeralPrivkey,
    ephemeralAddress,
  }
}
