import { describe, it } from '@jest/globals'
import { base64 } from '@scure/base'
import { bytesToHex } from 'viem'
import { parseAndNormalizeSig, parseCreateResponse, parseSignResponse } from './passkeys'
import { CreateResult, SignResult } from '@daimo/expo-passkeys'

const mockAttestations: CreateResult[] = [
  // {
  //   // first bytes are the ASN.1 header (3059301306072a8648ce3d020106082a8648ce3d03010703420004)
  //   // last bytes are the x and y coordinates of the public key
  //   // public key '3059301306072a8648ce3d020106082a8648ce3d030107034200049e0ec64e75d6687d07a8060db040ac6bc2419b20c4e6b70ea8ac7737a93ebec513455f7d82c915b55eb76eb10f637387a38a3d6ed9536dd045ce0d70ca2998af'
  //   rawClientDataJSONB64:
  //     'eyJ0eXBlIjoid2ViYXV0aG4uY3JlYXRlIiwiY2hhbGxlbmdlIjoiYzI5dFpTQmphR0ZzYkdWdVoyVSIsIm9yaWdpbiI6Imh0dHBzOi8vc2VuZGFwcC5sb2NhbGhvc3QifQ==',
  //   rawAttestationObjectB64:
  //     'o2NmbXRkbm9uZWdhdHRTdG10oGhhdXRoRGF0YViUVVJTlMb5JhbV7rFoaFKDcCvBmzc1HOD7tW1Q7aed139dAAAAALraVWanqkAfvZZFYZpVEg0AEBH8VIF2M9LFEWC+4zQYvOOlAQIDJiABIVggng7GTnXWaH0HqAYNsECsa8JBmyDE5rcOqKx3N6k+vsUiWCATRV99gskVtV63brEPY3OHo4o9btlTbdBFzg1wyimYrw==',
  // },
  {
    rawClientDataJSONB64:
      'eyJ0eXBlIjoid2ViYXV0aG4uY3JlYXRlIiwiY2hhbGxlbmdlIjoiYzI5dFpTQmphR0ZzYkdWdVoyVSIsIm9yaWdpbiI6Imh0dHBzOi8vc2VuZGFwcC5sb2NhbGhvc3QifQ==',
    rawAttestationObjectB64:
      'o2NmbXRkbm9uZWdhdHRTdG10oGhhdXRoRGF0YViUVVJTlMb5JhbV7rFoaFKDcCvBmzc1HOD7tW1Q7aed139dAAAAALraVWanqkAfvZZFYZpVEg0AECiF0g45fqmWxdVxz4i5f4ulAQIDJiABIVggfpK6HX0EGYMbV8afoFaCZkUcfQ+dw9YE0jSNRcAC0zYiWCAdWvSb1BQUVM3/dW/urTzaX80vFmZ95ClXofI1uTn4Gg==',
  },
]

const mockAssertions: SignResult[] = [
  {
    passkeyName: 'sendappuser.1',
    rawClientDataJSONB64:
      'eyJ0eXBlIjoid2ViYXV0aG4uZ2V0IiwiY2hhbGxlbmdlIjoiWVc1dmRHaGxjaUJqYUdGc2JHVnVaMlUiLCJvcmlnaW4iOiJodHRwczovL3NlbmRhcHAubG9jYWxob3N0In0=',
    rawAuthenticatorDataB64: 'VVJTlMb5JhbV7rFoaFKDcCvBmzc1HOD7tW1Q7aed138dAAAAAA==',
    signatureB64:
      'MEUCIQCCCGm2bgxhiUzzL6C/U1HnRIa5ws2YPGSFaFRzBjzuLQIgKiSj8bFo/Nhv0vTgPag1OPKE9rN+uQsFpCpxO5k1AHc=',
  },
]

describe('parseCreateResponse', () => {
  it('can parse attestation objects', () => {
    for (const attestation of mockAttestations) {
      const parsed = parseCreateResponse(attestation)
      const expected =
        '0x3059301306072a8648ce3d020106082a8648ce3d030107034200047e92ba1d7d0419831b57c69fa0568266451c7d0f9dc3d604d2348d45c002d3361d5af49bd4141454cdff756feead3cda5fcd2f16667de42957a1f235b939f81a'
      expect(parsed).toStrictEqual(expected)
    }
  })
})

describe('parseSignResponse', () => {
  it('can parse assertion objects', () => {
    for (const assertion of mockAssertions) {
      const parsed = parseSignResponse(assertion)
      const expected = {
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
      }
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
    for (const assertion of mockAssertions) {
      const sig = parseAndNormalizeSig(bytesToHex(base64.decode(assertion.signatureB64)))
      const rHex = sig.r.toString(16)
      const sHex = sig.s.toString(16)
      const expected = {
        r: '820869b66e0c61894cf32fa0bf5351e74486b9c2cd983c6485685473063cee2d',
        s: '2a24a3f1b168fcd86fd2f4e03da83538f284f6b37eb90b05a42a713b99350077',
      }
      // console.log('sig', {
      //   r: sig.r.toString(16),
      //   s: sig.s.toString(16),
      // })
      // console.log('expected', expected)
      expect({
        r: rHex,
        s: sHex,
      }).toStrictEqual(expected)
    }
  })
})
