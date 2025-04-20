import { describe, it, expect } from '@jest/globals'
import { hexToBytea } from './hexToBytea'

describe('test hexToBytea', () => {
  it('test hexToBytea', () => {
    // Testing edge cases
    expect(hexToBytea('0x')).toBe('\\x') // empty string
    expect(hexToBytea('0x12')).toBe('\\x12') // single character
    expect(hexToBytea('0x123')).toBe('\\x123') // two characters
    expect(hexToBytea('0x1234')).toBe('\\x1234') // three characters
    expect(hexToBytea('0x12345')).toBe('\\x12345') // four characters
    expect(hexToBytea('0x123456')).toBe('\\x123456') // five characters
    expect(hexToBytea('0x1234567')).toBe('\\x1234567') // six characters
    expect(hexToBytea('0x12345678')).toBe('\\x12345678') // seven characters
    expect(hexToBytea('0x123456789')).toBe('\\x123456789') // eight characters
    expect(hexToBytea('0x1234567890')).toBe('\\x1234567890') // nine characters

    // @ts-expect-error Testing with null or empty string
    expect(() => hexToBytea('')).toThrow('Hex string must start with 0x')
  })
})
