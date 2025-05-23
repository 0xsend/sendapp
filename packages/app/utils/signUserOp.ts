import { getUserOperationHash, type UserOperation } from 'permissionless'
import type { EntryPoint } from 'permissionless/types'
import { bytesToHex, concat, hexToBytes, numberToBytes, type Hex } from 'viem'
import { assert } from './assert'
import { byteaToBase64URLNoPad } from './byteaToBase64URLNoPad'
import { signChallenge } from './signChallenge'
import { USEROP_VERSION, generateChallenge } from './userOpConstants'

/**
 * Signs a user operation and returns the signature in a format for the SendVerifier contract.
 */
export async function signUserOp({
  userOp,
  version,
  validUntil,
  webauthnCreds,
  chainId,
  entryPoint,
}: {
  userOp: UserOperation<'v0.7'>
  version?: number
  validUntil?: number
  webauthnCreds?: { raw_credential_id: `\\x${string}`; name: string }[]
  chainId: number
  entryPoint: EntryPoint
}): Promise<Hex> {
  const userOpHash = getUserOperationHash({
    userOperation: userOp,
    entryPoint,
    chainId,
  })
  return await signUserOpHash({
    userOpHash,
    version,
    validUntil,
    allowedCredentials: webauthnCredToAllowedCredentials(webauthnCreds ?? []),
  })
}

/**
 * Signs a user operation hash and returns the signature in a format for the SendVerifier contract.
 */
export async function signUserOpHash({
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
  validUntil = validUntil ?? Math.floor((Date.now() + 1000 * 120) / 1000) // default 120 seconds)
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

/**
 * Converts webauthn credentials from postgres (supabase) to the format expected by signUserOp.
 */
export function webauthnCredToAllowedCredentials(
  webauthnCreds: { raw_credential_id: `\\x${string}`; name: string }[]
) {
  return (
    webauthnCreds?.map((c) => ({
      id: byteaToBase64URLNoPad(c.raw_credential_id),
      userHandle: c.name,
    })) ?? []
  )
}
