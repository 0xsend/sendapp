import { describe, test, expect } from '@jest/globals'
import { asciiToByteArray } from './asciiToByteArray'

describe('asciiToByteArray', () => {
  test('should convert empty string to empty Uint8Array', () => {
    const result = asciiToByteArray('')
    expect(result).toBeInstanceOf(Uint8Array)
    expect(result.length).toBe(0)
  })

  test('should convert ASCII string to Uint8Array with correct character codes', () => {
    const str = 'Hello'
    const result = asciiToByteArray(str)

    expect(result).toBeInstanceOf(Uint8Array)
    expect(result.length).toBe(str.length)
    expect(result[0]).toBe('H'.charCodeAt(0))
    expect(result[1]).toBe('e'.charCodeAt(0))
    expect(result[2]).toBe('l'.charCodeAt(0))
    expect(result[3]).toBe('l'.charCodeAt(0))
    expect(result[4]).toBe('o'.charCodeAt(0))
  })

  test('should handle special characters correctly', () => {
    const str = 'Hello!@#$%^&*()'
    const result = asciiToByteArray(str)

    expect(result).toBeInstanceOf(Uint8Array)
    expect(result.length).toBe(str.length)

    for (let i = 0; i < str.length; i++) {
      expect(result[i]).toBe(str.charCodeAt(i))
    }
  })

  test('should handle userHandle with uuid.keyslot format', () => {
    const str = `${crypto.randomUUID()}.${3}`
    const result = asciiToByteArray(str)

    expect(result).toBeInstanceOf(Uint8Array)
    expect(result.length).toBe(str.length)

    // should match nodejs implementation
    const expected = Buffer.from(str, 'utf-8')

    for (let i = 0; i < str.length; i++) {
      expect(result[i]).toBe(expected[i])
    }
  })

  test('should throw an error for characters with code points > 255', () => {
    const str = 'こんにちは' // Japanese characters have code points > 255

    expect(() => {
      asciiToByteArray(str)
    }).toThrow(/exceeds the valid range/)
  })

  test('should throw an error for emoji characters', () => {
    const str = '👋🌍' // Wave and world emoji

    expect(() => {
      asciiToByteArray(str)
    }).toThrow(/exceeds the valid range/)
  })

  test('should throw an error for strings with mixed ASCII and non-ASCII characters', () => {
    const str = 'Hello 世界' // "Hello world" with English and Japanese

    expect(() => {
      asciiToByteArray(str)
    }).toThrow(/exceeds the valid range/)
  })

  test('should handle alphanumeric strings correctly', () => {
    const str = 'abc123XYZ'
    const result = asciiToByteArray(str)

    expect(result).toBeInstanceOf(Uint8Array)
    expect(result.length).toBe(str.length)

    // Verify each character code individually
    const expected = new Uint8Array([
      97,
      98,
      99, // a, b, c
      49,
      50,
      51, // 1, 2, 3
      88,
      89,
      90, // X, Y, Z
    ])

    for (let i = 0; i < str.length; i++) {
      expect(result[i]).toBe(expected[i])
    }
  })

  test('should handle very long strings', () => {
    const str = 'a'.repeat(1000)
    const result = asciiToByteArray(str)

    expect(result).toBeInstanceOf(Uint8Array)
    expect(result.length).toBe(1000)

    for (let i = 0; i < str.length; i++) {
      expect(result[i]).toBe('a'.charCodeAt(0))
    }
  })
})
