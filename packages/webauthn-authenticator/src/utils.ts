import cbor from 'cbor'
import { AAGUID } from './aaguid'
import type { PublicKeyCredentialAttestationSerialized, Attestation } from './types'

/**
 * Deserialize a serialized public key credential attestation into a PublicKeyCredential.
 *
 * TODO: export to a preload.js file and expose via context.exposeFunction or page.exposeFunction
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
  const coseKeyElems = cbor.decodeAllSync(
    authData.subarray(37 + AAGUID.byteLength + 2 + credentialId.byteLength)
  )
  const publicCoseKey = new Map()
  for (let i = 0; i < coseKeyElems.length; i += 2) {
    publicCoseKey.set(coseKeyElems[i], coseKeyElems[i + 1])
  }

  const response: AuthenticatorAttestationResponse = {
    attestationObject,
    clientDataJSON,
    getAuthenticatorData() {
      return authData
    },
    // returns an array buffer containing the DER SubjectPublicKeyInfo of the new credential
    getPublicKey() {
      return Buffer.concat([
        // ASN.1 SubjectPublicKeyInfo structure for EC public keys
        Buffer.from('3059301306072a8648ce3d020106082a8648ce3d03010703420004', 'hex'),
        publicCoseKey.get(-2),
        publicCoseKey.get(-3),
      ])
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
