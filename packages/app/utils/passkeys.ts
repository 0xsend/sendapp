import { p256 } from '@noble/curves/p256'
import { Hex, bytesToBigInt, hexToBytes, bytesToHex } from 'viem'
import { base64, base16 } from '@scure/base'
import cbor from 'cbor'
import { CreateResult, SignResult } from '@daimo/expo-passkeys'

const derPrefix = '0x3059301306072a8648ce3d020106082a8648ce3d03010703420004'

function assert(condition: boolean, msg?: string): asserts condition {
  if (!condition) throw new Error(msg || 'Assertion failed')
}

export function isDERPubKey(pubKeyHex: Hex): boolean {
  return pubKeyHex.startsWith(derPrefix) && pubKeyHex.length === derPrefix.length + 128
}

export function derKeytoContractFriendlyKey(pubKeyHex: Hex): [Hex, Hex] {
  if (!isDERPubKey(pubKeyHex)) {
    throw new Error('Invalid public key format')
  }

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
  const parsedSignature = p256.Signature.fromDER(derSig.slice(2))
  const bSig = hexToBytes(`0x${parsedSignature.toCompactHex()}`)
  assert(bSig.length === 64, 'signature is not 64 bytes')
  const bR = bSig.slice(0, 32)
  const bS = bSig.slice(32)

  // Avoid malleability. Ensure low S (<= N/2 where N is the curve order)
  const r = bytesToBigInt(bR)
  let s = bytesToBigInt(bS)
  const n = BigInt('0xFFFFFFFF00000000FFFFFFFFFFFFFFFFBCE6FAADA7179E84F3B9CAC2FC632551')
  if (s > n / 2n) {
    s = n - s
  }
  return { r, s }
}

export function parseAuthDataFromAttestationObject(attestationObject: Uint8Array) {
  const attestation = cbor.decodeAllSync(attestationObject)[0] as {
    fmt: string
    attStmt: {
      alg: number
      sig: Buffer
    }
    authData: Buffer
  }
  console.log('attestation', attestation)
  assert(!!attestation, 'Invalid attestation object')
  assert(attestation.authData.length >= 37, 'Invalid authData length')
  return attestation
}

// Parses authenticatorData buffer to struct
// https://www.w3.org/TR/webauthn-2/#sctn-authenticator-data
function parseMakeCredAuthData(buffer: Uint8Array) {
  const rpIdHash = buffer.slice(0, 32)
  buffer = buffer.slice(32)
  const flagsBuf = buffer.slice(0, 1)
  buffer = buffer.slice(1)
  const flags = flagsBuf[0]
  const counterBuf = buffer.slice(0, 4)
  buffer = buffer.slice(4)
  const counter = Buffer.from(counterBuf).readUInt32BE(0)
  const aaguid = buffer.slice(0, 16)
  buffer = buffer.slice(16)
  const credIDLenBuf = buffer.slice(0, 2)
  buffer = buffer.slice(2)
  const credIDLen = Buffer.from(credIDLenBuf).readUInt16BE(0)
  const credID = buffer.slice(0, credIDLen)
  buffer = buffer.slice(credIDLen)
  const COSEPublicKey = buffer

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
function COSEECDHAtoDER(COSEPublicKey: Uint8Array): Hex {
  const coseStruct = cbor.decodeAllSync(COSEPublicKey)[0]
  const x = coseStruct.get(-2)
  const y = coseStruct.get(-3)

  return contractFriendlyKeyToDER([
    `0x${Buffer.from(x).toString('hex')}`,
    `0x${Buffer.from(y).toString('hex')}`,
  ])
}

// Parses Webauthn MakeCredential response
// https://www.w3.org/TR/webauthn-2/#sctn-op-make-cred
export function parseCreateResponse(result: CreateResult) {
  const rawAttestationObject = base64.decode(result.rawAttestationObjectB64)
  const attestationObject = cbor.decode(rawAttestationObject)
  const authData = parseMakeCredAuthData(attestationObject.authData)
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
