import { describe, it, expect } from '@jest/globals'
import { formatCoinAmount } from './formatCoinAmount'
import { usdcCoin, ethCoin, sendCoin, spx6900Coin } from '../data/coins'

describe('formatCoinAmount', () => {
  it('should format USDC amounts correctly (6 decimals)', () => {
    const amount = BigInt(1000000) // 1 USDC
    expect(formatCoinAmount({ amount, coin: usdcCoin })).toBe('1')

    const smallAmount = BigInt(100) // 0.0001 USDC
    expect(formatCoinAmount({ amount: smallAmount, coin: usdcCoin })).toBe('>0.0')

    const largeAmount = BigInt(1234567890) // 1,234.567890 USDC
    expect(formatCoinAmount({ amount: largeAmount, coin: usdcCoin })).toBe('1,234.56')
  })

  it('should format ETH amounts correctly (18 decimals)', () => {
    const amount = BigInt('1000000000000000000') // 1 ETH
    expect(formatCoinAmount({ amount, coin: ethCoin })).toBe('1')

    const smallAmount = BigInt('100000000000000') // 0.0001 ETH
    expect(formatCoinAmount({ amount: smallAmount, coin: ethCoin })).toBe('0.0001')

    const largeAmount = BigInt('1234567890000000000000') // 1,234.56789 ETH
    expect(formatCoinAmount({ amount: largeAmount, coin: ethCoin })).toBe('1,234.56789')
  })

  it('should format SEND amounts correctly (18 decimals, 0 format decimals)', () => {
    const amount = BigInt('1000000000000000000') // 1 SEND
    expect(formatCoinAmount({ amount, coin: sendCoin })).toBe('1')

    const largeAmount = BigInt('1234567890000000000000') // 1,234.5679 SEND
    expect(formatCoinAmount({ amount: largeAmount, coin: sendCoin })).toBe('1,234')
  })

  it('should format SPX amounts correctly (8 decimals)', () => {
    const amount = BigInt(100000000) // 1 SPX
    expect(formatCoinAmount({ amount, coin: spx6900Coin })).toBe('1')

    const smallAmount = BigInt(10000) // 0.0001 SPX
    expect(formatCoinAmount({ amount: smallAmount, coin: spx6900Coin })).toBe('>0.0')
  })

  it('should handle zero amounts', () => {
    const amount = BigInt(0)
    expect(formatCoinAmount({ amount, coin: usdcCoin })).toBe('0')
    expect(formatCoinAmount({ amount, coin: ethCoin })).toBe('0')
    expect(formatCoinAmount({ amount, coin: sendCoin })).toBe('0')
  })
})
