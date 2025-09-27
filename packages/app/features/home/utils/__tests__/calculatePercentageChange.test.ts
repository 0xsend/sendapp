import { describe, expect, it } from '@jest/globals'
import { calculatePercentageChange } from '../calculatePercentageChange'

describe('calculatePercentageChange', () => {
  it('should return 0 when percentageChange is null', () => {
    expect(calculatePercentageChange(100, null)).toBe(0)
  })

  it('should return 0 when currentValue is 0', () => {
    expect(calculatePercentageChange(0, 50)).toBe(0)
  })

  it('should calculate correct change for positive percentage', () => {
    // Previous value: 100 / (1 + 50/100) = 100 / 1.5 = 66.67
    // Change: 100 - 66.67 = 33.33
    expect(calculatePercentageChange(100, 50)).toBeCloseTo(33.33, 2)
  })

  it('should calculate correct change for negative percentage', () => {
    // Previous value: 100 / (1 + (-50)/100) = 100 / 0.5 = 200
    // Change: 100 - 200 = -100
    expect(calculatePercentageChange(100, -50)).toBeCloseTo(-100, 2)
  })

  it('should handle percentage changes > 100% correctly', () => {
    // Previous value: 100 / (1 + 150/100) = 100 / 2.5 = 40
    // Change: 100 - 40 = 60
    expect(calculatePercentageChange(100, 150)).toBeCloseTo(60, 2)
  })

  it('should handle percentage changes > 200% correctly', () => {
    // Previous value: 100 / (1 + 300/100) = 100 / 4 = 25
    // Change: 100 - 25 = 75
    expect(calculatePercentageChange(100, 300)).toBeCloseTo(75, 2)
  })

  it('should handle very large percentage changes', () => {
    // Previous value: 100 / (1 + 1000/100) = 100 / 11 = 9.09
    // Change: 100 - 9.09 = 90.91
    expect(calculatePercentageChange(100, 1000)).toBeCloseTo(90.91, 2)
  })

  it('should handle small percentage changes', () => {
    // Previous value: 100 / (1 + 1/100) = 100 / 1.01 = 99.01
    // Change: 100 - 99.01 = 0.99
    expect(calculatePercentageChange(100, 1)).toBeCloseTo(0.99, 2)
  })

  it('should handle zero percentage change', () => {
    // Previous value: 100 / (1 + 0/100) = 100 / 1 = 100
    // Change: 100 - 100 = 0
    expect(calculatePercentageChange(100, 0)).toBe(0)
  })

  it('should handle decimal current values', () => {
    // Previous value: 123.45 / (1 + 25/100) = 123.45 / 1.25 = 98.76
    // Change: 123.45 - 98.76 = 24.69
    expect(calculatePercentageChange(123.45, 25)).toBeCloseTo(24.69, 2)
  })

  it('should handle decimal percentage changes', () => {
    // Previous value: 100 / (1 + 12.5/100) = 100 / 1.125 = 88.89
    // Change: 100 - 88.89 = 11.11
    expect(calculatePercentageChange(100, 12.5)).toBeCloseTo(11.11, 2)
  })
})

describe('Edge cases and boundary conditions', () => {
  it('should handle very small positive percentages', () => {
    expect(calculatePercentageChange(100, 0.01)).toBeCloseTo(0.01, 4)
  })

  it('should handle very small negative percentages', () => {
    expect(calculatePercentageChange(100, -0.01)).toBeCloseTo(-0.01, 4)
  })

  it('should handle very large current values', () => {
    expect(calculatePercentageChange(1000000, 50)).toBeCloseTo(333333.33, 2)
  })

  it('should handle very small current values', () => {
    expect(calculatePercentageChange(0.01, 50)).toBeCloseTo(0.0033, 4)
  })

  it('should handle extreme negative percentages', () => {
    // Previous value: 100 / (1 + (-99)/100) = 100 / 0.01 = 10000
    // Change: 100 - 10000 = -9900
    expect(calculatePercentageChange(100, -99)).toBeCloseTo(-9900, 2)
  })
})
