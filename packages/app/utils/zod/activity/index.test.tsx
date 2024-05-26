import { describe, expect, it } from '@jest/globals'
import { assert } from 'app/utils/assert'
import { EventArraySchema } from '.'
import type { SendAccountTransfersEvent } from './SendAccountTransfersEventSchema'
import type { TagReceiptsEvent } from './TagReceiptsEventSchema'
import { MockActivityFeed } from 'app/features/activity/utils/__mocks__/useActivityFeed'

describe('EventArraySchema', () => {
  it('should parse a valid event array', () => {
    const result = EventArraySchema.safeParse(MockActivityFeed)
    if (!result.success) {
      console.log('failed', result.error)
    }
    assert(result.success === true)
    expect(result.data).toMatchSnapshot()
    expect(result.data).toHaveLength(2)
    assert(result.data.length === 2)
    const transfer = result.data[0] as SendAccountTransfersEvent
    assert(!!transfer)
    expect(transfer.event_name).toBe('send_account_transfers')
    expect(transfer.created_at).toBeInstanceOf(Date)
    expect(transfer.from_user).toBeNull()
    expect(transfer.to_user).not.toBeNull()
    expect(transfer.data.f).toBe('0x760e2928c3aa3af87897be52eb4833d42bbb27cf')
    expect(transfer.data.t).toBe('0xbf65ee06b43b9ca718216241f0b9f81b5ff30cc1')
    expect(transfer.data.v).toBe(19032n)
    expect(transfer.data.tx_hash).toBe(
      '0xf1443b5abd14e6212dda2d9f5ff1d1d691599de3e8fa019ccc19b909d9bb46a4'
    )
    expect(transfer.data.coin?.label).toBe('USDC')
    const receipt = result.data[1] as TagReceiptsEvent
    assert(!!receipt)
    expect(receipt.event_name).toBe('tag_receipts')
    expect(receipt.created_at).toBeInstanceOf(Date)
    expect(receipt.from_user).not.toBeNull()
    expect(receipt.to_user).toBeNull()
    expect(receipt.data.tags).toEqual(['yuw'])
    expect(receipt.data.value).toBe(20000000000000000n)
    expect(receipt.data.tx_hash).toBe(
      '0x37c4281422413a3a78e765452c47abb5c3a95c102282bdd3632ced0b640d861c'
    )
  })
})
