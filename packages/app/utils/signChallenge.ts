import type { Hex } from 'viem'

/**
 * Signs a challenge using the user's passkey and returns the signature in a format that matches the ABI of a signature
 * struct for the SendVerifier contract.
 * @param challenge - The challenge to sign encoded as a 0x-prefixed hex string.
 * @param rawIdsB64 - The list of raw ids to use for signing. Required for Android and Chrome.
 * @returns The signature in a format that matches the ABI of a signature struct for the SendVerifier contract.
 */
export async function signChallenge(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  challenge: Hex,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  allowedCredentials: { id: string; userHandle: string }[]
): Promise<{
  keySlot: number
  accountName: string
  encodedWebAuthnSig: Hex
}> {
  throw new Error('Not implemented')
}
