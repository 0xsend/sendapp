import { describe, expect, it } from '@jest/globals'

import { byteaToBase64 } from './byteaToBase64'

describe('test byteaToBase64', () => {
  it('test byteaToBase64', () => {
    expect(byteaToBase64('\\x')).toBe('') // empty string
    expect(byteaToBase64('\\x1234')).toBe('EjQ=') // single character
    expect(byteaToBase64('\\x12345678')).toBe('EjRWeA==') // two characters
    expect(byteaToBase64('\\x1234567890')).toBe('EjRWeJA=') // three characters
  })
  it('fails on invalid input', () => {
    // @ts-expect-error Testing with null or empty string
    expect(() => byteaToBase64('invalid-string')).toThrow('Hex string must start with \\x')
    // @ts-expect-error Testing with null or empty string
    expect(() => byteaToBase64('0x12345678901234567890123456789012345678901234')).toThrow(
      'Hex string must start with \\x'
    )
  })
})
