import { describe, it, expect } from '@jest/globals'
import { convertAmountToUSD } from 'app/utils/convertAmountToUSD'

describe('convertAmountToUSD', () => {
  it('converts amount correctly with default decimals and price', () => {
    const result = convertAmountToUSD(BigInt(1000))
    expect(result).toBe(0) // tokenPrice is 0 by default
  })

  it('converts amount correctly with decimals and token price', () => {
    const amount = BigInt(1000000) // 1 token with 6 decimals
    const decimals = 6
    const tokenPrice = 2 // USD
    const result = convertAmountToUSD(amount, decimals, tokenPrice)
    expect(result).toBeCloseTo(2)
  })

  it('returns 0 if amount is 0', () => {
    const result = convertAmountToUSD(BigInt(0), 18, 300)
    expect(result).toBe(0)
  })

  it('handles large values correctly', () => {
    const amount = BigInt('1000000000000000000') // 1 token with 18 decimals
    const result = convertAmountToUSD(amount, 18, 1500)
    expect(result).toBeCloseTo(1500)
  })

  it('handles non-zero amount with zero token price', () => {
    const amount = BigInt('500000000')
    const result = convertAmountToUSD(amount, 8, 0)
    expect(result).toBe(0)
  })

  it('handles decimals of 0', () => {
    const amount = BigInt(5)
    const result = convertAmountToUSD(amount, 0, 2)
    expect(result).toBe(10)
  })
})
