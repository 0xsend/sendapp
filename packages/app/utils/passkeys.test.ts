import { describe, it } from '@jest/globals'
import { base64 } from '@scure/base'
import { bytesToHex } from 'viem'
import { parseAndNormalizeSig, parseCreateResponse, parseSignResponse } from './passkeys'
import { CreateResult, SignResult } from '@daimo/expo-passkeys'
import { p256 } from '@noble/curves/p256'

const mockAttestations: [CreateResult, string][] = [
  [
    {
      rawClientDataJSONB64:
        'eyJ0eXBlIjoid2ViYXV0aG4uY3JlYXRlIiwiY2hhbGxlbmdlIjoiYzI5dFpTQmphR0ZzYkdWdVoyVSIsIm9yaWdpbiI6Imh0dHBzOi8vc2VuZGFwcC5sb2NhbGhvc3QifQ==',
      rawAttestationObjectB64:
        'o2NmbXRkbm9uZWdhdHRTdG10oGhhdXRoRGF0YViUVVJTlMb5JhbV7rFoaFKDcCvBmzc1HOD7tW1Q7aed139dAAAAALraVWanqkAfvZZFYZpVEg0AECiF0g45fqmWxdVxz4i5f4ulAQIDJiABIVggfpK6HX0EGYMbV8afoFaCZkUcfQ+dw9YE0jSNRcAC0zYiWCAdWvSb1BQUVM3/dW/urTzaX80vFmZ95ClXofI1uTn4Gg==',
    },
    '0x3059301306072a8648ce3d020106082a8648ce3d030107034200047e92ba1d7d0419831b57c69fa0568266451c7d0f9dc3d604d2348d45c002d3361d5af49bd4141454cdff756feead3cda5fcd2f16667de42957a1f235b939f81a',
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

describe('parseCreateResponse', () => {
  it('can parse attestation objects', () => {
    for (const [attestation, expected] of mockAttestations) {
      const parsed = parseCreateResponse(attestation)
      expect(parsed).toStrictEqual(expected)
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
})
