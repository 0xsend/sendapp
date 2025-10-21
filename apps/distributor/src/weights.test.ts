import { describe, expect, it } from 'bun:test'
import { calculateWeights, Mode } from './weights'

const balances = [
  {
    address: '0x1' as `0x${string}`,
    userId: 'u1',
    balance: 800n,
  },
  {
    address: '0x2' as `0x${string}`,
    userId: 'u2',
    balance: 1600n,
  },
  {
    address: '0x3' as `0x${string}`,
    userId: 'u3',
    balance: 2400n,
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
          amount: 13333n,
          address: '0x1',
          userId: 'u1',
        },
        '0x2': {
          amount: 26666n,
          address: '0x2',
          userId: 'u2',
        },
        '0x3': {
          amount: 40001n,
          address: '0x3',
          userId: 'u3',
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
          amount: 14554n,
          userId: 'u1',
        },
        '0x2': {
          address: '0x2',
          amount: 27162n,
          userId: 'u2',
        },
        '0x3': {
          address: '0x3',
          amount: 38284n,
          userId: 'u3',
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
          amount: 29974n,
          userId: 'u1',
        },
        '0x2': {
          address: '0x2',
          amount: 26809n,
          userId: 'u2',
        },
        '0x3': {
          address: '0x3',
          amount: 23217n,
          userId: 'u3',
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
          amount: 26734n,
          userId: 'u1',
        },
        '0x2': {
          address: '0x2',
          amount: 26666n,
          userId: 'u2',
        },
        '0x3': {
          address: '0x3',
          amount: 26600n,
          userId: 'u3',
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
        '0x2': {
          address: '0x2',
          amount: 20000n,
          userId: 'u2',
        },
        '0x3': {
          address: '0x3',
          amount: 60000n,
          userId: 'u3',
        },
      },
    },
  },
  {
    name: 'sigmoid',
    mode: 'sigmoid',
    expected: {
      totalWeight: 25000n, // Approximate total based on sigmoid curve
      weightPerSend: 2500n,
      poolWeights: {
        '0x1': 5000n, // ~20% weight for lowest balance (flat start)
        '0x2': 10000n, // ~40% weight for middle balance (steep transition)
        '0x3': 10000n, // ~40% weight for highest balance (flat end)
      },
      weightedShares: {
        '0x1': {
          address: '0x1',
          amount: 25n,
          userId: 'u1',
        },
        '0x2': {
          address: '0x2',
          amount: 20031n,
          userId: 'u2',
        },
        '0x3': {
          address: '0x3',
          amount: 59944n,
          userId: 'u3',
        },
      },
    },
  },
] as const

describe('calculateWeights', () => {
  for (const { name, mode, expected } of testCases) {
    it(`should calculate ${name} weights using ${mode} mode`, () => {
      const weightedShares = calculateWeights(balances, timeAdjustedAmount, mode as Mode)

      expect(weightedShares).toEqual(expected.weightedShares)
    })
  }

  it('should calculate linear weights with slashing', () => {
    const linearBalances = [
      { address: '0x1' as `0x${string}`, userId: 'u1', balance: 1000n },
      { address: '0x2' as `0x${string}`, userId: 'u2', balance: 2000n },
      { address: '0x3' as `0x${string}`, userId: 'u3', balance: 3000n },
    ] as const

    const weightedShares = calculateWeights(linearBalances, timeAdjustedAmount, Mode.Linear)

    expect(weightedShares).toEqual({
      '0x1': { address: '0x1', amount: 13333n, userId: 'u1' },
      '0x2': { address: '0x2', amount: 26666n, userId: 'u2' },
      '0x3': { address: '0x3', amount: 40001n, userId: 'u3' },
    })
  })

  it('should fall back to equal split when total weight is zero (all balances zero)', () => {
    const zeroBalances = [
      { address: '0x1' as `0x${string}`, userId: 'a', balance: 0n },
      { address: '0x2' as `0x${string}`, userId: 'b', balance: 0n },
      { address: '0x3' as `0x${string}`, userId: 'c', balance: 0n },
    ] as const
    const amount = 7n
    const shares = calculateWeights(zeroBalances, amount, Mode.Sigmoid)
    const sum = Object.values(shares).reduce((acc, s) => acc + s.amount, 0n)
    expect(sum).toBe(amount)
    expect(shares['0x1'].amount >= shares['0x2'].amount).toBe(true)
    expect(shares['0x2'].amount >= shares['0x3'].amount).toBe(true)
  })

  it('sigmoid should boost mid/higher holders relative to lowest and sum to total', () => {
    const sigBalances = [
      { address: '0x1' as `0x${string}`, userId: 's1', balance: 1n },
      { address: '0x2' as `0x${string}`, userId: 's2', balance: 2n },
      { address: '0x3' as `0x${string}`, userId: 's3', balance: 3n },
    ] as const
    const amount = 100000n
    const shares = calculateWeights(sigBalances, amount, Mode.Sigmoid)
    const a1 = shares['0x1']?.amount ?? 0n
    const a2 = shares['0x2']?.amount ?? 0n
    const a3 = shares['0x3']?.amount ?? 0n
    expect(a2 >= a1).toBe(true)
    expect(a3 >= a2).toBe(true)
    const sum = a1 + a2 + a3
    expect(sum).toBe(amount)
  })
})
