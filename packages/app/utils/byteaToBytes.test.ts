import { describe, it } from '@jest/globals'
import { byteaToBytes } from './byteaToBytes'

describe('test byteaToBytes', () => {
  it('test byteaToBytes', () => {
    expect(byteaToBytes('\\x01020304')).toBeInstanceOf(Uint8Array)
    expect(byteaToBytes('\\x01020304').toString()).toEqual([1, 2, 3, 4].toString())
    expect(byteaToBytes('\\x00112233445566778899AABBCCDDEEFF').toString()).toEqual(
      [0, 17, 34, 51, 68, 85, 102, 119, 136, 153, 170, 187, 204, 221, 238, 255].toString()
    )
    expect(byteaToBytes('\\xabcdef').toString()).toEqual([171, 205, 239].toString()) // handles lowercase
    expect(byteaToBytes('\\x').toString()).toEqual('')

    // @ts-expect-error Testing with null or empty string
    expect(() => byteaToBytes('')).toThrow('Hex string must start with \\x')
  })
})
