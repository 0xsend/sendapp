import { reward, total } from './sendtags'
import { describe, it, expect } from '@jest/globals'

const decimals = 10n ** 6n

const tags = [
  { name: '1' }, // 32 USDC (8 USDC reward)
  { name: '12' }, // 32 USDC (8 USDC reward)
  { name: '123' }, // 32 USDC (8 USDC reward)
  { name: '1234' }, // 16 USDC (4 USDC reward)
  { name: '12345' }, // 8 USDC (2 USDC reward)
  { name: '123456' }, // 4 USDC (1 USDC reward)
  { name: '1234567' }, // 4 USDC (1 USDC reward)
]

const totalDue = (32n + 32n + 32n + 16n + 8n + 4n + 4n) * decimals

const rewardDue = BigInt(Math.round((8 + 8 + 8 + 4 + 2 + 1 + 1) * 10)) * (decimals / 10n)

describe('Sendtag data', () => {
  it('can calculate total correctly', () => {
    expect(total(tags)).toEqual(totalDue)
  })
  it('can calculate reward correctly', () => {
    const _reward = tags.reduce((acc, tag) => {
      return acc + reward(tag.name.length)
    }, 0n)
    expect(_reward).toEqual(rewardDue)
  })
})
