import { describe, it, expect } from 'vitest'
import { calculatePercentileFromRank } from './rewards-breakdown'

describe('calculatePercentileFromRank', () => {
  it('should return 0 for rank 0 out of 100 users (lowest)', () => {
    expect(calculatePercentileFromRank(0, 100)).toBe(0)
  })

  it('should return 100 for rank 99 out of 100 users (highest)', () => {
    expect(calculatePercentileFromRank(99, 100)).toBe(100)
  })

  it('should return 50 for rank 50 out of 101 users (middle)', () => {
    expect(calculatePercentileFromRank(50, 101)).toBe(50)
  })

  it('should return 50 for single user (edge case)', () => {
    expect(calculatePercentileFromRank(0, 1)).toBe(50)
  })

  it('should return 50 for zero totalCount (edge case)', () => {
    expect(calculatePercentileFromRank(0, 0)).toBe(50)
  })

  it('should handle rank 1 out of 2 users correctly', () => {
    // (1 / (2-1)) * 100 = 100
    expect(calculatePercentileFromRank(1, 2)).toBe(100)
  })

  it('should handle rank 0 out of 2 users correctly', () => {
    // (0 / (2-1)) * 100 = 0
    expect(calculatePercentileFromRank(0, 2)).toBe(0)
  })

  it('should calculate correct percentile for rank 25 out of 100', () => {
    // (25 / 99) * 100 ≈ 25.25
    const result = calculatePercentileFromRank(25, 100)
    expect(result).toBeCloseTo(25.25, 2)
  })

  it('should calculate correct percentile for rank 75 out of 100', () => {
    // (75 / 99) * 100 ≈ 75.76
    const result = calculatePercentileFromRank(75, 100)
    expect(result).toBeCloseTo(75.76, 2)
  })

  it('should handle large totalCount values', () => {
    // (5000 / 9999) * 100 = 50.005
    const result = calculatePercentileFromRank(5000, 10000)
    expect(result).toBeCloseTo(50.005, 2)
  })

  it('should return value between 0 and 100', () => {
    const result = calculatePercentileFromRank(42, 100)
    expect(result).toBeGreaterThanOrEqual(0)
    expect(result).toBeLessThanOrEqual(100)
  })

  it('should match formula from migration comment: (rank / (totalCount - 1)) * 100', () => {
    const rank = 10
    const totalCount = 50
    const expected = (rank / (totalCount - 1)) * 100
    expect(calculatePercentileFromRank(rank, totalCount)).toBe(expected)
  })
})
