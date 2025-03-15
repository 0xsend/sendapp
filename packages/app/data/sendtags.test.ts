import '@jest/globals'
import { reward, total } from './sendtags'

const decimals = 10n ** 6n

const tags = [
  { name: '1' }, // 16 USDC (4 USDC reward)
  { name: '12' }, // 16 USDC (4 USDC reward)
  { name: '123' }, // 16 USDC (4 USDC reward)
  { name: '1234' }, // 8 USDC (2 USDC reward)
  { name: '12345' }, // 4 USDC (1 USDC reward)
  { name: '123456' }, // 2 USDC (.5 USDC reward)
  { name: '1234567' }, // 2 USDC (.5 USDC reward)
]

const totalDue = (16n + 16n + 16n + 8n + 4n + 2n + 2n) * decimals

const rewardDue = BigInt(Math.round((4 + 4 + 4 + 2 + 1 + 0.5 + 0.5) * 10)) * (decimals / 10n)

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
