import { describe, expect, it } from '@jest/globals'

import { byteaToBase64URLNoPad } from './byteaToBase64URLNoPad'

describe('test byteaToBase64URLNoPad', () => {
  it('test byteaToBase64URLNoPad', () => {
    expect(byteaToBase64URLNoPad('\\x')).toBe('') // empty string
    expect(byteaToBase64URLNoPad('\\x1234')).toBe('EjQ') // single character
    expect(byteaToBase64URLNoPad('\\x12345678')).toBe('EjRWeA') // two characters
    expect(byteaToBase64URLNoPad('\\x1234567890')).toBe('EjRWeJA') // three characters
  })
  it('fails on invalid input', () => {
    // @ts-expect-error Testing with null or empty string
    expect(() => byteaToBase64URLNoPad('invalid-string')).toThrow('Hex string must start with \\x')
    // @ts-expect-error Testing with null or empty string
    expect(() => byteaToBase64URLNoPad('0x12345678901234567890123456789012345678901234')).toThrow(
      'Hex string must start with \\x'
    )
  })
})
