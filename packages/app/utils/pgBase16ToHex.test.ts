import { describe, it } from '@jest/globals'
import { pgBase16ToHex } from './pgBase16ToHex'

describe('test pgBase16ToHex', () => {
  it('test pgBase16ToHex', () => {
    // Testing with default parameters
    expect(pgBase16ToHex('\\x01020304')).toBe('0x01020304')

    // Testing edge cases
    expect(pgBase16ToHex('\\x00')).toBe('0x00') // empty string
    expect(pgBase16ToHex('\\x')).toBe('0x') // empty string
    expect(pgBase16ToHex('\\x01')).toBe('0x01') // single character
    expect(pgBase16ToHex('\\x0102')).toBe('0x0102') // two characters
    expect(pgBase16ToHex('\\x010203')).toBe('0x010203') // three characters
    expect(pgBase16ToHex('\\x0102030405')).toBe('0x0102030405') // four characters
    expect(pgBase16ToHex('\\x010203040506')).toBe('0x010203040506') // five characters
    expect(pgBase16ToHex('\\x01020304050607')).toBe('0x01020304050607') // six characters
    expect(pgBase16ToHex('\\x0102030405060708')).toBe('0x0102030405060708') // seven characters
    expect(pgBase16ToHex('\\x010203040506070809')).toBe('0x010203040506070809') // eight characters
    expect(pgBase16ToHex('\\x0102030405060708090a')).toBe('0x0102030405060708090a') // nine characters
    expect(pgBase16ToHex('\\x0102030405060708090a0b0c')).toBe('0x0102030405060708090a0b0c') // ten characters

    // @ts-expect-error Testing with null or empty string
    expect(() => pgBase16ToHex('')).toThrow('Hex string must start with \\x')
  })
})
