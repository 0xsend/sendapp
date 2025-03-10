import { describe, expect, it } from '@jest/globals'

import formatAmount, { sanitizeAmount } from './formatAmount' // Adjust the import path
import { parseUnits } from 'viem'

describe('abbreviateNumber', () => {
  it('should handle negatives', () => {
    expect(formatAmount(-1000)).toBe('-1K')
  })

  it('should return numbers less than 1000 without suffix', () => {
    expect(formatAmount(999)).toBe('999')
  })

  it('should handle default symbols', () => {
    expect(formatAmount(1000)).toBe('1,000')
    expect(formatAmount(1_000_000)).toBe('1M')
  })

  it('should handle non-padding', () => {
    expect(formatAmount(1_234_567, 4, 1)).toBe('1.2M')
  })

  it('should throw an error for unknown tier', () => {
    const bigNumber = 1e27 // Beyond the default symbols provided
    expect(() => formatAmount(bigNumber)).toThrow(RangeError)
  })

  it('should handle digit parameter', () => {
    expect(formatAmount(1_234)).toBe('1,234') // default digit is 1
  })
  it('should handle zero', () => {
    expect(formatAmount(0)).toBe('0.00') // defaults to 2 max decimals
  })
})

describe('formatAmount', () => {
  it('should handle string inputs', () => {
    expect(formatAmount('1,234.56')).toBe('1,234.56')
  })

  it('should handle undefined input', () => {
    expect(formatAmount(undefined)).toBe('')
  })

  it('should remove commas from string input', () => {
    expect(formatAmount('1,234,567.89')).toBe('1.23M')
  })

  it('should return 0 for NaN inputs', () => {
    expect(formatAmount('NaN')).toBe('0')
  })

  it('should abbreviate for large integers', () => {
    expect(formatAmount(12_345, 4)).toBe('12.34K')
  })

  it('should format to locale string', () => {
    expect(formatAmount(123.4567, 4, 2)).toBe('123.45')
  })

  it('should not round string numbers', () => {
    expect(formatAmount('1000000000')).toBe('1B')
    expect(formatAmount('10936149')).toBe('10.93M')
  })
})

describe('maxIntegers handling', () => {
  it('should not abbreviate if length is equal to maxIntegers', () => {
    expect(formatAmount(9999, 4)).toBe('9,999') // exactly 4 integers
  })

  it('should abbreviate if length exceeds maxIntegers', () => {
    expect(formatAmount(10_000, 4)).toBe('10K') // 5 integers, 1 more than maxIntegers
  })
})
describe('maxDecimals handling', () => {
  it('should truncate decimals that exceed maxDecimals', () => {
    expect(formatAmount(123.45678, 5, 2)).toBe('123.45') // input has 5 decimals, but only 2 are expected in output
  })

  it('should format to maxDecimals even if input has fewer decimals', () => {
    expect(formatAmount(123.4, 5, 2)).toBe('123.40') // input has 1 decimal, but 2 are expected in output
  })
})
describe('Additional scenarios', () => {
  it('should handle larger numbers with given maxIntegers and maxDecimals', () => {
    expect(formatAmount(12_345_678.9, 4, 2)).toBe('12.34M')
  })

  it('should handle zero', () => {
    expect(formatAmount(0)).toBe('0.00') // defaults to 2 max decimals
  })

  it('should not truncate if decimals match maxDecimals', () => {
    expect(formatAmount(123.45, 5, 2)).toBe('123.45')
  })

  it('should handle if num is less than maxDecimals', () => {
    expect(formatAmount(0.0045, 5, 1)).toBe('>0.0')
  })

  it('should handle when num is less than default maxDecimals', () => {
    expect(formatAmount(0.0045)).toBe('>0.00')
  })

  it('should handle when num is greater than and has no decimals', () => {
    expect(formatAmount(123)).toBe('123')
  })

  it('should not show less than when number has integers', () => {
    expect(formatAmount(5313.01, 4, 0)).toBe('5,313')
  })
})

describe('sanitizeAmount', () => {
  it('should return null when amount is undefined', () => {
    expect(sanitizeAmount(undefined)).toBeNull()
  })

  it('should return null when amount is empty string', () => {
    expect(sanitizeAmount('')).toBeNull()
  })

  it('should remove non-numeric characters except decimal point', () => {
    expect(sanitizeAmount('abc123.45xyz')).toEqual(parseUnits('123.45', 18))
  })

  it('should handle multiple decimal points by keeping only the first one', () => {
    expect(sanitizeAmount('123.45.67')).toEqual(parseUnits('123.4567', 18))
  })

  it('should work with custom decimal places', () => {
    expect(sanitizeAmount('123.45', 6)).toEqual(parseUnits('123.45', 6))
  })

  it('should handle zero amount', () => {
    expect(sanitizeAmount('0')).toEqual(parseUnits('0', 18))
  })

  it('should handle amount with only decimal point', () => {
    expect(sanitizeAmount('.')).toEqual(parseUnits('0', 18))
  })

  it('should handle amount with leading decimal point', () => {
    expect(sanitizeAmount('.123')).toEqual(parseUnits('0.123', 18))
  })

  it('should handle amount with trailing decimal point', () => {
    expect(sanitizeAmount('123.')).toEqual(parseUnits('123.0', 18))
  })

  it('should handle very large numbers', () => {
    expect(sanitizeAmount('999999999999.999999999999')).toEqual(
      parseUnits('999999999999.999999999999', 18)
    )
  })
})
