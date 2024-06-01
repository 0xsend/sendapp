import { describe, expect, it } from '@jest/globals'
import { assert } from 'app/utils/assert'
import { EventArraySchema, type BaseEvent } from '.'
import type { SendAccountTransfersEvent } from './SendAccountTransfersEventSchema'
import type { TagReceiptsEvent } from './TagReceiptsEventSchema'
import { MockActivityFeed } from 'app/features/activity/utils/__mocks__/mock-activity-feed'
import type { ReferralsEvent } from './ReferralsEventSchema'

describe('EventArraySchema', () => {
  it('should parse a valid event array', () => {
    const result = EventArraySchema.safeParse(MockActivityFeed)
    if (!result.success) {
      console.log('failed', result.error)
    }
    assert(result.success === true)
    expect(result.data).toMatchSnapshot()
    expect(result.data).toHaveLength(5)
    assert(result.data.length === 5)
    const transfer = result.data[0] as SendAccountTransfersEvent
    assert(!!transfer)
    expect(transfer.event_name).toBe('send_account_transfers')
    expect(transfer.created_at).toBeInstanceOf(Date)
    expect(transfer.from_user).toBeNull()
    expect(transfer.to_user).not.toBeNull()
    expect(transfer.data.f).toBe('0x760E2928C3aa3aF87897bE52eb4833d42bbB27cf')
    expect(transfer.data.t).toBe('0xbf65EE06b43B9cA718216241f0b9F81b5ff30CC1')
    expect(transfer.data.v).toBe(19032n)
    expect(transfer.data.block_num).toBe(15164540n)
    expect(transfer.data.tx_idx).toBe(0n)
    expect(transfer.data.log_idx).toBe(2n)
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
    const referral = result.data[2] as ReferralsEvent
    assert(!!referral)
    expect(referral.event_name).toBe('referrals')
    expect(referral.created_at).toBeInstanceOf(Date)
    expect(referral.from_user).not.toBeNull()
    expect(referral.to_user).not.toBeNull()
    expect(referral.data.tags).toEqual(['disconnect_whorl7351'])
    const keyAdded = result.data[3] as BaseEvent
    assert(!!keyAdded)
    expect(keyAdded.event_name).toBe('send_account_signing_key_added')
    expect(keyAdded.created_at).toBeInstanceOf(Date)
    expect(keyAdded.from_user).not.toBeNull()
    expect(keyAdded.to_user).toBeNull()
    expect(keyAdded.data.account).toBe('\\xa7ded3f6316c7d3b5ae2ed711cf535395db921b1')
    expect(keyAdded.data.key_slot).toBe(0)
    expect(keyAdded.data.key).toEqual([
      '\\x351631d94d8cfc12f6adfc2586111990681f216c7d6d8531e669471293f32f07',
      '\\x83577aa62079c3bb5b813017df43832562d133feb3a7447d28849dac74c8aa43',
    ])
    const keyRemoved = result.data[4] as BaseEvent
    assert(!!keyRemoved)
    expect(keyRemoved.event_name).toBe('send_account_signing_key_removed')
    expect(keyRemoved.created_at).toBeInstanceOf(Date)
    expect(keyRemoved.from_user).not.toBeNull()
    expect(keyRemoved.to_user).toBeNull()
    expect(keyRemoved.data.account).toBe('\\xa7ded3f6316c7d3b5ae2ed711cf535395db921b1')
    expect(keyRemoved.data.key_slot).toBe(0)
    expect(keyRemoved.data.key).toEqual([
      '\\x351631d94d8cfc12f6adfc2586111990681f216c7d6d8531e669471293f32f07',
      '\\x83577aa62079c3bb5b813017df43832562d133feb3a7447d28849dac74c8aa43',
    ])
  })
})
