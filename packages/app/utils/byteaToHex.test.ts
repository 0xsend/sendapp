import { describe, it } from '@jest/globals'
import { byteaToHex } from './byteaToHex'

describe('test byteaToHex', () => {
  it('test byteaToHex', () => {
    // Testing with default parameters
    expect(byteaToHex('\\x01020304')).toBe('0x01020304')

    // Testing edge cases
    expect(byteaToHex('\\x00')).toBe('0x00') // empty string
    expect(byteaToHex('\\x')).toBe('0x') // empty string
    expect(byteaToHex('\\x01')).toBe('0x01') // single character
    expect(byteaToHex('\\x0102')).toBe('0x0102') // two characters
    expect(byteaToHex('\\x010203')).toBe('0x010203') // three characters
    expect(byteaToHex('\\x0102030405')).toBe('0x0102030405') // four characters
    expect(byteaToHex('\\x010203040506')).toBe('0x010203040506') // five characters
    expect(byteaToHex('\\x01020304050607')).toBe('0x01020304050607') // six characters
    expect(byteaToHex('\\x0102030405060708')).toBe('0x0102030405060708') // seven characters
    expect(byteaToHex('\\x010203040506070809')).toBe('0x010203040506070809') // eight characters
    expect(byteaToHex('\\x0102030405060708090a')).toBe('0x0102030405060708090a') // nine characters
    expect(byteaToHex('\\x0102030405060708090a0b0c')).toBe('0x0102030405060708090a0b0c') // ten characters

    // @ts-expect-error Testing with null or empty string
    expect(() => byteaToHex('')).toThrow('Hex string must start with \\x')
    // @ts-expect-error Testing with null or empty string
    expect(() => byteaToHex(undefined)).toThrow('Hex string must start with \\x')
    // @ts-expect-error Testing with null or empty string
    expect(() => byteaToHex(null)).toThrow('Hex string must start with \\x')
  })
})
