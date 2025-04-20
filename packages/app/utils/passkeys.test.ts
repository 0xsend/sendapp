import crypto from 'node:crypto'
import type { CreateResult, SignResult } from '@daimo/expo-passkeys'
import { describe, it, expect } from '@jest/globals'
import { p256 } from '@noble/curves/p256'
import { base64 } from '@scure/base'
import { type Hex, bytesToHex } from 'viem'
import {
  contractFriendlyKeyToDER,
  createResponseToDER,
  derKeytoContractFriendlyKey,
  parseAndNormalizeSig,
  parseCreateResponse,
  parseSignResponse,
} from './passkeys'

type ExpectedCreateResult = {
  expectedDer: Hex
  expectedAuthData: {
    rpIdHash: Hex
    flags: number
    counter: number
    aaguid: Hex
    credID: Hex
    COSEPublicKey: Hex
  }
}

const mockAttestations: [CreateResult, ExpectedCreateResult][] = [
  [
    {
      credentialIDB64: 'y5p83Ze+tE9+X1GsNFxK2w==',
      rawClientDataJSONB64:
        'eyJ0eXBlIjoid2ViYXV0aG4uY3JlYXRlIiwiY2hhbGxlbmdlIjoiYzI5dFpTQmphR0ZzYkdWdVoyVSIsIm9yaWdpbiI6Imh0dHBzOi8vc2VuZGFwcC5sb2NhbGhvc3QifQ==',
      rawAttestationObjectB64:
        'o2NmbXRkbm9uZWdhdHRTdG10oGhhdXRoRGF0YViUVVJTlMb5JhbV7rFoaFKDcCvBmzc1HOD7tW1Q7aed139dAAAAALraVWanqkAfvZZFYZpVEg0AECiF0g45fqmWxdVxz4i5f4ulAQIDJiABIVggfpK6HX0EGYMbV8afoFaCZkUcfQ+dw9YE0jSNRcAC0zYiWCAdWvSb1BQUVM3/dW/urTzaX80vFmZ95ClXofI1uTn4Gg==',
    },
    {
      expectedAuthData: {
        rpIdHash: '0x55525394c6f92616d5eeb168685283702bc19b37351ce0fbb56d50eda79dd77f',
        flags: 93,
        counter: 0,
        aaguid: '0xbada5566a7aa401fbd9645619a55120d',
        credID: '0x2885d20e397ea996c5d571cf88b97f8b',
        COSEPublicKey:
          '0xa50102032620012158207e92ba1d7d0419831b57c69fa0568266451c7d0f9dc3d604d2348d45c002d3362258201d5af49bd4141454cdff756feead3cda5fcd2f16667de42957a1f235b939f81a',
      },
      expectedDer:
        '0x3059301306072a8648ce3d020106082a8648ce3d030107034200047e92ba1d7d0419831b57c69fa0568266451c7d0f9dc3d604d2348d45c002d3361d5af49bd4141454cdff756feead3cda5fcd2f16667de42957a1f235b939f81a',
    },
  ],
  [
    {
      credentialIDB64: 'y5p83Ze+tE9+X1GsNFxK2w==',
      rawAttestationObjectB64:
        'o2NmbXRkbm9uZWdhdHRTdG10oGhhdXRoRGF0YViYizwk775fdfZnAPIbCJXH2QqOQs1ZeTxiGxM/cExRMsRdAAAAAAAAAAAAAAAAAAAAAAAAAAAAFI6/XGQDoO+69ZA1ZDSqXMU1A8q2pQECAyYgASFYILbo5B0aQxUxtm2tq4VU9VILS61c4ZSqXLXFEBdgbo61Ilgg4Lme/b/dEoIbWLn85MlpREPQLp82agWlpoaOLVgTgsQ=',
      rawClientDataJSONB64:
        'eyJ0eXBlIjoid2ViYXV0aG4uY3JlYXRlIiwiY2hhbGxlbmdlIjoiWTNKbFlYUmxJR3RsZVNCMFpYTjBNek1nTVRJNCIsIm9yaWdpbiI6Imh0dHBzOi8vZGFpbW8ueHl6In0=',
    },
    {
      expectedAuthData: {
        rpIdHash: '0x8b3c24efbe5f75f66700f21b0895c7d90a8e42cd59793c621b133f704c5132c4',
        flags: 93,
        counter: 0,
        aaguid: '0x00000000000000000000000000000000',
        credID: '0x8ebf5c6403a0efbaf590356434aa5cc53503cab6',
        COSEPublicKey:
          '0xa5010203262001215820b6e8e41d1a431531b66dadab8554f5520b4bad5ce194aa5cb5c51017606e8eb5225820e0b99efdbfdd12821b58b9fce4c9694443d02e9f366a05a5a6868e2d581382c4',
      },
      expectedDer:
        '0x3059301306072a8648ce3d020106082a8648ce3d03010703420004b6e8e41d1a431531b66dadab8554f5520b4bad5ce194aa5cb5c51017606e8eb5e0b99efdbfdd12821b58b9fce4c9694443d02e9f366a05a5a6868e2d581382c4',
    },
  ],
]

const expectedParsedAssertions = [
  {
    derSig:
      '0x3045022100820869b66e0c61894cf32fa0bf5351e74486b9c2cd983c6485685473063cee2d02202a24a3f1b168fcd86fd2f4e03da83538f284f6b37eb90b05a42a713b99350077',
    rawAuthenticatorData:
      '0x55525394c6f92616d5eeb168685283702bc19b37351ce0fbb56d50eda79dd77f1d00000000',
    accountName: 'sendappuser',
    keySlot: 1,
    clientDataJSON:
      '{"type":"webauthn.get","challenge":"YW5vdGhlciBjaGFsbGVuZ2U","origin":"https://sendapp.localhost"}',
    challengeLocation: '17',
    responseTypeLocation: '1',
  },
] as const

const mockAssertions: [SignResult, (typeof expectedParsedAssertions)[number]][] = [
  [
    {
      id: '1',
      passkeyName: 'sendappuser.1',
      rawClientDataJSONB64:
        'eyJ0eXBlIjoid2ViYXV0aG4uZ2V0IiwiY2hhbGxlbmdlIjoiWVc1dmRHaGxjaUJqYUdGc2JHVnVaMlUiLCJvcmlnaW4iOiJodHRwczovL3NlbmRhcHAubG9jYWxob3N0In0=',
      rawAuthenticatorDataB64: 'VVJTlMb5JhbV7rFoaFKDcCvBmzc1HOD7tW1Q7aed138dAAAAAA==',
      signatureB64:
        'MEUCIQCCCGm2bgxhiUzzL6C/U1HnRIa5ws2YPGSFaFRzBjzuLQIgKiSj8bFo/Nhv0vTgPag1OPKE9rN+uQsFpCpxO5k1AHc=',
    },
    expectedParsedAssertions[0],
  ],
]

describe(createResponseToDER.name, () => {
  it('can parse attestation objects', () => {
    for (const [attestation, { expectedDer: expected }] of mockAttestations) {
      const parsed = createResponseToDER(attestation)
      expect(parsed).toStrictEqual(expected)
    }
  })
})

describe(parseCreateResponse.name, () => {
  it('can parse attestation objects', () => {
    for (const [attestation, { expectedAuthData }] of mockAttestations) {
      const authData = parseCreateResponse(attestation)
      expect({
        rpIdHash: bytesToHex(authData.rpIdHash),
        flags: authData.flags,
        counter: authData.counter,
        aaguid: bytesToHex(authData.aaguid),
        credID: bytesToHex(authData.credID),
        COSEPublicKey: bytesToHex(authData.COSEPublicKey),
      }).toStrictEqual({
        rpIdHash: expectedAuthData.rpIdHash,
        flags: expectedAuthData.flags,
        counter: expectedAuthData.counter,
        aaguid: expectedAuthData.aaguid,
        credID: expectedAuthData.credID,
        COSEPublicKey: expectedAuthData.COSEPublicKey,
      })
    }
  })
})

describe('parseSignResponse', () => {
  it('can parse assertion objects', () => {
    for (const [assertion, expected] of mockAssertions) {
      const parsed = parseSignResponse(assertion)
      expect({
        derSig: parsed.derSig,
        rawAuthenticatorData: bytesToHex(parsed.rawAuthenticatorData),
        accountName: parsed.accountName,
        keySlot: parsed.keySlot,
        clientDataJSON: parsed.clientDataJSON,
        challengeLocation: parsed.challengeLocation.toString(16),
        responseTypeLocation: parsed.responseTypeLocation.toString(16),
      }).toStrictEqual(expected)
    }
  })
})

describe('parseAndNormalizeSig', () => {
  it('can parse assertion signatures', () => {
    for (const [assertion, expected] of mockAssertions) {
      // Parse the DER-encoded signature
      const parsedExpectedSig = p256.Signature.fromDER(expected.derSig.slice(2))
      const expectedR = parsedExpectedSig.r.toString(16)
      const expectedS = parsedExpectedSig.s.toString(16)

      const sig = parseAndNormalizeSig(bytesToHex(base64.decode(assertion.signatureB64)))
      const rHex = sig.r.toString(16)
      const sHex = sig.s.toString(16)

      expect({
        r: rHex,
        s: sHex,
      }).toStrictEqual({
        r: expectedR,
        s: expectedS,
      })
    }
  })

  it('normalizes high S values', () => {
    const derSigWithHighS =
      '0x30450220116eb9d4575e8c803fc29df2da4bfe5ad213d607d0bac0e221b02ad483c800df02210083e7ab74aaca9e3990ed5ed67a63ac11fcd2ee45e351bb6cf211edead5c566b9'
    const parsedSig = p256.Signature.fromDER(derSigWithHighS.slice(2))
    expect(parsedSig.hasHighS()).toBe(true)
    const normalizedSig = parseAndNormalizeSig(derSigWithHighS)
    expect(normalizedSig.r.toString(16)).toBe(parsedSig.r.toString(16))
    expect(normalizedSig.s.toString(16)).toBe(parsedSig.normalizeS().s.toString(16))
  })
})

describe('derKeytoContractFriendlyKey', () => {
  it('can convert DER keys to contract-friendly keys', () => {
    const { publicKey } = crypto.generateKeyPairSync('ec', {
      namedCurve: 'prime256v1',
      publicKeyEncoding: { type: 'spki', format: 'der' },
      privateKeyEncoding: { type: 'sec1', format: 'pem' },
    })

    const contractFriendlyKey = derKeytoContractFriendlyKey(bytesToHex(publicKey))
    expect(contractFriendlyKey).toStrictEqual([
      bytesToHex(Uint8Array.prototype.slice.call(publicKey, 27, 59)),
      bytesToHex(Uint8Array.prototype.slice.call(publicKey, 59)),
    ])
  })
})

describe('contractFriendlyKeyToDER', () => {
  it('can convert contract-friendly keys to DER keys', () => {
    const { publicKey } = crypto.generateKeyPairSync('ec', {
      namedCurve: 'prime256v1',
      publicKeyEncoding: { type: 'spki', format: 'der' },
      privateKeyEncoding: { type: 'sec1', format: 'pem' },
    })
    const contractFriendlyKey = derKeytoContractFriendlyKey(bytesToHex(publicKey))
    const derKey = contractFriendlyKeyToDER(contractFriendlyKey)
    expect(derKey).toStrictEqual(bytesToHex(publicKey))
  })
})

const createResult = {
  credentialIDB64: 'y5p83Ze+tE9+X1GsNFxK2w==',
  rawAttestationObjectB64:
    'o2NmbXRkbm9uZWdhdHRTdG10oGhhdXRoRGF0YViYizwk775fdfZnAPIbCJXH2QqOQs1ZeTxiGxM/cExRMsRdAAAAAAAAAAAAAAAAAAAAAAAAAAAAFI6/XGQDoO+69ZA1ZDSqXMU1A8q2pQECAyYgASFYILbo5B0aQxUxtm2tq4VU9VILS61c4ZSqXLXFEBdgbo61Ilgg4Lme/b/dEoIbWLn85MlpREPQLp82agWlpoaOLVgTgsQ=',
  rawClientDataJSONB64:
    'eyJ0eXBlIjoid2ViYXV0aG4uY3JlYXRlIiwiY2hhbGxlbmdlIjoiWTNKbFlYUmxJR3RsZVNCMFpYTjBNek1nTVRJNCIsIm9yaWdpbiI6Imh0dHBzOi8vZGFpbW8ueHl6In0=',
}

const signResult = {
  id: '1',
  passkeyName: 'test33.128',
  rawAuthenticatorDataB64: 'izwk775fdfZnAPIbCJXH2QqOQs1ZeTxiGxM/cExRMsQdAAAAAA==',
  rawClientDataJSONB64:
    'eyJ0eXBlIjoid2ViYXV0aG4uZ2V0IiwiY2hhbGxlbmdlIjoiM3EwIiwib3JpZ2luIjoiaHR0cHM6Ly9kYWltby54eXoifQ==',
  signatureB64:
    'MEQCID7Flt3axeMxi1ZqPcRVfWB7PTlEr7ATkiCzWe5G080wAiB5/xo5R/SuGDdjbUN4Uaw0hNg4d/f86Hbk/9sVH+n9rQ==',
}

describe('Passkey', () => {
  it('Parses create response', () => {
    const derKey = createResponseToDER(createResult)
    const expectedContractKey = [
      '0xb6e8e41d1a431531b66dadab8554f5520b4bad5ce194aa5cb5c51017606e8eb5',
      '0xe0b99efdbfdd12821b58b9fce4c9694443d02e9f366a05a5a6868e2d581382c4',
    ] as [Hex, Hex]
    expect(derKey).toEqual(contractFriendlyKeyToDER(expectedContractKey))
  })

  it('Parses sign response', () => {
    const parsedSignResponse = parseSignResponse(signResult)
    expect(parsedSignResponse.accountName).toEqual('test33')
    expect(parsedSignResponse.keySlot).toEqual(128)
    const { r, s } = parseAndNormalizeSig(parsedSignResponse.derSig)
    expect(r).toEqual(BigInt('0x3ec596dddac5e3318b566a3dc4557d607b3d3944afb0139220b359ee46d3cd30'))
    expect(s).toEqual(BigInt('0x79ff1a3947f4ae1837636d437851ac3484d83877f7fce876e4ffdb151fe9fdad'))
    expect(JSON.parse(parsedSignResponse.clientDataJSON)).toEqual({
      type: 'webauthn.get',
      challenge: '3q0',
      origin: 'https://daimo.xyz',
    })
    expect(parsedSignResponse.responseTypeLocation).toEqual(1n)
    expect(parsedSignResponse.challengeLocation).toEqual(23n)
  })
})
