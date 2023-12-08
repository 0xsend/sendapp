import { describe, it } from '@jest/globals'
import { base64 } from '@scure/base'
import { bytesToHex } from 'viem'
import { parseAndNormalizeSig, parseAuthDataFromAttestationObject } from './passkeys'
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
      'o2NmbXRkbm9uZWdhdHRTdG10oGhhdXRoRGF0YViUVVJTlMb5JhbV7rFoaFKDcCvBmzc1HOD7tW1Q7aed139dAAAAALraVWanqkAfvZZFYZpVEg0AELrCIUXbFEmBuRuNcWACmbylAQIDJiABIVggyaWUrCX3btzZi3qE0axKQNbuazi4Lc7S146OjuD97IQiWCAm+K/wA2sPR57JgLIkd/PZDoVRz9RTCxoXESdVwZiHnA==',
  },
]

const mockAssertions: SignResult[] = [
  {
    passkeyName: 'sendappuser',
    rawClientDataJSONB64:
      'eyJ0eXBlIjoid2ViYXV0aG4uZ2V0IiwiY2hhbGxlbmdlIjoiWVc1dmRHaGxjaUJqYUdGc2JHVnVaMlUiLCJvcmlnaW4iOiJodHRwczovL3NlbmRhcHAubG9jYWxob3N0In0=',
    rawAuthenticatorDataB64: 'VVJTlMb5JhbV7rFoaFKDcCvBmzc1HOD7tW1Q7aed138dAAAAAA==',
    signatureB64:
      'MEUCIQDGxzi+evYGTKpT9kiQBlMp/VELbG0nKBhtNYeT4U4X9wIgZtQBydPYhD9QzRr56OF5ZnGlPiN6a0L63lgF98fM3sY=',
  },
]

describe('parseAttestationObject', () => {
  it('can parse attestation objects', () => {
    for (const attestation of mockAttestations) {
      const parsed = parseAuthDataFromAttestationObject(
        base64.decode(attestation.rawAttestationObjectB64)
      )
      expect(parsed).toBeTruthy()
    }
  })
})

describe('parseAndNormalizeSig', () => {
  // TODO: can parse attestation signatures

  it('can parse attestation signatures', () => {
    for (const attestation of mockAttestations) {
      const sig = parseAndNormalizeSig(base64.decode(attestation.signatureB64))
      const rHex = sig.r.toString(16)
      const sHex = sig.s.toString(16)
      const expected = {
        r: '9e0ec64e75d6687d07a8060db040ac6bc2419b20c4e6b70ea8ac7737a93ebec5',
        s: '13455f7d82c915b55eb76eb10f637387a38a3d6ed9536dd045ce0d70ca2998af',
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

  it('can parse assertion signatures', () => {
    for (const assertion of mockAssertions) {
      const sig = parseAndNormalizeSig(bytesToHex(base64.decode(assertion.signatureB64)))
      const rHex = sig.r.toString(16)
      const sHex = sig.s.toString(16)
      const expected = {
        r: 'c6c738be7af6064caa53f64890065329fd510b6c6d2728186d358793e14e17f7',
        s: '66d401c9d3d8843f50cd1af9e8e1796671a53e237a6b42fade5805f7c7ccdec6',
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
