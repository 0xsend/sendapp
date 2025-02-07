import { describe, expect, it } from '@jest/globals'
import { assert } from 'app/utils/assert'
import { TagReceiptUSDCDataSchema } from './TagReceiptUSDCEventSchema'

describe('TagReceiptUSDCDataSchema', () => {
  it('should parse a valid tag receipt data', () => {
    const cases = [
      {
        input: {
          tags: ['hurl_handholding2408'],
          value: 100000,
          tx_hash: '\\xf1443b5abd14e6212dda2d9f5ff1d1d691599de3e8fa019ccc19b909d9bb46a4',
          log_addr: '\\x71fa02bb11e4b119bEDbeeD2f119F62048245301',
          block_num: '15164540',
          tx_idx: '0',
          log_idx: '2',
        },
        expected: {
          tags: ['hurl_handholding2408'],
          value: 100000n,
          tx_hash: '0xf1443b5abd14e6212dda2d9f5ff1d1d691599de3e8fa019ccc19b909d9bb46a4',
          log_addr: '0x71fa02bb11e4b119bEDbeeD2f119F62048245301',
          block_num: 15164540n,
          tx_idx: 0n,
          log_idx: 2n,
          coin: {
            coingeckoTokenId: 'usd-coin',
            decimals: 6,
            formatDecimals: 2,
            label: 'USDC',
            symbol: 'USDC',
            token: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
          },
        },
      },
    ]
    for (const { input, expected } of cases) {
      const result = TagReceiptUSDCDataSchema.safeParse(input)
      if (!result.success) {
        console.log('failed', result.error)
      }
      assert(result.success === true)
      expect(result.data).toEqual(expected)
    }
  })
  it('should handle invalid tag receipt data', () => {
    const cases = [
      {
        tags: ['hurl_handholding2408'],
        // value: '100000',
        tx_hash: '\\xf1443b5abd14e6212dda2d9f5ff1d1d691599de3e8fa019ccc19b909d9bb46a4',
      },
      {
        tags: ['hurl_handholding2408'],
        value: 100000,
        tx_hash: '0xf1443b5abd14e6212dda2d9f5ff1d1d691599de3e8fa019ccc19b909d9bb46a4',
      },
      {
        // tags: ['hurl_handholding2408'],
        value: 100000,
        tx_hash: '\\xf1443b5abd14e6212dda2d9f5ff1d1d691599de3e8fa019ccc19b909d9bb46a4',
      },
      {
        tags: ['hurl_handholding2408'],
        value: 100000,
        // tx_hash: '\\xf1443b5abd14e6212dda2d9f5ff1d1d691599de3e8fa019ccc19b909d9bb46a4',
      },
      {},
    ]
    for (const input of cases) {
      const result = TagReceiptUSDCDataSchema.safeParse(input)
      if (result.success) {
        console.log('success', result)
      }
      assert(result.success === false)
    }
  })
})
