import { describe, expect, it } from 'bun:test'
import { calculateWeights, Mode } from './weights'

const balances = [
  {
    address: '0x1' as `0x${string}`,
    balance: '800',
  },
  {
    address: '0x2' as `0x${string}`,
    balance: '1600',
  },
  {
    address: '0x3' as `0x${string}`,
    balance: '2400',
  },
] as const

const timeAdjustedAmount = 80000n // Example: 80% of original amount

const testCases = [
  {
    name: 'linear',
    mode: 'linear',
    expected: {
      totalWeight: 6000n,
      weightPerSend: 600n,
      poolWeights: {
        '0x1': 1000n,
        '0x2': 2000n,
        '0x3': 3000n,
      },
      weightedShares: {
        '0x1': {
          amount: 16666n,
          address: '0x1',
        },
        '0x2': {
          amount: 33333n,
          address: '0x2',
        },
        '0x3': {
          amount: 50000n,
          address: '0x3',
        },
      },
    },
  },
  {
    name: 'logarithmic',
    mode: 'logarithmic',
    expected: {
      totalWeight: 8471n,
      weightPerSend: 847n,
      poolWeights: {
        '0x1': 1541n,
        '0x2': 2876n,
        '0x3': 4054n,
      },
      weightedShares: {
        '0x1': {
          address: '0x1',
          amount: 18193n,
        },
        '0x2': {
          address: '0x2',
          amount: 33955n,
        },
        '0x3': {
          address: '0x3',
          amount: 47863n,
        },
      },
    },
  },
  {
    name: 'square_root',
    mode: 'square_root',
    expected: {
      totalWeight: 24363n,
      weightPerSend: 2436n,
      poolWeights: {
        '0x1': 9128n,
        '0x2': 8164n,
        '0x3': 7071n,
      },
      weightedShares: {
        '0x1': {
          address: '0x1',
          amount: 37471n,
        },
        '0x2': {
          address: '0x2',
          amount: 33513n,
        },
        '0x3': {
          address: '0x3',
          amount: 29027n,
        },
      },
    },
  },
  {
    name: 'exponential',
    mode: 'exponential',
    expected: {
      totalWeight: 29850n,
      weightPerSend: 2985n,
      poolWeights: {
        '0x1': 9975n,
        '0x2': 9950n,
        '0x3': 9925n,
      },
      weightedShares: {
        '0x1': {
          address: '0x1',
          amount: 33417n,
        },
        '0x2': {
          address: '0x2',
          amount: 33333n,
        },
        '0x3': {
          address: '0x3',
          amount: 33249n,
        },
      },
    },
  },
  {
    name: 'ease_in_out',
    mode: 'ease_in_out',
    expected: {
      totalWeight: 26666n, // Approximate total based on the curve
      weightPerSend: 2666n,
      poolWeights: {
        '0x1': 7466n, // ~28% weight for lowest balance
        '0x2': 9600n, // ~36% weight for middle balance
        '0x3': 9600n, // ~36% weight for highest balance
      },
      weightedShares: {
        '0x1': {
          address: '0x1',
          amount: 28000n, // ~35% of 80000
        },
        '0x2': {
          address: '0x2',
          amount: 26000n, // ~32.5% of 80000
        },
        '0x3': {
          address: '0x3',
          amount: 26000n, // ~32.5% of 80000
        },
      },
    },
  },
] as const

describe('calculateWeights', () => {
  for (const { name, mode, expected } of testCases) {
    it.skip(`should calculate ${name} weights using ${mode} mode`, () => {
      const weightedShares = calculateWeights(balances, timeAdjustedAmount, mode as Mode)

      expect(weightedShares).toEqual(expected.weightedShares)
    })
  }

  it('should calculate linear weights with slashing', () => {
    const weightedShares = calculateWeights(balances, timeAdjustedAmount, Mode.Linear)

    // Test weightedSharesAfterSlash (actual distribution with slash)
    expect(weightedShares).toEqual({
      '0x1': {
        address: '0x1',
        amount: 13333n, // ~16.67% of 80000
      },
      '0x2': {
        address: '0x2',
        amount: 26666n, // ~33.33% of 80000
      },
      '0x3': {
        address: '0x3',
        amount: 40000n, // ~50% of 80000
      },
    })
  })
})
