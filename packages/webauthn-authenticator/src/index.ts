import { test as base } from '@playwright/test'
import crypto from 'crypto'
import cbor from 'cbor'
import { base64url } from '@scure/base'

/**
 * AAGUID is a 128-bit identifier indicating the type (e.g. make and model) of the authenticator.
 */
const AAGUID = Buffer.from('00000000-0000-0000-0000-000000000000', 'hex')

type WebauthnCredential = {
  id: Buffer
  /**
   * The public key of the credential in base64url format.
   */
  publicKey: Buffer
  /**
   * The private key of the credential in PEM format.
   */
  privateKey: string
  /**
   * The sign counter of the credential.
   */
  signCounter: number
  /**
   * The relying-party ID (rpId) of the credential.
   * @see https://www.w3.org/TR/webauthn-2/#rp-id
   */
  rpId: string
  /**
   * The user handle is specified by a Relying Party, as the value of user.id, and used to map a specific public key credential to a specific user account with the Relying Party. Authenticators in turn map RP IDs and user handle pairs to public key credential sources.
   * A user handle is an opaque byte sequence with a maximum size of 64 bytes, and is not meant to be displayed to the user.
   * Here it is stored as a string in base64url format.
   * @see https://www.w3.org/TR/webauthn-2/#user-handle
   */
  userHandle: string | null
}

const CredentialsStore: {
  [key: string]: WebauthnCredential
} = {}

interface PublicKeyCredentialUserEntitySerialized
  extends Omit<PublicKeyCredentialUserEntity, 'id'> {
  id: string
}
interface PublicKeyCredentialCreationOptionsSerialized
  extends Omit<PublicKeyCredentialCreationOptions, 'challenge' | 'user'> {
  challenge: string
  user: PublicKeyCredentialUserEntitySerialized
}
type CredentialCreationOptionsSerialized = {
  publicKey: PublicKeyCredentialCreationOptionsSerialized
}
interface AuthenticatorAttestationResponseSerialized
  extends Omit<AuthenticatorAttestationResponse, 'clientDataJSON' | 'attestationObject'> {
  clientDataJSON: string
  attestationObject: string
}
interface PublicKeyCredentialAttestationSerialized
  extends Omit<PublicKeyCredential, 'response' | 'rawId'> {
  response: AuthenticatorAttestationResponseSerialized
  rawId: string
}
interface PublicKeyCredentialDescriptorSerialized
  extends Omit<PublicKeyCredentialDescriptor, 'id'> {
  id: string
}
interface PublicKeyCredentialRequestOptionsSerialized
  extends Omit<PublicKeyCredentialRequestOptions, 'challenge' | 'allowCredentials'> {
  challenge: string
  allowCredentials: PublicKeyCredentialDescriptorSerialized[]
}
type CredentialRequestOptionsSerialized = {
  publicKey: PublicKeyCredentialRequestOptionsSerialized
}
interface AuthenticatorAssertionResponseSerialized
  extends Omit<
    AuthenticatorAssertionResponse,
    'clientDataJSON' | 'authenticatorData' | 'signature' | 'userHandle'
  > {
  clientDataJSON: string
  authenticatorData: string
  signature: string
  userHandle: string | null
}
interface PublicKeyCredentialAssertionSerialized
  extends Omit<PublicKeyCredential, 'response' | 'rawId'> {
  response: AuthenticatorAssertionResponseSerialized
  rawId: string
}

type createWebauthnCredentialOptions = {
  rpId?: string
  userHandle?: string | null
}
/**
 * Creates a new public key credential to be used for WebAuthn attestations and assertions.
 */
function createWebauthnCredential({
  rpId = 'localhost',
  userHandle = null,
}: createWebauthnCredentialOptions): WebauthnCredential {
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
  }
  CredentialsStore[id.toString('base64url')] = cred
  return cred
}

type GetWebAuthnCredentialQuery = {
  credentialId?: string
  rpId?: string
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
  const challenge = base64url.decode(credOptsPubKey.challenge)
  const clientDataJSON = base64url.encode(
    new TextEncoder().encode(
      JSON.stringify({
        challenge: base64url.encode(challenge),
        origin: credOptsPubKey.rp.name,
        type: 'webauthn.create',
      })
    )
  )
  const rpId = credOptsPubKey.rp.id || credOptsPubKey.rp.name || 'localhost'
  const userHandle = credOptsPubKey.user.id || null
  const cred = createWebauthnCredential({
    rpId,
    userHandle,
  })
  const { id: credentialId, publicKey, privateKey, signCounter } = cred

  const attestedCredentialData = generateAttestedCredentialData(credentialId, publicKey)
  const authData = generateAuthenticatorData(rpId, signCounter, attestedCredentialData)
  cred.signCounter++ // increment counter on each "access" to the authenticator
  const attestationObject = generateAttestionObject(authData, clientDataJSON, privateKey)

  return {
    id: credentialId.toString('base64url'),
    rawId: credentialId.toString('base64url'),
    authenticatorAttachment: 'platform',
    response: {
      attestationObject: attestationObject.toString('base64url'),
      clientDataJSON,
    },
    type: 'public-key',
  } as PublicKeyCredentialAttestationSerialized
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
  const credReqOptsPubKey = credentialRequestOptions.publicKey
  const challenge = base64url.decode(credentialRequestOptions.publicKey.challenge)
  const clientDataBuffer = Buffer.from(
    new TextEncoder().encode(
      JSON.stringify({
        challenge: base64url.encode(challenge),
        origin: credentialRequestOptions.publicKey.rpId,
        type: 'webauthn.get',
      })
    )
  )
  const rpId = credentialRequestOptions.publicKey.rpId || 'localhost'
  const credQuery: GetWebAuthnCredentialQuery = {
    credentialId: credReqOptsPubKey?.allowCredentials?.[0]?.id,
  } || {
    rpId,
  }
  const cred = getWebauthnCredential(credQuery)
  if (!cred) {
    throw new Error('Credential not found')
  }
  const { id: credentialId, publicKey, privateKey, signCounter } = cred

  const authData = generateAuthenticatorData(rpId, signCounter, null)
  cred.signCounter++ // increment counter on each "access" to the authenticator
  const assertionObject = generateAssertionObject(authData, clientDataBuffer, privateKey)
  return {
    id: credentialId.toString('base64url'),
    rawId: credentialId.toString('base64url'),
    response: {
      authenticatorData: authData.toString('base64url'),
      clientDataJSON: clientDataBuffer.toString('base64url'),
      signature: assertionObject.toString('base64url'),
      userHandle: null,
    },
    type: 'public-key',
  } as PublicKeyCredentialAssertionSerialized
}

/**
 * Install the WebAuthn authenticator mock in the browser. This is a helper function to be used in Playwright tests.
 */
export function installWebAuthnMock({
  createCredFuncName = createPublicKeyCredential.name,
  getCredFuncName = getPublicKeyCredential.name,
}) {
  console.log('webauthn mock init script')

  // Add helpers to convert ArrayBuffer to base64
  function arrayBufferToBase64(buffer: ArrayBuffer) {
    let binary = ''
    const bytes = new Uint8Array(buffer)
    for (let i = 0; i < bytes.byteLength; ++i) {
      binary += String.fromCharCode(bytes[i] as number)
    }
    return window.btoa(binary)
  }

  function base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = window.atob(base64)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }
    return bytes.buffer as ArrayBuffer
  }

  // Mock the WebAuthn API
  navigator.credentials.create = async (credOpt: CredentialCreationOptions) => {
    console.log('webauthn mock create credential', credOpt)

    if (!credOpt.publicKey) throw new Error('Missing publicKey in credentialOptions')
    if (!credOpt.publicKey.challenge) throw new Error('Missing challenge in publicKey')
    if (!credOpt.publicKey.rp) throw new Error('Missing rp in publicKey')
    if (!credOpt.publicKey.rp.id) throw new Error('Missing rp.id in publicKey')
    if (!credOpt.publicKey.user) throw new Error('Missing user in publicKey')

    const credOptSer = {
      publicKey: {
        ...credOpt.publicKey,
        challenge: arrayBufferToBase64(credOpt.publicKey.challenge as ArrayBuffer),
        user: {
          ...credOpt.publicKey.user,
          id: arrayBufferToBase64(credOpt.publicKey.user.id as ArrayBuffer),
        },
        excludeCredentials: credOpt.publicKey.excludeCredentials?.map((c) => {
          return {
            ...c,
            id: arrayBufferToBase64(c.id as ArrayBuffer),
          }
        }),
      },
    } as CredentialCreationOptionsSerialized

    console.log('webauthn mock create credentialSerialized', credOptSer)

    if (!window[createCredFuncName] || typeof window[createCredFuncName] !== 'function') {
      throw new Error(`Missing ${createCredFuncName} function. Did you forget to expose it?`)
    }

    const credSer: PublicKeyCredentialAttestationSerialized = await window[createCredFuncName](
      credOptSer
    )

    console.log('webauthn mock create credSer', credSer)

    const cred = {
      ...credSer,
      rawId: base64ToArrayBuffer(credSer.rawId),
      response: {
        ...credSer.response,
        clientDataJSON: base64ToArrayBuffer(credSer.response.clientDataJSON),
        attestationObject: base64ToArrayBuffer(credSer.response.attestationObject),
      },
    }

    console.log('mocked! create cred', cred)

    return cred
  }
  navigator.credentials.get = async (credential: CredentialRequestOptions) => {
    console.log('[webauthn mock] get credential', credential)

    if (!credential.publicKey) throw new Error('Missing publicKey in credentialOptions')
    if (!credential.publicKey.challenge) throw new Error('Missing challenge in publicKey')
    if (!credential.publicKey.rpId) throw new Error('Missing rpId in publicKey')

    const credOpts = {
      publicKey: {
        ...credential.publicKey,
        challenge: arrayBufferToBase64(credential.publicKey.challenge as ArrayBuffer),
        allowCredentials: credential.publicKey.allowCredentials?.map((c) => {
          return {
            ...c,
            id: arrayBufferToBase64(c.id as ArrayBuffer),
          }
        }),
      },
    } as CredentialRequestOptionsSerialized

    if (!window[getCredFuncName] || typeof window[getCredFuncName] !== 'function') {
      throw new Error(`Missing ${getCredFuncName} function. Did you forget to expose it?`)
    }

    const assertion = await window[getCredFuncName](credential)

    console.debug('[webauthn mock] assertion', assertion)
    return assertion
  }
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
  const flags = new Uint8Array() // 1 byte Flags (bit 0 is the least significant bit): User Present (UP) flag (bit 0) set
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
  coseKey.set(3, -7) // alg: ES256 signature algorithm
  coseKey.set(-1, 1) // crv: P-256 curve
  coseKey.set(-2, publicKey.subarray(27, 27 + 32)) // x-coordinate as byte string 32 bytes in length
  coseKey.set(-3, publicKey.subarray(27 + 32, 27 + 32 + 32)) // y-coordinate as byte string 32 bytes in length

  const attestedCredentialData = Buffer.concat([
    aaguid,
    credentialIdLength,
    credentialId,
    Buffer.from(cbor.encode(coseKey)),
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
  clientDataJSON: string,
  privateKey: string
): Buffer {
  const concated = Buffer.concat([authData, Buffer.from(clientDataJSON, 'base64')])
  const sign = crypto.createSign('sha256')
  sign.write(concated)
  sign.end()
  const sig = sign.sign(privateKey)
  const attStmt = {
    alg: -7, // ES256 COSEAlgorithmIdentifier
    sig,
  }
  const fmt = 'packed'

  return cbor.encode({
    fmt,
    attStmt,
    authData,
  })
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
