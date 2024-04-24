import { describe, it } from '@jest/globals'
import { hexToPgBase16 } from './hexToPgBase16'

describe('test hexToPgBase16', () => {
  it('test hexToPgBase16', () => {
    // Testing edge cases
    expect(hexToPgBase16('0x')).toBe('\\x') // empty string
    expect(hexToPgBase16('0x12')).toBe('\\x12') // single character
    expect(hexToPgBase16('0x123')).toBe('\\x123') // two characters
    expect(hexToPgBase16('0x1234')).toBe('\\x1234') // three characters
    expect(hexToPgBase16('0x12345')).toBe('\\x12345') // four characters
    expect(hexToPgBase16('0x123456')).toBe('\\x123456') // five characters
    expect(hexToPgBase16('0x1234567')).toBe('\\x1234567') // six characters
    expect(hexToPgBase16('0x12345678')).toBe('\\x12345678') // seven characters
    expect(hexToPgBase16('0x123456789')).toBe('\\x123456789') // eight characters
    expect(hexToPgBase16('0x1234567890')).toBe('\\x1234567890') // nine characters

    // @ts-expect-error Testing with null or empty string
    expect(() => hexToPgBase16('')).toThrow('Hex string must start with 0x')
  })
})
