import { describe, expect, it } from '@jest/globals'
import type { KyberRouteSummary } from '@my/api/src/routers/swap/types'
import {
  calculatePriceImpact,
  calculatePriceImpactFromEstimate,
  formatPriceImpact,
  getPriceImpactAnalysis,
  getPriceImpactColor,
  getPriceImpactLevel,
  getPriceImpactMessage,
} from './priceImpact'

describe('priceImpact', () => {
  describe('calculatePriceImpact', () => {
    const createRouteSummary = (
      amountInUsd: string,
      amountOutUsd: string,
      feeAmount = '75',
      isInBps = true
    ): KyberRouteSummary => ({
      tokenIn: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
      amountIn: '1000000000000000000',
      amountInUsd,
      tokenOut: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
      amountOut: '950000',
      amountOutUsd,
      gas: '150000',
      gasPrice: '1000000',
      gasUsd: '0.15',
      extraFee: {
        feeAmount,
        chargeFeeBy: 'currency_out',
        isInBps,
        feeReceiver: '0x0000000000000000000000000000000000000000',
      },
      route: [],
      checksum: '0x123',
      timestamp: Date.now(),
    })

    it('should calculate zero impact for equal USD values after removing fee', () => {
      // $100 in, $99.25 out (0.75% fee = $0.75)
      // After removing fee: $100 in, $100 out = 0% impact
      const summary = createRouteSummary('100', '99.25')
      const impact = calculatePriceImpact(summary)
      expect(impact).toBeCloseTo(0, 1)
    })

    it('should calculate positive impact for loss trades', () => {
      // $100 in, $95 out after 0.75% fee
      // Before fee: $95 / 0.9925 = $95.73
      // Impact: (100 - 95.73) / 100 = 4.27%
      const summary = createRouteSummary('100', '95')
      const impact = calculatePriceImpact(summary)
      expect(impact).toBeCloseTo(4.27, 1)
    })

    it('should calculate high impact for illiquid trades', () => {
      // $100 in, $80 out after fee
      // Before fee: $80 / 0.9925 = $80.60
      // Impact: (100 - 80.60) / 100 = 19.4%
      const summary = createRouteSummary('100', '80')
      const impact = calculatePriceImpact(summary)
      expect(impact).toBeCloseTo(19.4, 1)
    })

    it('should handle zero amountInUsd', () => {
      const summary = createRouteSummary('0', '0')
      const impact = calculatePriceImpact(summary)
      expect(impact).toBe(0)
    })

    it('should handle custom fee amounts', () => {
      // $100 in, $95 out after 1% fee
      // Before fee: $95 / 0.99 = $95.96
      // Impact: (100 - 95.96) / 100 = 4.04%
      const summary = createRouteSummary('100', '95', '100', true) // 1% in bps
      const impact = calculatePriceImpact(summary)
      expect(impact).toBeCloseTo(4.04, 1)
    })

    it('should handle fee not in basis points', () => {
      // $100 in, $95 out after 0.75% fee (expressed as 0.75 not 75)
      const summary = createRouteSummary('100', '95', '0.75', false)
      const impact = calculatePriceImpact(summary)
      expect(impact).toBeCloseTo(4.27, 1)
    })

    it('should handle missing extraFee (defaults to 0.75%)', () => {
      const summary: KyberRouteSummary = {
        tokenIn: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
        amountIn: '1000000000000000000',
        amountInUsd: '100',
        tokenOut: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
        amountOut: '950000',
        amountOutUsd: '95',
        gas: '150000',
        gasPrice: '1000000',
        gasUsd: '0.15',
        route: [],
        checksum: '0x123',
        timestamp: Date.now(),
      }
      const impact = calculatePriceImpact(summary)
      expect(impact).toBeCloseTo(4.27, 1)
    })

    it('should handle very small trades', () => {
      // $1 in, $0.99 out after fee
      // Before fee: $0.99 / 0.9925 = $0.9975
      // Impact: (1 - 0.9975) / 1 = 0.25%
      const summary = createRouteSummary('1', '0.99')
      const impact = calculatePriceImpact(summary)
      expect(impact).toBeCloseTo(0.25, 1)
    })

    it('should handle large trades', () => {
      // $100,000 in, $90,000 out after fee
      // Before fee: $90,000 / 0.9925 = $90,679.25
      // Impact: (100,000 - 90,679.25) / 100,000 = 9.32%
      const summary = createRouteSummary('100000', '90000')
      const impact = calculatePriceImpact(summary)
      expect(impact).toBeCloseTo(9.32, 1)
    })
  })

  describe('calculatePriceImpactFromEstimate', () => {
    it('should calculate impact from estimate data', () => {
      // Same math as calculatePriceImpact but with estimate structure
      const impact = calculatePriceImpactFromEstimate('100', '95', 0.0075)
      expect(impact).toBeCloseTo(4.27, 1)
    })

    it('should handle zero amountInUsd', () => {
      const impact = calculatePriceImpactFromEstimate('0', '0', 0.0075)
      expect(impact).toBe(0)
    })

    it('should handle custom fee percent', () => {
      const impact = calculatePriceImpactFromEstimate('100', '95', 0.01) // 1%
      expect(impact).toBeCloseTo(4.04, 1)
    })
  })

  describe('getPriceImpactLevel', () => {
    it('should return normal for impacts < 3%', () => {
      expect(getPriceImpactLevel(0)).toBe('normal')
      expect(getPriceImpactLevel(0.5)).toBe('normal')
      expect(getPriceImpactLevel(2.99)).toBe('normal')
    })

    it('should return medium for impacts 3-10%', () => {
      expect(getPriceImpactLevel(3)).toBe('medium')
      expect(getPriceImpactLevel(5)).toBe('medium')
      expect(getPriceImpactLevel(9.99)).toBe('medium')
    })

    it('should return high for impacts >= 10%', () => {
      expect(getPriceImpactLevel(10)).toBe('high')
      expect(getPriceImpactLevel(15)).toBe('high')
      expect(getPriceImpactLevel(50)).toBe('high')
    })

    it('should handle negative impacts (absolute value)', () => {
      expect(getPriceImpactLevel(-1)).toBe('normal')
      expect(getPriceImpactLevel(-5)).toBe('medium')
      expect(getPriceImpactLevel(-15)).toBe('high')
    })
  })

  describe('formatPriceImpact', () => {
    it('should show <0.5% for very small impacts', () => {
      expect(formatPriceImpact(0)).toBe('<0.5%')
      expect(formatPriceImpact(0.1)).toBe('<0.5%')
      expect(formatPriceImpact(0.49)).toBe('<0.5%')
      expect(formatPriceImpact(-0.3)).toBe('<0.5%')
    })

    it('should show 2 decimals for impacts 0.5-10%', () => {
      expect(formatPriceImpact(0.5)).toBe('0.50%')
      expect(formatPriceImpact(1.23)).toBe('1.23%')
      expect(formatPriceImpact(5.67)).toBe('5.67%')
      expect(formatPriceImpact(9.99)).toBe('9.99%')
    })

    it('should show 2 decimals for impacts >= 10%', () => {
      expect(formatPriceImpact(10)).toBe('10.00%')
      expect(formatPriceImpact(15.5)).toBe('15.50%')
      expect(formatPriceImpact(50.123)).toBe('50.12%')
    })

    it('should handle negative values', () => {
      expect(formatPriceImpact(-0.3)).toBe('<0.5%')
      expect(formatPriceImpact(-5.5)).toBe('-5.50%')
      expect(formatPriceImpact(-15)).toBe('-15.00%')
    })
  })

  describe('getPriceImpactColor', () => {
    it('should return default color for normal', () => {
      expect(getPriceImpactColor('normal')).toBe('$color12')
      expect(getPriceImpactColor('normal', false)).toBe('$color12')
    })

    it('should return $warning for medium in dark theme', () => {
      expect(getPriceImpactColor('medium', true)).toBe('$warning')
    })

    it('should return $orange8 for medium in light theme', () => {
      expect(getPriceImpactColor('medium', false)).toBe('$orange8')
    })

    it('should return $error for high regardless of theme', () => {
      expect(getPriceImpactColor('high', true)).toBe('$error')
      expect(getPriceImpactColor('high', false)).toBe('$error')
    })

    it('should default to dark theme when not specified', () => {
      expect(getPriceImpactColor('medium')).toBe('$warning')
    })
  })

  describe('getPriceImpactMessage', () => {
    it('should return null for normal impact', () => {
      expect(getPriceImpactMessage('normal')).toBeNull()
    })

    it('should return high message for medium impact', () => {
      const message = getPriceImpactMessage('medium')
      expect(message).toBe('High')
    })

    it('should return very high message for high impact', () => {
      const message = getPriceImpactMessage('high')
      expect(message).toBe('Very high')
    })
  })

  describe('getPriceImpactAnalysis', () => {
    const createRouteSummary = (amountInUsd: string, amountOutUsd: string): KyberRouteSummary => ({
      tokenIn: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
      amountIn: '1000000000000000000',
      amountInUsd,
      tokenOut: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
      amountOut: '950000',
      amountOutUsd,
      gas: '150000',
      gasPrice: '1000000',
      gasUsd: '0.15',
      extraFee: {
        feeAmount: '75',
        chargeFeeBy: 'currency_out',
        isInBps: true,
        feeReceiver: '0x0000000000000000000000000000000000000000',
      },
      route: [],
      checksum: '0x123',
      timestamp: Date.now(),
    })

    it('should return null for null summary', () => {
      expect(getPriceImpactAnalysis(null)).toBeNull()
    })

    it('should return null for undefined summary', () => {
      expect(getPriceImpactAnalysis(undefined)).toBeNull()
    })

    it('should return complete analysis for valid summary with normal impact', () => {
      const summary = createRouteSummary('100', '99.5')
      const analysis = getPriceImpactAnalysis(summary)

      expect(analysis).not.toBeNull()
      expect(analysis?.level).toBe('normal')
      expect(analysis?.formatted).toBe('<0.5%')
      expect(Math.abs(analysis?.percent || 0)).toBeLessThan(0.5)
    })

    it('should return complete analysis for medium impact', () => {
      const summary = createRouteSummary('100', '95')
      const analysis = getPriceImpactAnalysis(summary)

      expect(analysis).not.toBeNull()
      expect(analysis?.level).toBe('medium')
      expect(analysis?.percent).toBeCloseTo(4.27, 0)
      expect(analysis?.formatted).toMatch(/^4\.\d{2}%$/)
    })

    it('should return complete analysis for high impact', () => {
      const summary = createRouteSummary('100', '85')
      const analysis = getPriceImpactAnalysis(summary)

      expect(analysis).not.toBeNull()
      expect(analysis?.level).toBe('high')
      expect(analysis?.percent).toBeCloseTo(14.4, 0)
      expect(analysis?.formatted).toMatch(/^14\.\d{2}%$/)
    })
  })

  describe('edge cases', () => {
    it('should handle extremely small USD values', () => {
      const summary: KyberRouteSummary = {
        tokenIn: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
        amountIn: '1',
        amountInUsd: '0.0001',
        tokenOut: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
        amountOut: '1',
        amountOutUsd: '0.00009',
        gas: '150000',
        gasPrice: '1000000',
        gasUsd: '0.15',
        extraFee: {
          feeAmount: '75',
          chargeFeeBy: 'currency_out',
          isInBps: true,
          feeReceiver: '0x0000000000000000000000000000000000000000',
        },
        route: [],
        checksum: '0x123',
        timestamp: Date.now(),
      }

      const impact = calculatePriceImpact(summary)
      expect(impact).toBeDefined()
      expect(Number.isFinite(impact)).toBe(true)
    })

    it('should handle extremely large USD values', () => {
      const summary: KyberRouteSummary = {
        tokenIn: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
        amountIn: '1000000000000000000000000',
        amountInUsd: '1000000',
        tokenOut: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
        amountOut: '950000000000',
        amountOutUsd: '950000',
        gas: '150000',
        gasPrice: '1000000',
        gasUsd: '0.15',
        extraFee: {
          feeAmount: '75',
          chargeFeeBy: 'currency_out',
          isInBps: true,
          feeReceiver: '0x0000000000000000000000000000000000000000',
        },
        route: [],
        checksum: '0x123',
        timestamp: Date.now(),
      }

      const impact = calculatePriceImpact(summary)
      expect(impact).toBeCloseTo(4.27, 1)
    })
  })
})
