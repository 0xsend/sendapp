import { describe, expect, it } from '@jest/globals'
import { decimalStrToBigInt } from './bigint'

describe('bigint', () => {
  it('should parse a bigint from a string', () => {
    expect(decimalStrToBigInt.parse('1234567890')).toEqual(BigInt('1234567890'))
    expect(decimalStrToBigInt.parse('01234567890')).toEqual(BigInt('1234567890'))
    expect(decimalStrToBigInt.parse('-1234567890')).toEqual(BigInt('-1234567890'))
    expect(decimalStrToBigInt.parse('0x1234567890')).toEqual(BigInt('0x1234567890'))
  })
  it('should return an error for an invalid string', () => {
    const cases = ['1234567890.1234567890']
    for (const input of cases) {
      const result = decimalStrToBigInt.safeParse(input)
      if (result.success) {
        console.log('success', result)
      }
      expect(result.success).toBe(false)
    }
  })
})
