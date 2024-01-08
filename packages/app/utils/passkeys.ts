import { p256 } from '@noble/curves/p256'
import { Hex, bytesToBigInt, hexToBytes, bytesToHex } from 'viem'
import { base64 } from '@scure/base'
import cbor from 'cbor'
import type { CreateResult, SignResult } from '@daimo/expo-passkeys'
import { assert } from './assert'

/**
 * DER-encoded public key prefix
 * ASN.1 SubjectPublicKeyInfo structure for EC public keys
 */
const derPrefix = '0x3059301306072a8648ce3d020106082a8648ce3d03010703420004'

export function isDERPubKey(pubKeyHex: Hex): boolean {
  return pubKeyHex.startsWith(derPrefix) && pubKeyHex.length === derPrefix.length + 128
}

export function derKeytoContractFriendlyKey(pubKeyHex: Hex): [Hex, Hex] {
  assert(isDERPubKey(pubKeyHex), 'Invalid DER public key')
  const pubKey = pubKeyHex.substring(derPrefix.length)
  assert(pubKey.length === 128)

  const key1 = `0x${pubKey.substring(0, 64)}` as Hex
  const key2 = `0x${pubKey.substring(64)}` as Hex
  return [key1, key2]
}

export function contractFriendlyKeyToDER(accountPubkey: readonly [Hex, Hex]): Hex {
  return (derPrefix + accountPubkey[0].substring(2) + accountPubkey[1].substring(2)) as Hex
}

// Parse DER-encoded P256-SHA256 signature to contract-friendly signature
// and normalize it so the signature is not malleable.
export function parseAndNormalizeSig(derSig: Hex): { r: bigint; s: bigint } {
  const parsedSignature = p256.Signature.fromDER(derSig.slice(2)).normalizeS()
  const bSig = hexToBytes(`0x${parsedSignature.toCompactHex()}`)
  assert(bSig.length === 64, 'signature is not 64 bytes')
  const bR = bSig.slice(0, 32)
  const bS = bSig.slice(32)
  const r = bytesToBigInt(bR)
  const s = bytesToBigInt(bS)
  return { r, s }
}

// Parses authenticatorData buffer to struct
// https://www.w3.org/TR/webauthn-2/#sctn-authenticator-data
function parseMakeCredAuthData(buffer: Uint8Array) {
  let buf = buffer
  const rpIdHash = buf.slice(0, 32)
  buf = buf.slice(32)
  const flagsBuf = buf.slice(0, 1)
  buf = buf.slice(1)
  const flags = flagsBuf[0]
  const counterBuf = buf.slice(0, 4)
  buf = buf.slice(4)
  const counter = Buffer.from(counterBuf).readUInt32BE(0)
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

// Takes COSE encoded public key and converts it to DER keys
// https://www.rfc-editor.org/rfc/rfc8152.html#section-13.1
export function COSEECDHAtoDER(COSEPublicKey: Uint8Array): Hex {
  return contractFriendlyKeyToDER(COSEECDHAtoXY(COSEPublicKey))
}

// Takes COSE encoded public key and return x and y coordinates
// https://www.rfc-editor.org/rfc/rfc8152.html#section-13.1
export function COSEECDHAtoXY(COSEPublicKey: Uint8Array): [Hex, Hex] {
  const coseStruct = cbor.decodeAllSync(COSEPublicKey)
  assert(coseStruct.length === 1, 'CBOR encoded public key must have exactly one element')
  const x = coseStruct[0].get(-2)
  const y = coseStruct[0].get(-3)
  return [`0x${Buffer.from(x).toString('hex')}`, `0x${Buffer.from(y).toString('hex')}`]
}

// Parses Webauthn MakeCredential authData
export function parseCreateResponse(result: CreateResult) {
  const rawAttestationObject = base64.decode(result.rawAttestationObjectB64)
  const attestationObject = cbor.decode(rawAttestationObject)
  return parseMakeCredAuthData(attestationObject.authData)
}

// Parses DER public key from Webauthn MakeCredential response
// https://www.w3.org/TR/webauthn-2/#sctn-op-make-cred
export function createResponseToDER(result: CreateResult) {
  const authData = parseCreateResponse(result)
  const pubKey = COSEECDHAtoDER(authData.COSEPublicKey)
  return pubKey
}

// Parses Webauthn GetAssertion response
// https://www.w3.org/TR/webauthn-2/#sctn-op-get-assertion
export function parseSignResponse(result: SignResult) {
  const derSig = base64.decode(result.signatureB64)
  const rawAuthenticatorData = base64.decode(result.rawAuthenticatorDataB64)
  const passkeyName = result.passkeyName
  const [accountName, keySlotStr] = passkeyName.split('.') // Assumes account name does not have periods (.) in it.
  assert(!!accountName && !!keySlotStr, 'Invalid passkey name')
  const keySlot = parseInt(keySlotStr, 10)
  const clientDataJSON = Buffer.from(base64.decode(result.rawClientDataJSONB64)).toString('utf-8')
  const challengeLocation = BigInt(clientDataJSON.indexOf('"challenge":"'))
  const responseTypeLocation = BigInt(clientDataJSON.indexOf('"type":"'))

  return {
    derSig: bytesToHex(derSig),
    rawAuthenticatorData,
    accountName,
    keySlot,
    clientDataJSON,
    challengeLocation,
    responseTypeLocation,
  }
}
