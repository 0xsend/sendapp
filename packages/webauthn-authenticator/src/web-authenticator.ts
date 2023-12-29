/**
 * WebAuthn Authenticator: An API for accessing Public Key Credentials
 * @see https://www.w3.org/TR/webauthn-2/
 *
 * This is a mock implementation of the WebAuthn API for use in Playwright tests. It only supports ES256 and P-256.
 */

import crypto from 'crypto'
import cbor from 'cbor'
import {
  CreateWebauthnCredentialOptions,
  CredentialCreationOptionsSerialized,
  PublicKeyCredentialAttestationSerialized,
  CredentialRequestOptionsSerialized,
  PublicKeyCredentialAssertionSerialized,
  WebauthnCredential,
  Attestation,
  GetWebAuthnCredentialQuery,
} from './types'
import { AAGUID } from './aaguid'
import { base64, base64urlnopad } from '@scure/base'

export const COSE_PUB_KEY_ALG = -7 // ECDSA w/ SHA-256

// TODO: encapsulate this in a class and add a method to reset the store, optionally allow to pass a store
export const CredentialsStore: {
  [key: string]: WebauthnCredential
} = {}

/**
 * Creates a new public key credential to be used for WebAuthn attestations and assertions.
 */
function createWebauthnCredential({
  rpId = 'localhost',
  userHandle = null,
}: CreateWebauthnCredentialOptions): WebauthnCredential {
  const id: Buffer = crypto.randomBytes(16)
  const signCounter = 0
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ec', {
    namedCurve: 'prime256v1',
    publicKeyEncoding: { type: 'spki', format: 'der' },
    privateKeyEncoding: { type: 'sec1', format: 'pem' },
  })
  const cred: WebauthnCredential = {
    id,
    publicKey,
    privateKey,
    signCounter,
    rpId,
    userHandle,
    assertions: [],
    attestations: [],
  }
  CredentialsStore[id.toString('base64url')] = cred
  return cred
}

/**
 * Gets a public key credential for WebAuthn assertions.
 */
function getWebauthnCredential({
  credentialId,
  rpId = 'localhost',
}: GetWebAuthnCredentialQuery): WebauthnCredential | null {
  if (credentialId !== undefined) {
    return CredentialsStore[credentialId] || null
  }
  // find by rpId, multiple credentials can be registered for the same rpId and would require a user to select
  return Object.values(CredentialsStore).find((c) => c.rpId === rpId) || null
}

/**
 * Creates a new public key credential for WebAuthn compatible with navigator.credentials.create.
 * This version returns a serialized version of the credential instead of array buffers.
 * This is useful when mocking the WebAuthn API in a browser and is meant to be used in Playwright tests exposed via
 * context.exposeFunction or page.exposeFunction.
 * @see https://www.w3.org/TR/webauthn-2/#sctn-createCredential
 * @see https://www.w3.org/TR/webauthn-2/#sctn-generating-an-attestation-object
 */
export async function createPublicKeyCredential(
  credentialOptions: CredentialCreationOptionsSerialized
): Promise<PublicKeyCredentialAttestationSerialized> {
  const credOptsPubKey = credentialOptions.publicKey
  if (
    !credOptsPubKey ||
    credOptsPubKey.pubKeyCredParams.length === 0 ||
    credOptsPubKey.pubKeyCredParams.some((p) => p.alg !== COSE_PUB_KEY_ALG)
  ) {
    throw new Error('Unsupported algorithm')
  }
  const clientDataJSON = Buffer.from(
    new TextEncoder().encode(
      JSON.stringify({
        challenge: credOptsPubKey.challenge,
        origin: credOptsPubKey.rp.id,
        type: 'webauthn.create',
      })
    )
  )
  const clientDataHash = Buffer.from(await crypto.subtle.digest('SHA-256', clientDataJSON))
  const rpId = credOptsPubKey.rp.id || 'localhost'
  const userHandle = base64urlnopad.decode(credOptsPubKey.user.id) || null
  const cred = createWebauthnCredential({
    rpId,
    userHandle,
  })
  const { id: credentialId, publicKey, privateKey, signCounter } = cred
  const attestedCredentialData = generateAttestedCredentialData(credentialId, publicKey)
  const authData = generateAuthenticatorData(rpId, signCounter, attestedCredentialData)
  cred.signCounter++ // increment counter on each "access" to the authenticator
  const attestationObject = generateAttestionObject(authData, clientDataHash, privateKey)

  // save response to cred for inspection
  const response = {
    attestationObject,
    clientDataJSON,
  }
  cred.attestations.push(response)

  const credentialResponse: PublicKeyCredentialAttestationSerialized = {
    id: base64urlnopad.encode(credentialId),
    rawId: base64urlnopad.encode(credentialId),
    authenticatorAttachment: 'platform',
    response: {
      attestationObject: base64urlnopad.encode(attestationObject),
      clientDataJSON: base64urlnopad.encode(clientDataJSON),
    },
    type: 'public-key',
  } as PublicKeyCredentialAttestationSerialized

  console.log('[webauthn-authenticator] createPublicKeyCredential', credentialResponse)

  return credentialResponse
}

/**
 * Gets a public key credential for WebAuthn compatible with navigator.credentials.get.
 * This version returns a serialized version of the credential instead of array buffers.
 * This is useful when mocking the WebAuthn API in a browser and is meant to be used in Playwright tests exposed via
 * context.exposeFunction or page.exposeFunction.
 * @see https://www.w3.org/TR/webauthn-2/#sctn-getCredential
 * @see https://www.w3.org/TR/webauthn-2/#sctn-verifying-assertion
 */
export async function getPublicKeyCredential(
  credentialRequestOptions: CredentialRequestOptionsSerialized
) {
  console.log('[webauthn-authenticator] getPublicKeyCredential', credentialRequestOptions)
  const challenge = credentialRequestOptions.publicKey.challenge // base64url encoded challenge
  const credReqOptsPubKey = credentialRequestOptions.publicKey
  const clientDataJSON = {
    type: 'webauthn.get',
    challenge: credentialRequestOptions.publicKey.challenge,
    origin: credentialRequestOptions.publicKey.rpId,
  }
  console.log('[webauthn-authenticator] getPublicKeyCredential clientDataJSON', clientDataJSON)
  console.log(
    '[webauthn-authenticator] challenge',
    Buffer.from(base64urlnopad.decode(challenge)).toString('hex')
  )
  const clientDataBuffer = Buffer.from(new TextEncoder().encode(JSON.stringify(clientDataJSON)))
  const clientDataHash = Buffer.from(await crypto.subtle.digest('SHA-256', clientDataBuffer))
  const rpId = credentialRequestOptions.publicKey.rpId || 'localhost'
  const credQuery: GetWebAuthnCredentialQuery = {
    credentialId: credReqOptsPubKey?.allowCredentials?.[0]?.id,
    rpId,
  }
  const cred = getWebauthnCredential(credQuery)
  if (!cred) {
    throw new Error('Credential not found')
  }
  const { id: credentialId, publicKey, privateKey, signCounter } = cred

  const authData = generateAuthenticatorData(rpId, signCounter, null)
  cred.signCounter++ // increment counter on each "access" to the authenticator
  const assertionObject = generateAssertionObject(authData, clientDataHash, privateKey)
  const response: AuthenticatorAssertionResponse = {
    authenticatorData: authData,
    clientDataJSON: clientDataBuffer,
    signature: assertionObject,
    userHandle: cred.userHandle,
  }

  // save response to cred for inspection
  cred.assertions.push(response)

  const credentialResponse = {
    id: base64urlnopad.encode(credentialId),
    rawId: base64urlnopad.encode(credentialId),
    response: {
      authenticatorData: base64urlnopad.encode(Buffer.from(authData)),
      clientDataJSON: base64urlnopad.encode(Buffer.from(clientDataBuffer)),
      signature: base64urlnopad.encode(Buffer.from(assertionObject)),
      userHandle: cred.userHandle ? base64urlnopad.encode(Buffer.from(cred.userHandle)) : null,
    },
    type: 'public-key',
  } as PublicKeyCredentialAssertionSerialized

  console.log('[webauthn-authenticator] getPublicKeyCredential', credentialResponse)
  console.log(
    '[webauthn-authenticator] credentialResponse',
    Buffer.from(base64urlnopad.decode(credentialResponse.response.clientDataJSON)).toString('utf-8')
  )

  return credentialResponse
}

/**
 * Generate authenticator data is a variable-length byte array added to the authenticator data when generating an
 * attestation object for a given credential.
 * @see https://www.w3.org/TR/webauthn-2/#sctn-authenticator-data
 */
function generateAuthenticatorData(
  rpId: string,
  counter: number,
  attestedCredentialData: Buffer | null
) {
  const rpIdHash = crypto.createHash('sha256').update(rpId).digest()
  const flags = new Uint8Array(1) // 1 byte Flags (bit 0 is the least significant bit): User Present (UP) flag (bit 0) set
  if (attestedCredentialData) {
    flags[0] = 0b01000101 // bit 6, 1 means user is present, 0 means user is not present
  } else {
    flags[0] = 0b00000101
  }
  const signCount = Buffer.alloc(4)
  signCount.writeUInt32BE(counter, 0) // 4 bytes Signature counter (32-bit unsigned big-endian integer).
  const authenticatorData = Buffer.concat([
    rpIdHash,
    flags,
    signCount,
    attestedCredentialData || Buffer.alloc(0),
  ])
  return authenticatorData
}

/**
 * Generate attested credential data is a variable-length byte array added to the authenticator data when generating an
 * attestation object for a given credential.
 * @see https://www.w3.org/TR/webauthn-2/#sctn-attested-credential-data
 */
function generateAttestedCredentialData(credentialId: Buffer, publicKey: Buffer): Buffer {
  const aaguid = AAGUID // 16 bytes The AAGUID of the authenticator.
  const credentialIdLength = Buffer.alloc(2)
  credentialIdLength.writeUInt16BE(credentialId.byteLength, 0) // 2 bytes The length in bytes of Credential ID (16-bit unsigned big-endian integer).

  // COSE_Key format for ES256
  const coseKey = new Map()
  coseKey.set(1, 2) // kty: EC2 key type
  coseKey.set(3, COSE_PUB_KEY_ALG) // alg: ES256 signature algorithm
  coseKey.set(-1, 1) // crv: P-256 curve
  coseKey.set(-2, publicKey.subarray(27, 27 + 32)) // x-coordinate as byte string 32 bytes in length
  coseKey.set(-3, publicKey.subarray(27 + 32, 27 + 32 + 32)) // y-coordinate as byte string 32 bytes in length

  const attestedCredentialData = Buffer.concat([
    aaguid,
    credentialIdLength,
    credentialId,
    cbor.encode(coseKey),
  ])

  return attestedCredentialData
}

/**
 * Generate attestation object is a variable-length byte array added to the authenticator data when generating an
 * attestation object for a given credential.
 * @see https://www.w3.org/TR/webauthn-2/#sctn-generating-an-attestation-object
 */
function generateAttestionObject(
  authData: Buffer,
  clientDataJSON: Buffer,
  privateKey: string
): Buffer {
  const concated = Buffer.concat([authData, clientDataJSON])
  const sign = crypto.createSign('sha256')
  sign.write(concated)
  sign.end()
  const sig = sign.sign(privateKey)
  const attStmt = {
    alg: COSE_PUB_KEY_ALG,
    sig,
  }
  const fmt = 'packed'

  const attestation: Attestation = {
    fmt,
    attStmt,
    authData,
  }

  return cbor.encode(attestation)
}
/**
 * Generate assertion signature proving possession of the webauthn credential private key.
 * @see https://www.w3.org/TR/webauthn-2/#fig-signature
 */
function generateAssertionObject(
  authData: Buffer,
  clientDataJSON: Buffer,
  privateKey: string
): Buffer {
  const assertion = Buffer.concat([authData, clientDataJSON])
  return crypto.createSign('sha256').update(assertion).sign(privateKey)
}
