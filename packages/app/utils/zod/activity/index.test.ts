import { describe, expect, it } from '@jest/globals'
import { TagReceiptsDataSchema } from './TagReceiptsDataSchema'
import { assert } from 'app/utils/assert'
import { EventArraySchema } from '.'
import type { SendAccountTransfersEvent } from './SendAccountTransfersEventSchema'
import type { TagReceiptsEvent } from './TagReceiptsEventSchema'

const data = [
  {
    created_at: '2024-05-26T13:38:25+00:00',
    event_name: 'send_account_transfers',
    from_user: null,
    to_user: {
      id: '97476407-bf7f-4ebe-86aa-c9d18a0b388a',
      name: null,
      avatar_url: null,
      send_id: 65244,
      tags: ['asdf', 'teq', 'yuw'],
    },
    data: {
      f: '\\x760e2928c3aa3af87897be52eb4833d42bbb27cf',
      t: '\\xbf65ee06b43b9ca718216241f0b9f81b5ff30cc1',
      v: 19032,
      tx_hash: '\\xf1443b5abd14e6212dda2d9f5ff1d1d691599de3e8fa019ccc19b909d9bb46a4',
      log_addr: '\\x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
    },
  },
  {
    created_at: '2024-05-26T13:36:07.15651+00:00',
    event_name: 'tag_receipts',
    from_user: {
      id: '97476407-bf7f-4ebe-86aa-c9d18a0b388a',
      name: null,
      avatar_url: null,
      send_id: 65244,
      tags: ['asdf', 'teq', 'yuw'],
    },
    to_user: null,
    data: {
      tags: ['yuw'],
      value: 20000000000000000,
      tx_hash: '\\x37c4281422413a3a78e765452c47abb5c3a95c102282bdd3632ced0b640d861c',
    },
  },
] as const

describe('EventArraySchema', () => {
  it('should parse a valid event array', () => {
    const result = EventArraySchema.safeParse(data)
    if (!result.success) {
      console.log('failed', result.error)
    }
    assert(result.success === true)
    expect(result.data).toMatchSnapshot()
    expect(result.data).toHaveLength(2)
    assert(result.data.length === 2)
    const transfer = result.data[0] as SendAccountTransfersEvent
    console.log('transfer', transfer)
    assert(!!transfer)
    expect(transfer.event_name).toBe('send_account_transfers')
    expect(transfer.from_user).toBeNull()
    expect(transfer.to_user).not.toBeNull()
    expect(transfer.data.f).toBe('0x760e2928c3aa3af87897be52eb4833d42bbb27cf')
    expect(transfer.data.t).toBe('0xbf65ee06b43b9ca718216241f0b9f81b5ff30cc1')
    expect(transfer.data.v).toBe(19032n)
    expect(transfer.data.tx_hash).toBe(
      '0xf1443b5abd14e6212dda2d9f5ff1d1d691599de3e8fa019ccc19b909d9bb46a4'
    )
    const receipt = result.data[1] as TagReceiptsEvent
    assert(!!receipt)
    assert(receipt.event_name === 'tag_receipts')
    assert(receipt.from_user !== null)
    assert(receipt.to_user === null)
    assert(receipt.data.tags[0] === 'yuw')
    assert(receipt.data.value === 20000000000000000n)
    assert(
      receipt.data.tx_hash === '0x37c4281422413a3a78e765452c47abb5c3a95c102282bdd3632ced0b640d861c'
    )
  })
})
