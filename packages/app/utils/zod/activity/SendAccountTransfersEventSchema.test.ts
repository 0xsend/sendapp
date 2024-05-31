import { describe, expect, it } from '@jest/globals'
import { TransferDataSchema } from './SendAccountTransfersEventSchema'
import { assert } from 'app/utils/assert'
describe('TransferDataSchema', () => {
  it('should parse a valid transfer data', () => {
    const cases = [
      {
        input: {
          f: '\\x760e2928c3aa3af87897be52eb4833d42bbb27cf',
          t: '\\xbf65ee06b43b9ca718216241f0b9f81b5ff30cc1',
          v: 1965443,
          tx_hash: '\\xc283f8867727a615fd61c58a97b03afb76004c809bf53248f2130eb9a09ea952',
          log_addr: '\\x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
          block_num: '15164540',
          tx_idx: '0',
          log_idx: '2',
        },
        expected: {
          f: '0x760E2928C3aa3aF87897bE52eb4833d42bbB27cf',
          t: '0xbf65EE06b43B9cA718216241f0b9F81b5ff30CC1',
          v: 1965443n,
          tx_hash: '0xc283f8867727a615fd61c58a97b03afb76004c809bf53248f2130eb9a09ea952',
          log_addr: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
          block_num: 15164540n,
          tx_idx: 0n,
          log_idx: 2n,
          coin: {
            coingeckoTokenId: 'usd-coin',
            decimals: 6,
            label: 'USDC',
            symbol: 'USDC',
            token: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
          },
        },
      },
      {
        input: {
          f: '\\x760e2928c3aa3af87897be52eb4833d42bbb27cf',
          t: '\\xbf65ee06b43b9ca718216241f0b9f81b5ff30cc1',
          v: 0,
          tx_hash: '\\xc283f8867727a615fd61c58a97b03afb76004c809bf53248f2130eb9a09ea952',
          log_addr: '\\x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
          block_num: '15164540',
          tx_idx: '0',
          log_idx: '2',
        },
        expected: {
          f: '0x760E2928C3aa3aF87897bE52eb4833d42bbB27cf',
          t: '0xbf65EE06b43B9cA718216241f0b9F81b5ff30CC1',
          v: 0n,
          tx_hash: '0xc283f8867727a615fd61c58a97b03afb76004c809bf53248f2130eb9a09ea952',
          log_addr: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
          block_num: 15164540n,
          tx_idx: 0n,
          log_idx: 2n,
          coin: {
            coingeckoTokenId: 'usd-coin',
            decimals: 6,
            label: 'USDC',
            symbol: 'USDC',
            token: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
          },
        },
      },
    ]
    for (const { input, expected } of cases) {
      const result = TransferDataSchema.safeParse(input)
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
        f: '0xbf65ee06b43b9ca718216241f0b9f81b5ff30cc1',
        t: '0x760e2928c3aa3af87897be52eb4833d42bbb27cf',
        v: '5528761',
        tx_hash: '0xc283f8867727a615fd61c58a97b03afb76004c809bf53248f2130eb9a09ea952',
        log_addr: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
        block_num: '15164540',
        tx_idx: '0',
        log_idx: '2',
      },
      {
        f: '0xbf65ee06b43b9ca718216241f0b9f81b5ff30cc1',
        t: '0x760e2928c3aa3af87897be52eb4833d42bbb27cf',
        // v: 5528761,
        tx_hash: '0xc283f8867727a615fd61c58a97b03afb76004c809bf53248f2130eb9a09ea952',
        log_addr: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
        block_num: '15164540',
        tx_idx: '0',
        log_idx: '2',
      },
      {
        f: '0xbf65ee06b43b9ca718216241f0b9f81b5ff30cc1',
        t: '0x760e2928c3aa3af87897be52eb4833d42bbb27cf',
        v: 0,
        tx_hash: '0xc283f8867727a615fd61c58a97b03afb76004c809bf53248f2130eb9a09ea952',
        log_addr: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
        block_num: '15164540',
        tx_idx: '0',
        log_idx: '2',
      },
      {},
    ]
    for (const input of cases) {
      const result = TransferDataSchema.safeParse(input)
      if (result.success) {
        console.log('success', result)
      }
      assert(result.success === false)
    }
  })
})
