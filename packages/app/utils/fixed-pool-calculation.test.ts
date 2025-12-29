import { describe, expect, it } from '@jest/globals'

import {
  PERC_DENOM,
  calculateMultiplier,
  calculateCombinedMultiplier,
  calculateSlashPercentage,
  calculateTaskAmount,
  calculateAllMultipliers,
  calculatePreviousReward,
  calculateBaseFixedAmount,
  calculateFixedPoolAmount,
  type MultiplierConfig,
  type VerificationType,
} from './fixed-pool-calculation'

describe('calculateMultiplier', () => {
  const config: MultiplierConfig = {
    min: 1.0,
    max: 2.0,
    step: 0.1,
  }

  describe('weight=0 cases', () => {
    it('should return currentValue when weight=0 and currentValue is defined', () => {
      expect(calculateMultiplier(0, 1.5, config)).toBe(1.5)
    })

    it('should return min when weight=0 and currentValue is undefined', () => {
      expect(calculateMultiplier(0, undefined, config)).toBe(1.0)
    })
  })

  describe('weight=1 cases', () => {
    it('should return min when weight=1 and currentValue is undefined', () => {
      expect(calculateMultiplier(1, undefined, config)).toBe(1.0)
    })

    it('should increment currentValue by step when weight=1', () => {
      expect(calculateMultiplier(1, 1.5, config)).toBe(1.6)
    })

    it('should cap at max when weight=1 and increment would exceed max', () => {
      expect(calculateMultiplier(1, 1.95, config)).toBe(2.0)
    })
  })

  describe('weight>1 cases', () => {
    it('should calculate min + (weight - 1) * step when weight>1', () => {
      expect(calculateMultiplier(5, undefined, config)).toBe(1.4)
    })

    it('should cap at max when calculated value exceeds max', () => {
      expect(calculateMultiplier(20, undefined, config)).toBe(2.0)
    })
  })

  describe('edge cases with zero step/min/max', () => {
    it('should handle zero step', () => {
      const zeroStepConfig = { min: 1.0, max: 2.0, step: 0 }
      expect(calculateMultiplier(5, undefined, zeroStepConfig)).toBe(1.0)
    })

    it('should handle min equal to max', () => {
      const equalConfig = { min: 1.5, max: 1.5, step: 0.1 }
      expect(calculateMultiplier(5, undefined, equalConfig)).toBe(1.5)
    })

    it('should handle zero min and max', () => {
      const zeroConfig = { min: 0, max: 0, step: 0.1 }
      expect(calculateMultiplier(5, undefined, zeroConfig)).toBe(0)
    })
  })
})

describe('calculateCombinedMultiplier', () => {
  it('should return 1.0 for empty object', () => {
    expect(calculateCombinedMultiplier({})).toBe(1.0)
  })

  it('should return the single multiplier value', () => {
    expect(calculateCombinedMultiplier({ verification1: { value: 1.5 } })).toBe(1.5)
  })

  it('should multiply multiple multipliers together', () => {
    const multipliers = {
      verification1: { value: 1.5 },
      verification2: { value: 2.0 },
      verification3: { value: 1.2 },
    }
    expect(calculateCombinedMultiplier(multipliers)).toBeCloseTo(3.6)
  })

  it('should treat undefined values as 1.0', () => {
    const multipliers = {
      verification1: { value: 2.0 },
      verification2: { value: undefined },
      verification3: { value: 1.5 },
    }
    expect(calculateCombinedMultiplier(multipliers)).toBe(3.0)
  })

  it('should handle all undefined values', () => {
    const multipliers = {
      verification1: { value: undefined },
      verification2: { value: undefined },
    }
    expect(calculateCombinedMultiplier(multipliers)).toBe(1.0)
  })

  it('should handle mix of defined and undefined values', () => {
    const multipliers = {
      verification1: {},
      verification2: { value: 2.0 },
      verification3: {},
    }
    expect(calculateCombinedMultiplier(multipliers)).toBe(2.0)
  })
})

describe('calculateSlashPercentage', () => {
  const scalingDivisor = 4

  it('should return 0n when previousReward=0', () => {
    expect(calculateSlashPercentage(1000n, 0n, scalingDivisor)).toBe(0n)
  })

  it('should return 0n when sendCeilingWeight=0', () => {
    expect(calculateSlashPercentage(0n, 1000n, scalingDivisor)).toBe(0n)
  })

  it('should calculate normal case when weight < previous reward', () => {
    const sendCeilingWeight = 100n
    const previousReward = 1000n
    const result = calculateSlashPercentage(sendCeilingWeight, previousReward, scalingDivisor)
    // Expected: (100 * PERC_DENOM * PERC_DENOM) / ((1000 * PERC_DENOM) / 4)
    expect(result).toBeGreaterThan(0n)
    expect(result).toBeLessThanOrEqual(PERC_DENOM)
  })

  it('should cap at 100% when weight >= previous reward', () => {
    const sendCeilingWeight = 5000n
    const previousReward = 1000n
    const result = calculateSlashPercentage(sendCeilingWeight, previousReward, scalingDivisor)
    expect(result).toBe(PERC_DENOM)
  })

  it('should handle equal weight and previous reward', () => {
    const sendCeilingWeight = 1000n
    const previousReward = 1000n
    const result = calculateSlashPercentage(sendCeilingWeight, previousReward, 1)
    expect(result).toBe(PERC_DENOM)
  })

  it('should handle division edge cases with large numbers', () => {
    const sendCeilingWeight = BigInt(1e18)
    const previousReward = BigInt(1e18)
    const result = calculateSlashPercentage(sendCeilingWeight, previousReward, 1)
    expect(result).toBe(PERC_DENOM)
  })

  it('should handle small numbers correctly', () => {
    const sendCeilingWeight = 1n
    const previousReward = 100n
    const result = calculateSlashPercentage(sendCeilingWeight, previousReward, scalingDivisor)
    expect(result).toBeGreaterThan(0n)
    expect(result).toBeLessThan(PERC_DENOM)
  })
})

describe('calculateTaskAmount', () => {
  const scalingDivisor = 4

  it('should return 0n when sendCeilingWeight is 0', () => {
    const multipliers = { verification1: { value: 1.5 } }
    const result = calculateTaskAmount(1000n, multipliers, 0n, 500n, scalingDivisor)
    expect(result).toBe(0n)
  })

  it('should apply multiplier and slashing correctly', () => {
    const multipliers = { verification1: { value: 2.0 } }
    const taskBaseAmount = 1000n
    const sendCeilingWeight = 100n
    const previousReward = 1000n
    const result = calculateTaskAmount(
      taskBaseAmount,
      multipliers,
      sendCeilingWeight,
      previousReward,
      scalingDivisor
    )
    expect(result).toBeGreaterThan(0n)
  })

  it('should handle zero multipliers (all undefined)', () => {
    const multipliers = { verification1: { value: undefined } }
    const result = calculateTaskAmount(1000n, multipliers, 100n, 500n, scalingDivisor)
    expect(result).toBeGreaterThan(0n)
  })

  it('should handle multiple multipliers', () => {
    const multipliers = {
      verification1: { value: 1.5 },
      verification2: { value: 2.0 },
    }
    const result = calculateTaskAmount(1000n, multipliers, 100n, 500n, scalingDivisor)
    expect(result).toBeGreaterThan(0n)
  })

  it('should handle scaling divisor edge cases', () => {
    const multipliers = { verification1: { value: 1.0 } }
    const result = calculateTaskAmount(1000n, multipliers, 100n, 500n, 1)
    expect(result).toBeGreaterThan(0n)
  })

  it('should handle large task base amounts', () => {
    const multipliers = { verification1: { value: 1.5 } }
    const taskBaseAmount = BigInt(1e18)
    const result = calculateTaskAmount(taskBaseAmount, multipliers, 100n, 500n, scalingDivisor)
    expect(result).toBeGreaterThan(0n)
  })
})

describe('calculateAllMultipliers', () => {
  const verificationValues = new Map<
    VerificationType,
    { multiplier_min: number; multiplier_max: number; multiplier_step: number }
  >([
    [
      'tag_search' as VerificationType,
      { multiplier_min: 1.0, multiplier_max: 2.0, multiplier_step: 0.1 },
    ],
    [
      'tag_referral' as VerificationType,
      { multiplier_min: 1.0, multiplier_max: 1.5, multiplier_step: 0.05 },
    ],
  ])

  it('should return empty object for empty verifications', () => {
    expect(calculateAllMultipliers([], verificationValues)).toEqual({})
  })

  it('should skip verifications with zero weight', () => {
    const verifications = [
      { type: 'tag_search' as VerificationType, weight: 0n },
      { type: 'tag_referral' as VerificationType, weight: 5n },
    ]
    const result = calculateAllMultipliers(verifications, verificationValues)
    expect(result).not.toHaveProperty('tag_search')
    expect(result).toHaveProperty('tag_referral')
  })

  it('should calculate multipliers for various weights', () => {
    const verifications = [
      { type: 'tag_search' as VerificationType, weight: 5n },
      { type: 'tag_referral' as VerificationType, weight: 3n },
    ]
    const result = calculateAllMultipliers(verifications, verificationValues)
    expect(result.tag_search).toBeDefined()
    expect(result.tag_search.value).toBe(1.4)
    expect(result.tag_referral).toBeDefined()
    expect(result.tag_referral.value).toBe(1.1)
  })

  it('should skip verifications not in config map', () => {
    const verifications = [
      { type: 'unknown_verification' as VerificationType, weight: 5n },
      { type: 'tag_search' as VerificationType, weight: 5n },
    ]
    const result = calculateAllMultipliers(verifications, verificationValues)
    expect(result).not.toHaveProperty('unknown_verification')
    expect(result).toHaveProperty('tag_search')
  })

  it('should skip verifications with step<=0 and max<=1', () => {
    const customMap = new Map([
      [
        'disabled' as VerificationType,
        { multiplier_min: 1.0, multiplier_max: 1.0, multiplier_step: 0 },
      ],
      [
        'enabled' as VerificationType,
        { multiplier_min: 1.0, multiplier_max: 2.0, multiplier_step: 0.1 },
      ],
    ])
    const verifications = [
      { type: 'disabled' as VerificationType, weight: 5n },
      { type: 'enabled' as VerificationType, weight: 5n },
    ]
    const result = calculateAllMultipliers(verifications, customMap)
    expect(result).not.toHaveProperty('disabled')
    expect(result).toHaveProperty('enabled')
  })
})

describe('calculatePreviousReward', () => {
  const hodlerMinBalance = 100n

  it('should return hodlerMinBalance for empty previousShares', () => {
    expect(calculatePreviousReward([], 12, hodlerMinBalance)).toBe(100n)
  })

  it('should return hodlerMinBalance for undefined previousShares', () => {
    expect(calculatePreviousReward(undefined, 12, hodlerMinBalance)).toBe(100n)
  })

  it('should handle distribution 11 special case', () => {
    const previousShares = [{ amount: '100' }, { amount: '200' }]
    const result = calculatePreviousReward(previousShares, 11, hodlerMinBalance)
    // (100 + 200) * 1e16
    expect(result).toBe(300n * BigInt(1e16))
  })

  it('should handle normal cases (not distribution 11)', () => {
    const previousShares = [{ amount: '100' }, { amount: '200' }, { amount: '300' }]
    const result = calculatePreviousReward(previousShares, 12, hodlerMinBalance)
    expect(result).toBe(600n)
  })

  it('should handle single share', () => {
    const previousShares = [{ amount: '500' }]
    const result = calculatePreviousReward(previousShares, 15, hodlerMinBalance)
    expect(result).toBe(500n)
  })

  it('should handle large amounts', () => {
    const previousShares = [{ amount: '1000000000000000000' }]
    const result = calculatePreviousReward(previousShares, 12, hodlerMinBalance)
    expect(result).toBe(1000000000000000000n)
  })
})

describe('calculateBaseFixedAmount', () => {
  const verificationValues = new Map<
    VerificationType,
    {
      fixedValue?: bigint
      multiplier_min: number
      multiplier_max: number
      multiplier_step: number
    }
  >([
    [
      'tag_search' as VerificationType,
      { fixedValue: 1000n, multiplier_min: 1.0, multiplier_max: 2.0, multiplier_step: 0.1 },
    ],
    [
      'tag_referral' as VerificationType,
      { fixedValue: 500n, multiplier_min: 1.0, multiplier_max: 1.5, multiplier_step: 0.05 },
    ],
  ])

  it('should return 0n for empty verifications', () => {
    expect(calculateBaseFixedAmount([], verificationValues)).toBe(0n)
  })

  it('should calculate base amount with single verification', () => {
    const verifications = [{ type: 'tag_search' as VerificationType, weight: 5n }]
    const result = calculateBaseFixedAmount(verifications, verificationValues)
    expect(result).toBe(5000n) // 1000 * 5
  })

  it('should calculate base amount with multiple verifications', () => {
    const verifications = [
      { type: 'tag_search' as VerificationType, weight: 3n },
      { type: 'tag_referral' as VerificationType, weight: 2n },
    ]
    const result = calculateBaseFixedAmount(verifications, verificationValues)
    expect(result).toBe(4000n) // (1000 * 3) + (500 * 2)
  })

  it('should skip verifications with zero weight', () => {
    const verifications = [
      { type: 'tag_search' as VerificationType, weight: 0n },
      { type: 'tag_referral' as VerificationType, weight: 2n },
    ]
    const result = calculateBaseFixedAmount(verifications, verificationValues)
    expect(result).toBe(1000n) // 500 * 2
  })

  it('should skip verifications not in config map', () => {
    const verifications = [
      { type: 'unknown' as VerificationType, weight: 5n },
      { type: 'tag_search' as VerificationType, weight: 2n },
    ]
    const result = calculateBaseFixedAmount(verifications, verificationValues)
    expect(result).toBe(2000n) // 1000 * 2
  })

  it('should skip verifications without fixedValue', () => {
    const customMap = new Map([
      [
        'no_fixed' as VerificationType,
        { multiplier_min: 1.0, multiplier_max: 2.0, multiplier_step: 0.1 },
      ],
      [
        'with_fixed' as VerificationType,
        { fixedValue: 1000n, multiplier_min: 1.0, multiplier_max: 2.0, multiplier_step: 0.1 },
      ],
    ])
    const verifications = [
      { type: 'no_fixed' as VerificationType, weight: 5n },
      { type: 'with_fixed' as VerificationType, weight: 3n },
    ]
    const result = calculateBaseFixedAmount(verifications, customMap)
    expect(result).toBe(3000n) // 1000 * 3
  })
})

describe('calculateFixedPoolAmount', () => {
  it('should apply multiplier correctly', () => {
    const baseAmount = 1000n
    const multiplier = 2.0
    const slashPercentage = PERC_DENOM // 100%
    const hodlerCapAmount = 10000n
    const result = calculateFixedPoolAmount(
      baseAmount,
      multiplier,
      slashPercentage,
      hodlerCapAmount
    )
    expect(result).toBe(2000n)
  })

  it('should apply slashing correctly', () => {
    const baseAmount = 1000n
    const multiplier = 2.0
    const slashPercentage = PERC_DENOM / 2n // 50%
    const hodlerCapAmount = 10000n
    const result = calculateFixedPoolAmount(
      baseAmount,
      multiplier,
      slashPercentage,
      hodlerCapAmount
    )
    expect(result).toBe(1000n) // 2000 * 0.5
  })

  it('should apply hodler cap when amount exceeds cap', () => {
    const baseAmount = 10000n
    const multiplier = 2.0
    const slashPercentage = PERC_DENOM
    const hodlerCapAmount = 5000n
    const result = calculateFixedPoolAmount(
      baseAmount,
      multiplier,
      slashPercentage,
      hodlerCapAmount
    )
    expect(result).toBe(5000n)
  })

  it('should not cap when amount is below hodler cap', () => {
    const baseAmount = 1000n
    const multiplier = 1.5
    const slashPercentage = PERC_DENOM
    const hodlerCapAmount = 10000n
    const result = calculateFixedPoolAmount(
      baseAmount,
      multiplier,
      slashPercentage,
      hodlerCapAmount
    )
    expect(result).toBe(1500n)
  })

  it('should handle zero base amount', () => {
    const baseAmount = 0n
    const multiplier = 2.0
    const slashPercentage = PERC_DENOM
    const hodlerCapAmount = 10000n
    const result = calculateFixedPoolAmount(
      baseAmount,
      multiplier,
      slashPercentage,
      hodlerCapAmount
    )
    expect(result).toBe(0n)
  })

  it('should handle zero slashing (full slash)', () => {
    const baseAmount = 1000n
    const multiplier = 2.0
    const slashPercentage = 0n
    const hodlerCapAmount = 10000n
    const result = calculateFixedPoolAmount(
      baseAmount,
      multiplier,
      slashPercentage,
      hodlerCapAmount
    )
    expect(result).toBe(0n)
  })

  it('should handle multiplier of 1.0 (no change)', () => {
    const baseAmount = 1000n
    const multiplier = 1.0
    const slashPercentage = PERC_DENOM
    const hodlerCapAmount = 10000n
    const result = calculateFixedPoolAmount(
      baseAmount,
      multiplier,
      slashPercentage,
      hodlerCapAmount
    )
    expect(result).toBe(1000n)
  })

  it('should handle complex scenario with all factors', () => {
    const baseAmount = 5000n
    const multiplier = 1.5
    const slashPercentage = PERC_DENOM / 4n // 25%
    const hodlerCapAmount = 3000n
    const result = calculateFixedPoolAmount(
      baseAmount,
      multiplier,
      slashPercentage,
      hodlerCapAmount
    )
    // 5000 * 1.5 = 7500, 7500 * 0.25 = 1875, cap to 3000 (not needed)
    expect(result).toBe(1875n)
  })
})
