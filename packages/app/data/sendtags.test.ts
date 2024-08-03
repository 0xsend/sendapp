import '@jest/globals'
import { reward, total } from './sendtags'

const decimals = 10n ** 6n

const tags = [
  { name: '1' }, // 64 USDC (48 USDC reward)
  { name: '12' }, // 64 USDC (48 USDC reward)
  { name: '123' }, // 64 USDC (48 USDC reward)
  { name: '1234' }, // 32 USDC (24 USDC reward)
  { name: '12345' }, // 16 USDC (12 USDC reward)
  { name: '123456' }, // 8 USDC (6 USDC reward)
  { name: '1234567' }, // 8 USDC (6 USDC reward)
]

const totalDue = (64n + 64n + 64n + 32n + 16n + 8n + 8n) * decimals

const rewardDue = (48n + 48n + 48n + 24n + 12n + 6n + 6n) * decimals

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
