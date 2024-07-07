import { describe, expect, it } from '@jest/globals'

import { calculateWeights, type Mode } from './weights'
const balances = [
  { address: '0x1', balance: '1000' },
  { address: '0x2', balance: '2000' },
  { address: '0x3', balance: '3000' },
] as const
const amount = 100000n

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
] as {
  name: string
  mode: Mode
  expected: {
    totalWeight: bigint
    weightPerSend: bigint
    poolWeights: Record<`0x${string}`, bigint>
    weightedShares: Record<`0x${string}`, { address: `0x${string}`; amount: bigint }>
  }
}[]

describe('calculateWeights', () => {
  for (const { name, mode, expected } of testCases) {
    it(`should calculate ${name} weights using ${mode} mode`, () => {
      const snapshot = calculateWeights(balances, amount, mode)

      expect(snapshot).toMatchSnapshot(mode)

      const { totalWeight, weightPerSend, poolWeights, weightedShares } = snapshot

      expect(totalWeight).toBe(expected.totalWeight)
      expect(weightPerSend).toBe(expected.weightPerSend)
      expect(poolWeights).toEqual(expected.poolWeights)
      expect(weightedShares).toEqual(expected.weightedShares)
    })
  }
})
