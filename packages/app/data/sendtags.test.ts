import '@jest/globals'
import { reward, total } from './sendtags'

const decimals = 10n ** 6n

const tags = [
  { name: '1' }, // 32 USDC (24 USDC reward)
  { name: '12' }, // 32 USDC (24 USDC reward)
  { name: '123' }, // 32 USDC (24 USDC reward)
  { name: '1234' }, // 16 USDC (12 USDC reward)
  { name: '12345' }, // 8 USDC (6 USDC reward)
  { name: '123456' }, // 4 USDC (3 USDC reward)
  { name: '1234567' }, // 4 USDC (3 USDC reward)
]

const totalDue = (32n + 32n + 32n + 16n + 8n + 4n + 4n) * decimals

const rewardDue = (24n + 24n + 24n + 12n + 6n + 3n + 3n) * decimals

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
