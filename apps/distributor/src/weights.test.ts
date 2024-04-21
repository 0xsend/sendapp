import { describe, expect, it, mock } from 'bun:test'

import { calculateWeights } from './weights'
const balances = [
  { address: '0x1', balance: '1000' },
  { address: '0x2', balance: '2000' },
  { address: '0x3', balance: '3000' },
] as const
const amount = 100000n

describe('calculateWeights', () => {
  it('should calculate linear weights', () => {
    const { totalWeight, weightPerSend, poolWeights } = calculateWeights(balances, amount, 'linear')

    expect(totalWeight).toBe(6000n)
    expect(weightPerSend).toBe(600n)
    expect(poolWeights).toEqual({
      '0x1': 1000n,
      '0x2': 2000n,
      '0x3': 3000n,
    })
  })

  it('should calculate logarithmic weights', () => {
    const { totalWeight, weightPerSend, poolWeights } = calculateWeights(
      balances,
      amount,
      'logarithmic'
    )

    expect(totalWeight).toBe(8471n)
    expect(weightPerSend).toBe(847n)
    expect(poolWeights).toEqual({
      '0x1': 1541n,
      '0x2': 2876n,
      '0x3': 4054n,
    })
  })

  it('should calculate square root weights', () => {
    const { totalWeight, weightPerSend, poolWeights } = calculateWeights(
      balances,
      amount,
      'square_root'
    )

    expect(totalWeight).toBe(24363n)
    expect(weightPerSend).toBe(2436n)
    expect(poolWeights).toEqual({
      '0x1': 9128n,
      '0x2': 8164n,
      '0x3': 7071n,
    })
  })

  it('should calculate exponential weights', () => {
    const { totalWeight, weightPerSend, poolWeights } = calculateWeights(
      balances,
      amount,
      'exponential'
    )

    expect(totalWeight).toBe(29850n)
    expect(weightPerSend).toBe(2985n)
    expect(poolWeights).toEqual({
      '0x1': 9975n,
      '0x2': 9950n,
      '0x3': 9925n,
    })
  })
})
