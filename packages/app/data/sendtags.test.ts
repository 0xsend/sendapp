import '@jest/globals'
import { reward, total } from './sendtags'

const decimals = 10n ** 6n

const tags = [
  { name: '1' }, // 60 USDC (16 USDC reward)
  { name: '12' }, // 60 USDC (16 USDC reward)
  { name: '123' }, // 60 USDC (16 USDC reward)
  { name: '1234' }, // 30 USDC (8 USDC reward)
  { name: '12345' }, // 15 USDC (4 USDC reward)
  { name: '123456' }, // 7 USDC (2 USDC reward)
  { name: '1234567' }, // 7 USDC (2 USDC reward)
]

const totalDue = (60n + 60n + 60n + 30n + 15n + 7n + 7n) * decimals

const rewardDue = (16n + 16n + 16n + 8n + 4n + 2n + 2n) * decimals

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
