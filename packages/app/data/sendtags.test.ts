import '@jest/globals'
import { total } from './sendtags'

const decimals = 10n ** 6n

describe('Sendtag data', () => {
  it('can calculate total correctly', () => {
    const tags = [
      { name: '1' }, // 60 USDC
      { name: '12' }, // 60 USDC
      { name: '123' }, // 60 USDC
      { name: '1234' }, // 30 USDC
      { name: '12345' }, // 15 USDC
      { name: '123456' }, // 7 USDC
      { name: '1234567' }, // 7 USDC
    ]
    const totalDue = (60n + 60n + 60n + 30n + 15n + 7n + 7n) * decimals
    expect(total(tags)).toEqual(totalDue)
  })
})
