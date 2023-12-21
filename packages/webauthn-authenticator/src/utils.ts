import cbor from 'cbor'
import { AAGUID } from './aaguid'
import type {
  PublicKeyCredentialAttestationSerialized,
  Attestation,
  PublicKeyCredentialAssertionSerialized,
} from './types'
import { base64urlnopad } from '@scure/base'

export function bufferToBase64URL(buffer: Buffer | Uint8Array) {
  return base64urlnopad.encode(buffer)
}

export function base64URLToBuffer(str: string) {
  return base64urlnopad.decode(str)
}

/**
 * Deserialize a serialized public key credential attestation into a PublicKeyCredential.
 */
export function deserializePublicKeyCredentialAttestion(
  credential: PublicKeyCredentialAttestationSerialized
) {
  const credentialId = base64URLToBuffer(credential.id)
  const clientDataJSON = base64URLToBuffer(credential.response.clientDataJSON)
  const attestationObject = base64URLToBuffer(credential.response.attestationObject)
  const attestation = cbor.decodeAllSync(attestationObject)[0] as Attestation

  if (!attestation) {
    throw new Error('Invalid attestation object')
  }
  const { attStmt, authData } = attestation
  const coseResult = cbor.decodeAllSync(
    authData.subarray(37 + AAGUID.byteLength + 2 + credentialId.byteLength)
  )
  if (!coseResult || !coseResult[0]) {
    throw new Error('Invalid COSE key')
  }
  const publicCoseKey = coseResult[0]

  console.log('[webauthn-authenticator utils] publicCoseKey', publicCoseKey)

  const response: AuthenticatorAttestationResponse = {
    attestationObject,
    clientDataJSON,
    getAuthenticatorData() {
      return authData
    },
    // returns an array buffer containing the DER SubjectPublicKeyInfo of the new credential
    getPublicKey() {
      const key = [
        // ASN.1 SubjectPublicKeyInfo structure for EC public keys
        Buffer.from('3059301306072a8648ce3d020106082a8648ce3d03010703420004', 'hex'),
        publicCoseKey.get(-2),
        publicCoseKey.get(-3),
      ]
      console.log('key', key)
      return Buffer.concat(key)
    },
    getPublicKeyAlgorithm() {
      return attStmt.alg
    },
    getTransports() {
      return ['internal']
    },
  }
  return {
    id: bufferToBase64URL(credentialId),
    rawId: credentialId,
    authenticatorAttachment: 'platform',
    attestationObject,
    clientDataJSON,
    getClientExtensionResults() {
      return {}
    },
    response,
    type: 'public-key',
  } as PublicKeyCredential & {
    response: AuthenticatorAttestationResponse
  }
}

/**
 * Deserialize a serialized public key credential assertion into a PublicKeyCredential.
 */
export function deserializePublicKeyCredentialAssertion(
  credential: PublicKeyCredentialAssertionSerialized
) {
  const credentialId = base64URLToBuffer(credential.id)
  const clientDataJSON = base64URLToBuffer(credential.response.clientDataJSON)
  const authenticatorData = base64URLToBuffer(credential.response.authenticatorData)
  const signature = base64URLToBuffer(credential.response.signature)
  const userHandle = credential.response.userHandle
    ? base64URLToBuffer(credential.response.userHandle)
    : null

  const response: AuthenticatorAssertionResponse = {
    authenticatorData,
    clientDataJSON,
    signature,
    userHandle,
  }
  return {
    id: credential.id,
    rawId: credentialId,
    authenticatorAttachment: 'platform',
    clientDataJSON,
    getClientExtensionResults() {
      return {}
    },
    response,
    type: 'public-key',
  } as PublicKeyCredential & {
    response: AuthenticatorAssertionResponse
  }
}
