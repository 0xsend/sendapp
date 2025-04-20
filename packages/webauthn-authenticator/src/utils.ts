import { base64urlnopad } from '@scure/base'
import * as cbor from 'cbor2'
import { AAGUID } from './aaguid'
import type {
  Attestation,
  PublicKeyCredentialAssertionSerialized,
  PublicKeyCredentialAttestationSerialized,
} from './types'

export function bufferToBase64URL(buffer: Buffer | Uint8Array) {
  return base64urlnopad.encode(buffer)
}

export function base64URLToBuffer(str: string) {
  return base64urlnopad.decode(str)
}

/**
 * Safely converts a Buffer or Uint8Array to an ArrayBuffer
 * @param buffer The buffer to convert
 */
function toArrayBuffer(buffer: Buffer | Uint8Array): ArrayBuffer {
  return new Uint8Array(buffer).buffer
}

// Parses authenticatorData buffer to struct
// https://www.w3.org/TR/webauthn-2/#sctn-authenticator-data
export function parseCredAuthData(buffer: Uint8Array) {
  let buf = buffer
  const rpIdHash = buf.slice(0, 32)
  buf = buf.slice(32)
  const flagsBuf = buf.slice(0, 1)
  buf = buf.slice(1)
  const flags = flagsBuf[0]
  const counterBuf = buf.slice(0, 4)
  buf = buf.slice(4)
  const counter = Buffer.from(counterBuf).readUInt32BE(0)

  // in case of no attestation data
  if (buf.byteLength === 0) {
    return {
      rpIdHash,
      flagsBuf,
      flags,
      counter,
      counterBuf,
      aaguid: null,
      credID: null,
      COSEPublicKey: null,
    }
  }

  const aaguid = buf.slice(0, 16)
  buf = buf.slice(16)
  const credIDLenBuf = buf.slice(0, 2)
  buf = buf.slice(2)
  const credIDLen = Buffer.from(credIDLenBuf).readUInt16BE(0)
  const credID = buf.slice(0, credIDLen)
  buf = buf.slice(credIDLen)
  const COSEPublicKey = buf

  return {
    rpIdHash,
    flagsBuf,
    flags,
    counter,
    counterBuf,
    aaguid,
    credID,
    COSEPublicKey,
  }
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
  const attestation = cbor.decode(attestationObject) as Attestation
  if (!attestation) {
    throw new Error('Invalid attestation object')
  }
  const { attStmt, authData } = attestation

  const { COSEPublicKey } = parseCredAuthData(Buffer.from(authData))

  if (!COSEPublicKey) {
    throw new Error('Invalid COSEPublicKey')
  }
  const publicKey = cbor.decode<Map<number, ArrayBuffer>>(COSEPublicKey)

  const response: AuthenticatorAttestationResponse = {
    attestationObject: toArrayBuffer(attestationObject),
    clientDataJSON: toArrayBuffer(clientDataJSON),
    getAuthenticatorData() {
      return toArrayBuffer(Buffer.from(authData))
    },
    // returns an array buffer containing the DER SubjectPublicKeyInfo of the new credential
    getPublicKey() {
      const key = [
        // ASN.1 SubjectPublicKeyInfo structure for EC public keys
        Buffer.from('3059301306072a8648ce3d020106082a8648ce3d03010703420004', 'hex'),
        Buffer.from(publicKey.get(-2) as ArrayBuffer),
        Buffer.from(publicKey.get(-3) as ArrayBuffer),
      ]
      return toArrayBuffer(Buffer.concat(key))
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
    rawId: toArrayBuffer(credentialId),
    authenticatorAttachment: 'platform',
    attestationObject,
    clientDataJSON,
    getClientExtensionResults() {
      return {}
    },
    response,
    type: 'public-key',
    toJSON() {
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
      } as PublicKeyCredentialJSON
    },
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
    authenticatorData: toArrayBuffer(authenticatorData),
    clientDataJSON: toArrayBuffer(clientDataJSON),
    signature: toArrayBuffer(signature),
    userHandle: userHandle ? toArrayBuffer(userHandle) : null,
  }
  return {
    id: credential.id,
    rawId: toArrayBuffer(credentialId),
    authenticatorAttachment: 'platform',
    clientDataJSON,
    getClientExtensionResults() {
      return {}
    },
    response,
    type: 'public-key',
    toJSON() {
      return {
        id: credential.id,
        rawId: toArrayBuffer(credentialId),
        authenticatorAttachment: 'platform',
        clientDataJSON,
        getClientExtensionResults() {
          return {}
        },
        response,
        type: 'public-key',
      } as PublicKeyCredentialJSON
    },
  } as PublicKeyCredential & {
    response: AuthenticatorAssertionResponse
  }
}
