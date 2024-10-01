import { type Hex, concat, numberToBytes, hexToBytes, bytesToHex } from 'viem'
import { assert } from './assert'
import { signChallenge } from './signChallenge'
import { USEROP_VERSION, generateChallenge } from './userop'

/**
 * Signs a user operation hash and returns the signature in a format for the SendVerifier contract.
 */

export async function signUserOp({
  userOpHash,
  version,
  validUntil,
  allowedCredentials,
}: {
  userOpHash: Hex
  version?: number
  validUntil?: number
  allowedCredentials?: { id: string; userHandle: string }[]
}) {
  version = version ?? USEROP_VERSION
  validUntil = validUntil ?? Math.floor((Date.now() + 1000 * 45) / 1000) // default 45 seconds
  allowedCredentials = allowedCredentials ?? []
  assert(version === USEROP_VERSION, 'version must be 1')
  assert(typeof validUntil === 'number', 'validUntil must be a number')
  assert(
    validUntil === 0 || validUntil > Math.floor(Date.now() / 1000), // 0 means valid forever
    'validUntil must be in the future'
  )
  const { challenge, versionBytes, validUntilBytes } = generateChallenge({
    userOpHash,
    version,
    validUntil,
  })
  const { encodedWebAuthnSig, keySlot } = await signChallenge(challenge, allowedCredentials)
  const signature = concat([
    versionBytes,
    validUntilBytes,
    numberToBytes(keySlot, { size: 1 }),
    hexToBytes(encodedWebAuthnSig),
  ])
  return bytesToHex(signature)
}
