import { describe, it } from '@jest/globals'
import { pgBase16ToBytes } from './pgBase16ToBytes'

describe('test pgBase16ToBytes', () => {
  it('test pgBase16ToBytes', () => {
    expect(pgBase16ToBytes('\\x01020304')).toBeInstanceOf(Uint8Array)
    expect(pgBase16ToBytes('\\x01020304').toString()).toEqual([1, 2, 3, 4].toString())
    expect(pgBase16ToBytes('\\x00112233445566778899AABBCCDDEEFF').toString()).toEqual(
      [0, 17, 34, 51, 68, 85, 102, 119, 136, 153, 170, 187, 204, 221, 238, 255].toString()
    )
    expect(pgBase16ToBytes('\\xabcdef').toString()).toEqual([171, 205, 239].toString()) // handles lowercase
    expect(pgBase16ToBytes('\\x').toString()).toEqual('')

    // @ts-expect-error Testing with null or empty string
    expect(() => pgBase16ToBytes('')).toThrow('Hex string must start with \\x')
  })
})
