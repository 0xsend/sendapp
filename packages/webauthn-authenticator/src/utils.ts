import cbor from 'cbor'
import { AAGUID } from './aaguid'
import type {
  PublicKeyCredentialAttestationSerialized,
  Attestation,
  PublicKeyCredentialAssertionSerialized,
} from './types'

/**
 * Deserialize a serialized public key credential attestation into a PublicKeyCredential.
 */
export function deserializePublicKeyCredentialAttestion(
  credential: PublicKeyCredentialAttestationSerialized
) {
  const credentialId = Buffer.from(credential.id, 'base64')
  const clientDataJSON = Buffer.from(credential.response.clientDataJSON, 'base64')
  const attestationObject = Buffer.from(credential.response.attestationObject, 'base64')
  const attestation = cbor.decodeAllSync(attestationObject)[0] as Attestation

  if (!attestation) {
    throw new Error('Invalid attestation object')
  }
  const { attStmt, authData } = attestation
  // so weird, but decoder is not decoding to Map so we have to do it manually
  const publicCoseKey = cbor.decodeAllSync(
    authData.subarray(37 + AAGUID.byteLength + 2 + credentialId.byteLength)
  )[0]

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
    id: credentialId.toString('base64'),
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
  const credentialId = Buffer.from(credential.id, 'base64')
  const clientDataJSON = Buffer.from(credential.response.clientDataJSON, 'base64')
  const authenticatorData = Buffer.from(credential.response.authenticatorData, 'base64')
  const signature = Buffer.from(credential.response.signature, 'base64')
  const userHandle = credential.response.userHandle
    ? Buffer.from(credential.response.userHandle, 'base64')
    : null

  const response: AuthenticatorAssertionResponse = {
    authenticatorData,
    clientDataJSON,
    signature,
    userHandle,
  }
  return {
    id: credentialId.toString('base64'),
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
