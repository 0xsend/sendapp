import { describe, expect, it } from '@jest/globals'
import { SendAccountReceiveDataSchema } from './SendAccountReceiveEventSchema'
import { assert } from 'app/utils/assert'
describe('SendAccountReceiveEventSchema', () => {
  it('should parse a valid send acount receive event', () => {
    const cases = [
      {
        input: {
          value: '10000000000000000',
          sender: '\\xa0ee7a142d267c1f36714e4a8f75612f20a79720',
          tx_idx: '0',
          log_idx: '0',
          tx_hash: '\\xeec33cc50042cbba53fc1de714bd99b206635f890dbe29771c7986df6da0f6af',
          log_addr: '\\xb2c21f54653531aa4affa80f63593913f0c70628',
          block_num: '15681483',
          coin: {
            coingeckoTokenId: 'ethereum',
            decimals: 18,
            label: 'Ethereum',
            symbol: 'ETH',
            token: 'eth',
          },
        },
        expected: {
          value: 10000000000000000n,
          sender: '0xa0Ee7A142d267C1f36714E4a8F75612F20a79720',
          tx_idx: 0n,
          log_idx: 0n,
          tx_hash: '0xeec33cc50042cbba53fc1de714bd99b206635f890dbe29771c7986df6da0f6af',
          log_addr: '0xB2c21F54653531aa4AffA80F63593913f0C70628',
          block_num: 15681483n,
          coin: {
            coingeckoTokenId: 'ethereum',
            decimals: 18,
            label: 'Ethereum',
            symbol: 'ETH',
            token: 'eth',
          },
        },
      },
    ]
    for (const { input, expected } of cases) {
      const result = SendAccountReceiveDataSchema.safeParse(input)
      if (!result.success) {
        console.log('failed', result.error)
      }
      assert(result.success === true)
      expect(result.data).toEqual(expected)
    }
  })
  it('should handle invalid transfer data', () => {
    const cases = [
      {
        // value: '1',
        sender: '\\xa0ee7a142d267c1f36714e4a8f75612f20a79720',
        tx_idx: '0',
        log_idx: '0',
        tx_hash: '\\xeec33cc50042cbba53fc1de714bd99b206635f890dbe29771c7986df6da0f6af',
        log_addr: '\\xb2c21f54653531aa4affa80f63593913f0c70628',
        block_num: '15681483',
      },
      {},
    ]
    for (const input of cases) {
      const result = SendAccountReceiveDataSchema.safeParse(input)
      if (result.success) {
        console.log('success', result)
      }
      assert(result.success === false)
    }
  })
})
