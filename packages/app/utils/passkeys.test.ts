import type {
  AuthenticationResponseJSON,
  RegistrationResponseJSON,
} from '@0xbigboss/react-native-passkeys/build/ReactNativePasskeys.types'
import { describe, expect, it } from '@jest/globals'
import { p256 } from '@noble/curves/p256'
import { base64, base64urlnopad } from '@scure/base'
import crypto from 'node:crypto'
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
