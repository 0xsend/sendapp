import { describe, expect, it } from '@jest/globals'
import { p256 } from '@noble/curves/p256'
import { base64, base64urlnopad } from '@scure/base'
import crypto from 'node:crypto'
import type {
  AuthenticationResponseJSON,
  RegistrationResponseJSON,
} from 'react-native-passkeys/build/ReactNativePasskeys.types'
import { bytesToHex, type Hex } from 'viem'
import {
  contractFriendlyKeyToDER,
  COSEECDHAtoXY,
  createResponseToDER,
  decodeCBORWithExtensions,
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

const mockAttestations: [RegistrationResponseJSON, ExpectedCreateResult][] = [
  [
    // @ts-expect-error this is a mock
    {
      id: base64urlnopad.encode(base64.decode('y5p83Ze+tE9+X1GsNFxK2w==')),
      response: {
        clientDataJSON: base64urlnopad.encode(
          base64.decode(
            'eyJ0eXBlIjoid2ViYXV0aG4uY3JlYXRlIiwiY2hhbGxlbmdlIjoiYzI5dFpTQmphR0ZzYkdWdVoyVSIsIm9yaWdpbiI6Imh0dHBzOi8vc2VuZGFwcC5sb2NhbGhvc3QifQ=='
          )
        ),
        attestationObject: base64urlnopad.encode(
          base64.decode(
            'o2NmbXRkbm9uZWdhdHRTdG10oGhhdXRoRGF0YViUVVJTlMb5JhbV7rFoaFKDcCvBmzc1HOD7tW1Q7aed139dAAAAALraVWanqkAfvZZFYZpVEg0AECiF0g45fqmWxdVxz4i5f4ulAQIDJiABIVggfpK6HX0EGYMbV8afoFaCZkUcfQ+dw9YE0jSNRcAC0zYiWCAdWvSb1BQUVM3/dW/urTzaX80vFmZ95ClXofI1uTn4Gg=='
          )
        ),
      },
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
    // @ts-expect-error this is a mock
    {
      id: base64urlnopad.encode(base64.decode('y5p83Ze+tE9+X1GsNFxK2w==')),
      response: {
        clientDataJSON: base64urlnopad.encode(
          base64.decode(
            'eyJ0eXBlIjoid2ViYXV0aG4uY3JlYXRlIiwiY2hhbGxlbmdlIjoiWTNKbFlYUmxJR3RsZVNCMFpYTjBNek1nTVRJNCIsIm9yaWdpbiI6Imh0dHBzOi8vZGFpbW8ueHl6In0='
          )
        ),
        attestationObject: base64urlnopad.encode(
          base64.decode(
            'o2NmbXRkbm9uZWdhdHRTdG10oGhhdXRoRGF0YViYizwk775fdfZnAPIbCJXH2QqOQs1ZeTxiGxM/cExRMsRdAAAAAAAAAAAAAAAAAAAAAAAAAAAAFI6/XGQDoO+69ZA1ZDSqXMU1A8q2pQECAyYgASFYILbo5B0aQxUxtm2tq4VU9VILS61c4ZSqXLXFEBdgbo61Ilgg4Lme/b/dEoIbWLn85MlpREPQLp82agWlpoaOLVgTgsQ='
          )
        ),
      },
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
    accountName: 'd7302060-a077-4024-93a5-316c487945d0',
    challengeLocation: 23n,
    clientDataJSON:
      '{"type":"webauthn.get","challenge":"AQAAaAZNXckjIuVV8dXk6hFtq2L3Wf5_GFiDlhO_y_dXwXNi_nqh","origin":"https://sendapp.localhost","crossOrigin":false}',
    derSig:
      '0x3045022100f25af14855f5884d8aed5b27fb576da196c710bc2afe7a3f90420e8a0bd7de7c022047079de5f4c7ecf5c155c9f0efa852160176baa036280138f6839c13fa614c89',
    keySlot: 0,
    rawAuthenticatorData:
      '0x55525394c6f92616d5eeb168685283702bc19b37351ce0fbb56d50eda79dd77f050000000a',
    responseTypeLocation: 1n,
  },
] as const

const mockAssertions: [AuthenticationResponseJSON, (typeof expectedParsedAssertions)[number]][] = [
  [
    {
      id: 'gHqym2me8Gz82DbicLdfMfVqimIFilsqjEq5aU7d-SI',
      rawId: 'gHqym2me8Gz82DbicLdfMfVqimIFilsqjEq5aU7d-SI',
      response: {
        clientDataJSON:
          'eyJ0eXBlIjoid2ViYXV0aG4uZ2V0IiwiY2hhbGxlbmdlIjoiQVFBQWFBWk5YY2tqSXVWVjhkWGs2aEZ0cTJMM1dmNV9HRmlEbGhPX3lfZFh3WE5pX25xaCIsIm9yaWdpbiI6Imh0dHBzOi8vc2VuZGFwcC5sb2NhbGhvc3QiLCJjcm9zc09yaWdpbiI6ZmFsc2V9',
        authenticatorData: 'VVJTlMb5JhbV7rFoaFKDcCvBmzc1HOD7tW1Q7aed138FAAAACg',
        signature:
          'MEUCIQDyWvFIVfWITYrtWyf7V22hlscQvCr-ej-QQg6KC9fefAIgRwed5fTH7PXBVcnw76hSFgF2uqA2KAE49oOcE_phTIk',
        userHandle: 'ZDczMDIwNjAtYTA3Ny00MDI0LTkzYTUtMzE2YzQ4Nzk0NWQwLjA',
      },
      clientExtensionResults: {},
      type: 'public-key',
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
        challengeLocation: parsed.challengeLocation,
        responseTypeLocation: parsed.responseTypeLocation,
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

      const sig = parseAndNormalizeSig(
        bytesToHex(base64urlnopad.decode(assertion.response.signature))
      )
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

// @ts-expect-error this is a mock
const createResult: RegistrationResponseJSON = {
  id: 'y5p83Ze+tE9+X1GsNFxK2w==',
  response: {
    attestationObject: base64urlnopad.encode(
      base64.decode(
        'o2NmbXRkbm9uZWdhdHRTdG10oGhhdXRoRGF0YViYizwk775fdfZnAPIbCJXH2QqOQs1ZeTxiGxM/cExRMsRdAAAAAAAAAAAAAAAAAAAAAAAAAAAAFI6/XGQDoO+69ZA1ZDSqXMU1A8q2pQECAyYgASFYILbo5B0aQxUxtm2tq4VU9VILS61c4ZSqXLXFEBdgbo61Ilgg4Lme/b/dEoIbWLn85MlpREPQLp82agWlpoaOLVgTgsQ='
      )
    ),
    clientDataJSON: base64urlnopad.encode(
      base64.decode(
        'eyJ0eXBlIjoid2ViYXV0aG4uY3JlYXRlIiwiY2hhbGxlbmdlIjoiWTNKbFlYUmxJR3RsZVNCMFpYTjBNek1nTVRJNCIsIm9yaWdpbiI6Imh0dHBzOi8vZGFpbW8ueHl6In0='
      )
    ),
  },
}

const signResult: AuthenticationResponseJSON = {
  id: 'gHqym2me8Gz82DbicLdfMfVqimIFilsqjEq5aU7d-SI',
  rawId: 'gHqym2me8Gz82DbicLdfMfVqimIFilsqjEq5aU7d-SI',
  response: {
    clientDataJSON:
      'eyJ0eXBlIjoid2ViYXV0aG4uZ2V0IiwiY2hhbGxlbmdlIjoiQVFBQWFBWk1lejZoenYtdUpjU0lYMzJQdGdhUEptMkVwMHBhdGxxU01PcURLclBJYklDbyIsIm9yaWdpbiI6Imh0dHBzOi8vc2VuZGFwcC5sb2NhbGhvc3QiLCJjcm9zc09yaWdpbiI6ZmFsc2UsIm90aGVyX2tleXNfY2FuX2JlX2FkZGVkX2hlcmUiOiJkbyBub3QgY29tcGFyZSBjbGllbnREYXRhSlNPTiBhZ2FpbnN0IGEgdGVtcGxhdGUuIFNlZSBodHRwczovL2dvby5nbC95YWJQZXgifQ',
    authenticatorData: 'VVJTlMb5JhbV7rFoaFKDcCvBmzc1HOD7tW1Q7aed138FAAAACA',
    signature:
      'MEUCIQDIcHvXaTfrleOetNccR0F0cMV0s72YS8nkWE0POYHXwwIgFP_2Ij20BE02Ej5qMg1FM-sqY1gGJs0x8Nmr7kvn5zc',
    userHandle: 'ZDczMDIwNjAtYTA3Ny00MDI0LTkzYTUtMzE2YzQ4Nzk0NWQwLjA',
  },
  clientExtensionResults: {},
  type: 'public-key',
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
    expect(parsedSignResponse.accountName).toEqual('d7302060-a077-4024-93a5-316c487945d0')
    expect(parsedSignResponse.keySlot).toEqual(0)
    const { r, s } = parseAndNormalizeSig(parsedSignResponse.derSig)
    expect(r).toEqual(
      90661311310178440280483027166461848589758788641220681684302042449695901603779n
    )
    expect(s).toEqual(9498501725921417342599962913269823263022187497481156602522757345925034141495n)
    expect(JSON.parse(parsedSignResponse.clientDataJSON)).toEqual({
      type: 'webauthn.get',
      challenge: 'AQAAaAZMez6hzv-uJcSIX32PtgaPJm2Ep0patlqSMOqDKrPIbICo',
      crossOrigin: false,
      origin: 'https://sendapp.localhost',
      other_keys_can_be_added_here:
        'do not compare clientDataJSON against a template. See https://goo.gl/yabPex',
    })
    expect(parsedSignResponse.responseTypeLocation).toEqual(1n)
    expect(parsedSignResponse.challengeLocation).toEqual(23n)
  })
})

describe('COSEECDHAtoXY with WebAuthn extensions', () => {
  it('handles standard 77-byte COSE key without extensions', () => {
    // Standard P-256 key (77 bytes) - user key slot 0
    const standardKey = new Uint8Array([
      165, 1, 2, 3, 38, 32, 1, 33, 88, 32, 171, 8, 195, 219, 141, 226, 108, 106, 113, 234, 83, 216,
      147, 85, 132, 185, 16, 78, 73, 167, 74, 232, 103, 153, 13, 71, 49, 224, 25, 12, 109, 167, 34,
      88, 32, 175, 158, 40, 142, 171, 234, 228, 164, 131, 185, 29, 87, 158, 239, 249, 206, 246, 43,
      196, 243, 153, 32, 53, 83, 19, 224, 196, 175, 49, 105, 90, 127,
    ])

    const [x, y] = COSEECDHAtoXY(standardKey)

    expect(x).toBe('0xab08c3db8de26c6a71ea53d8935584b9104e49a74ae867990d4731e0190c6da7')
    expect(y).toBe('0xaf9e288eabeae4a483b91d579eeff9cef62bc4f39920355313e0c4af31695a7f')
  })

  it('handles 91-byte COSE key with credProtect extension (production user case)', () => {
    // Real production key from user f20775c9-90b1-4cf9-9a56-c2dfb260cc67
    // 77 bytes COSE key + 14 bytes credProtect extension
    const keyWithCredProtect = new Uint8Array([
      165, 1, 2, 3, 38, 32, 1, 33, 88, 32, 175, 156, 10, 134, 77, 217, 255, 18, 193, 117, 115, 81,
      207, 211, 56, 163, 209, 114, 58, 53, 165, 10, 166, 23, 208, 11, 121, 253, 16, 242, 74, 39, 34,
      88, 32, 204, 37, 178, 31, 50, 223, 114, 22, 160, 11, 39, 18, 56, 213, 15, 168, 37, 68, 38, 80,
      249, 171, 58, 244, 36, 67, 101, 238, 27, 56, 81, 255,
      // credProtect extension (14 bytes)
      161, 107, 99, 114, 101, 100, 80, 114, 111, 116, 101, 99, 116, 2,
    ])

    const [x, y] = COSEECDHAtoXY(keyWithCredProtect)

    // Expected X and Y coordinates from the first 77 bytes
    expect(x).toBe('0xaf9c0a864dd9ff12c1757351cfd338a3d1723a35a50aa617d00b79fd10f24a27')
    expect(y).toBe('0xcc25b21f32df7216a00b271238d50fa825442650f9ab3af4244365ee1b3851ff')
  })

  it('handles another production user key with credProtect (key slot 1)', () => {
    // Real production key from user f20775c9-90b1-4cf9-9a56-c2dfb260cc67, key slot 1
    const keyWithCredProtect = new Uint8Array([
      165, 1, 2, 3, 38, 32, 1, 33, 88, 32, 238, 51, 207, 123, 157, 18, 154, 99, 161, 88, 226, 61,
      255, 121, 35, 179, 252, 235, 38, 139, 118, 149, 132, 67, 35, 137, 181, 91, 158, 209, 172, 156,
      34, 88, 32, 132, 50, 197, 125, 226, 173, 219, 121, 112, 66, 18, 244, 8, 243, 143, 125, 184,
      195, 194, 95, 193, 141, 81, 103, 104, 161, 159, 204, 243, 134, 229, 200,
    ])

    const [x, y] = COSEECDHAtoXY(keyWithCredProtect)

    expect(x).toBe('0xee33cf7b9d129a63a158e23dff7923b3fceb268b769584432389b55b9ed1ac9c')
    expect(y).toBe('0x8432c57de2addb79704212f408f38f7db8c3c25fc18d516768a19fccf386e5c8')
  })

  it('extracts correct coordinates regardless of extension data', () => {
    // Create a key with arbitrary extension data
    const coseKey = new Uint8Array([
      165, 1, 2, 3, 38, 32, 1, 33, 88, 32,
      // X coordinate (32 bytes)
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26,
      27, 28, 29, 30, 31, 32, 34, 88, 32,
      // Y coordinate (32 bytes)
      33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55,
      56, 57, 58, 59, 60, 61, 62, 63, 64,
    ])

    const [x, y] = COSEECDHAtoXY(coseKey)

    expect(x).toBe('0x0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f20')
    expect(y).toBe('0x2122232425262728292a2b2c2d2e2f303132333435363738393a3b3c3d3e3f40')
  })

  it('handles 78-byte COSE key (minor variation)', () => {
    // Some authenticators produce 78-byte keys (less common)
    const key78Bytes = new Uint8Array([
      165, 1, 2, 3, 38, 32, 1, 33, 88, 32, 171, 8, 195, 219, 141, 226, 108, 106, 113, 234, 83, 216,
      147, 85, 132, 185, 16, 78, 73, 167, 74, 232, 103, 153, 13, 71, 49, 224, 25, 12, 109, 167, 34,
      88, 32, 175, 158, 40, 142, 171, 234, 228, 164, 131, 185, 29, 87, 158, 239, 249, 206, 246, 43,
      196, 243, 153, 32, 53, 83, 19, 224, 196, 175, 49, 105, 90, 127,
      // 1 extra byte
      0,
    ])

    const [x, y] = COSEECDHAtoXY(key78Bytes)

    // Should extract the same coordinates as the 77-byte version
    expect(x).toBe('0xab08c3db8de26c6a71ea53d8935584b9104e49a74ae867990d4731e0190c6da7')
    expect(y).toBe('0xaf9e288eabeae4a483b91d579eeff9cef62bc4f39920355313e0c4af31695a7f')
  })

  it('throws error for invalid COSE structure', () => {
    const invalidKey = new Uint8Array([1, 2, 3, 4, 5])

    expect(() => COSEECDHAtoXY(invalidKey)).toThrow()
  })

  it('throws error for COSE key missing X or Y coordinates', () => {
    // Valid CBOR map but missing required fields
    const incompleteKey = new Uint8Array([
      161, // Map with 1 item
      1, // Key: 1
      2, // Value: 2
    ])

    expect(() => COSEECDHAtoXY(incompleteKey)).toThrow('Invalid COSE public key')
  })
})

describe('decodeCBORWithExtensions', () => {
  it('decodes standard CBOR without extensions', () => {
    // Standard 77-byte COSE P-256 public key
    const standardKey = new Uint8Array([
      165, 1, 2, 3, 38, 32, 1, 33, 88, 32, 171, 8, 195, 219, 141, 226, 108, 106, 113, 234, 53, 216,
      147, 85, 132, 185, 16, 78, 73, 167, 74, 232, 103, 153, 13, 71, 49, 224, 25, 12, 109, 167, 34,
      88, 32, 175, 158, 40, 142, 171, 234, 228, 164, 131, 185, 29, 87, 158, 239, 249, 206, 246, 43,
      196, 243, 153, 32, 53, 83, 19, 224, 196, 175, 49, 105, 90, 127,
    ])

    const decoded = decodeCBORWithExtensions<Map<number, ArrayBuffer>>(standardKey)

    expect(decoded instanceof Map).toBe(true)
    expect(decoded.size).toBe(5) // COSE key has 5 fields: kty(1), alg(3), crv(-1), x(-2), y(-3)
    expect(decoded.get(-2)).toBeDefined() // X coordinate
    expect(decoded.get(-3)).toBeDefined() // Y coordinate
  })

  it('decodes CBOR with credProtect extension (production user case)', () => {
    // Real production key from user f20775c9-90b1-4cf9-9a56-c2dfb260cc67
    // 77 bytes COSE key + 14 bytes credProtect extension
    const keyWithCredProtect = new Uint8Array([
      165, 1, 2, 3, 38, 32, 1, 33, 88, 32, 175, 156, 10, 134, 77, 217, 255, 18, 193, 117, 115, 81,
      207, 211, 56, 163, 209, 114, 58, 53, 165, 10, 166, 23, 208, 11, 121, 253, 16, 242, 74, 39, 34,
      88, 32, 204, 37, 178, 31, 50, 223, 114, 22, 160, 11, 39, 18, 56, 213, 15, 168, 37, 68, 38, 80,
      249, 171, 58, 244, 36, 67, 101, 238, 27, 56, 81, 255,
      // credProtect extension (14 bytes): {credProtect: 2}
      161, 107, 99, 114, 101, 100, 80, 114, 111, 116, 101, 99, 116, 2,
    ])

    const decoded = decodeCBORWithExtensions<Map<number, ArrayBuffer>>(keyWithCredProtect)

    // Should successfully decode the main COSE key structure
    expect(decoded instanceof Map).toBe(true)
    expect(decoded.size).toBe(5) // COSE key has 5 fields

    // Verify X coordinate
    const xBuffer = decoded.get(-2)
    expect(xBuffer).toBeDefined()
    if (xBuffer) {
      expect(Buffer.from(xBuffer).toString('hex')).toBe(
        'af9c0a864dd9ff12c1757351cfd338a3d1723a35a50aa617d00b79fd10f24a27'
      )
    }

    // Verify Y coordinate
    const yBuffer = decoded.get(-3)
    expect(yBuffer).toBeDefined()
    if (yBuffer) {
      expect(Buffer.from(yBuffer).toString('hex')).toBe(
        'cc25b21f32df7216a00b271238d50fa825442650f9ab3af4244365ee1b3851ff'
      )
    }
  })

  it('decodes CBOR with 78-byte variation', () => {
    // Some authenticators produce 78-byte keys
    const key78Bytes = new Uint8Array([
      165, 1, 2, 3, 38, 32, 1, 33, 88, 32, 171, 8, 195, 219, 141, 226, 108, 106, 113, 234, 53, 216,
      147, 85, 132, 185, 16, 78, 73, 167, 74, 232, 103, 153, 13, 71, 49, 224, 25, 12, 109, 167, 34,
      88, 32, 175, 158, 40, 142, 171, 234, 228, 164, 131, 185, 29, 87, 158, 239, 249, 206, 246, 43,
      196, 243, 153, 32, 53, 83, 19, 224, 196, 175, 49, 105, 90, 127,
      // 1 extra byte
      0,
    ])

    const decoded = decodeCBORWithExtensions<Map<number, ArrayBuffer>>(key78Bytes)

    expect(decoded instanceof Map).toBe(true)
    expect(decoded.size).toBe(5)
    expect(decoded.get(-2)).toBeDefined()
    expect(decoded.get(-3)).toBeDefined()
  })

  it('decodes another production user key with credProtect (key slot 1)', () => {
    // Real production key from user f20775c9-90b1-4cf9-9a56-c2dfb260cc67, key slot 1
    const keyWithCredProtect = new Uint8Array([
      165, 1, 2, 3, 38, 32, 1, 33, 88, 32, 238, 51, 207, 123, 157, 18, 154, 99, 161, 88, 226, 61,
      255, 121, 35, 179, 252, 235, 38, 139, 118, 149, 132, 67, 35, 137, 181, 91, 158, 209, 172, 156,
      34, 88, 32, 132, 50, 197, 125, 226, 173, 219, 121, 112, 66, 18, 244, 8, 243, 143, 125, 184,
      195, 194, 95, 193, 141, 81, 103, 104, 161, 159, 204, 243, 134, 229, 200,
      // credProtect extension
      161, 107, 99, 114, 101, 100, 80, 114, 111, 116, 101, 99, 116, 2,
    ])

    const decoded = decodeCBORWithExtensions<Map<number, ArrayBuffer>>(keyWithCredProtect)

    expect(decoded instanceof Map).toBe(true)
    expect(decoded.size).toBe(5)

    // Verify X coordinate
    const xBuffer = decoded.get(-2)
    expect(xBuffer).toBeDefined()
    if (xBuffer) {
      expect(Buffer.from(xBuffer).toString('hex')).toBe(
        'ee33cf7b9d129a63a158e23dff7923b3fceb268b769584432389b55b9ed1ac9c'
      )
    }

    // Verify Y coordinate
    const yBuffer = decoded.get(-3)
    expect(yBuffer).toBeDefined()
    if (yBuffer) {
      expect(Buffer.from(yBuffer).toString('hex')).toBe(
        '8432c57de2addb79704212f408f38f7db8c3c25fc18d516768a19fccf386e5c8'
      )
    }
  })

  it('throws error for completely invalid CBOR', () => {
    const invalidData = new Uint8Array([255, 255, 255, 255, 255])

    expect(() => decodeCBORWithExtensions(invalidData)).toThrow()
  })

  it('throws error for CBOR that is too short to be a valid COSE key', () => {
    // Only 10 bytes - too short to be any valid COSE key
    const tooShort = new Uint8Array([165, 1, 2, 3, 38, 32, 1, 33, 88, 32])

    expect(() => decodeCBORWithExtensions(tooShort)).toThrow()
  })

  it('handles CBOR with large extension data', () => {
    // Standard 77-byte key + larger extension (20 bytes)
    const keyWithLargeExtension = new Uint8Array([
      165, 1, 2, 3, 38, 32, 1, 33, 88, 32, 175, 156, 10, 134, 77, 217, 255, 18, 193, 117, 115, 81,
      207, 211, 56, 163, 209, 114, 58, 53, 165, 10, 166, 23, 208, 11, 121, 253, 16, 242, 74, 39, 34,
      88, 32, 204, 37, 178, 31, 50, 223, 114, 22, 160, 11, 39, 18, 56, 213, 15, 168, 37, 68, 38, 80,
      249, 171, 58, 244, 36, 67, 101, 238, 27, 56, 81, 255,
      // Larger extension data (20 bytes)
      161, 107, 99, 114, 101, 100, 80, 114, 111, 116, 101, 99, 116, 2, 1, 2, 3, 4, 5, 6,
    ])

    const decoded = decodeCBORWithExtensions<Map<number, ArrayBuffer>>(keyWithLargeExtension)

    // Should successfully decode despite larger extension
    expect(decoded instanceof Map).toBe(true)
    expect(decoded.size).toBe(5)
    expect(decoded.get(-2)).toBeDefined()
    expect(decoded.get(-3)).toBeDefined()
  })
})
