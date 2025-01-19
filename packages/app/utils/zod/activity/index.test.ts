import { describe, expect, it } from '@jest/globals'
import { assert } from 'app/utils/assert'
import { EventArraySchema, type BaseEvent } from '.'
import type { SendAccountTransfersEvent } from './SendAccountTransfersEventSchema'
import type { TagReceiptsEvent } from './TagReceiptsEventSchema'
import { MockActivityFeed } from 'app/features/activity/utils/__mocks__/mock-activity-feed'
import type { ReferralsEvent } from './ReferralsEventSchema'
import type { SendAccountReceiveEvent } from './SendAccountReceiveEventSchema'
import type { TagReceiptUSDCEvent } from './TagReceiptUSDCEventSchema'
import { ethCoin, sendCoin, usdcCoin } from 'app/data/coins'

describe('EventArraySchema', () => {
  let parsedData: BaseEvent[]

  beforeAll(() => {
    const result = EventArraySchema.safeParse(MockActivityFeed)
    if (!result.success) {
      throw new Error(`Failed to parse MockActivityFeed: ${result.error}`)
    }
    parsedData = result.data
  })

  it('should parse a valid event array', () => {
    expect(parsedData).toMatchSnapshot()
    expect(parsedData).toHaveLength(10)
  })

  describe('SendAccountTransfersEvent', () => {
    let transfer: SendAccountTransfersEvent

    beforeAll(() => {
      transfer = parsedData[0] as SendAccountTransfersEvent
      assert(!!transfer)
    })

    it('should have correct event name and timestamps', () => {
      expect(transfer.event_name).toBe('send_account_transfers')
      expect(transfer.created_at).toBeInstanceOf(Date)
    })

    it('should have correct user data', () => {
      expect(transfer.from_user).toBeNull()
      expect(transfer.to_user).not.toBeNull()
    })

    it('should have correct transfer data', () => {
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
    })
  })

  describe('TagReceiptsEvent', () => {
    let receipt: TagReceiptsEvent

    beforeAll(() => {
      receipt = parsedData[1] as TagReceiptsEvent
      assert(!!receipt)
    })

    it('should have correct event name and timestamps', () => {
      expect(receipt.event_name).toBe('tag_receipts')
      expect(receipt.created_at).toBeInstanceOf(Date)
    })

    it('should have correct user data', () => {
      expect(receipt.from_user).not.toBeNull()
      expect(receipt.to_user).toBeNull()
    })

    it('should have correct receipt data', () => {
      expect(receipt.data.tags).toEqual(['yuw'])
      expect(receipt.data.value).toBe(20000000000000000n)
      expect(receipt.data.tx_hash).toBe(
        '0x37c4281422413a3a78e765452c47abb5c3a95c102282bdd3632ced0b640d861c'
      )
      expect(receipt.data.coin).toEqual(ethCoin)
    })
  })

  describe('TagReceiptUSDCEvent', () => {
    let receipt: TagReceiptUSDCEvent

    beforeAll(() => {
      receipt = parsedData[7] as TagReceiptUSDCEvent
      assert(!!receipt)
    })

    it('should have correct event name and timestamps', () => {
      expect(receipt.event_name).toBe('tag_receipt_usdc')
      expect(receipt.created_at).toBeInstanceOf(Date)
    })

    it('should have correct user data', () => {
      expect(receipt.from_user).not.toBeNull()
      expect(receipt.to_user).toBeNull()
    })

    it('should have correct receipt data', () => {
      expect(receipt.data.tags).toEqual(['tag_receipt_usdc'])
      expect(receipt.data.value).toBe(2000000n)
      expect(receipt.data.tx_hash).toBe(
        '0x37c4281422413a3a78e765452c47abb5c3a95c102282bdd3632ced0b640d861c'
      )
      expect(receipt.data.coin).toEqual(usdcCoin)
    })
  })

  describe('ReferralsEvent', () => {
    let referral: ReferralsEvent

    beforeAll(() => {
      referral = parsedData[2] as ReferralsEvent
      assert(!!referral)
    })

    it('should have correct event name and timestamps', () => {
      expect(referral.event_name).toBe('referrals')
      expect(referral.created_at).toBeInstanceOf(Date)
    })

    it('should have correct user data', () => {
      expect(referral.from_user).not.toBeNull()
      expect(referral.to_user).not.toBeNull()
    })

    it('should have correct referral data', () => {
      expect(referral.data.tags).toEqual(['disconnect_whorl7351'])
    })
  })

  describe('SendAccountSigningKeyAddedEvent', () => {
    let keyAdded: BaseEvent

    beforeAll(() => {
      keyAdded = parsedData[3] as BaseEvent
      assert(!!keyAdded)
    })

    it('should have correct event name and timestamps', () => {
      expect(keyAdded.event_name).toBe('send_account_signing_key_added')
      expect(keyAdded.created_at).toBeInstanceOf(Date)
    })

    it('should have correct user data', () => {
      expect(keyAdded.from_user).not.toBeNull()
      expect(keyAdded.to_user).toBeNull()
    })

    it('should have correct key added data', () => {
      expect(keyAdded.data.account).toBe('\\xa7ded3f6316c7d3b5ae2ed711cf535395db921b1')
      expect(keyAdded.data.key_slot).toBe(0)
      expect(keyAdded.data.key).toEqual([
        '\\x351631d94d8cfc12f6adfc2586111990681f216c7d6d8531e669471293f32f07',
        '\\x83577aa62079c3bb5b813017df43832562d133feb3a7447d28849dac74c8aa43',
      ])
    })
  })

  describe('SendAccountSigningKeyRemovedEvent', () => {
    let keyRemoved: BaseEvent

    beforeAll(() => {
      keyRemoved = parsedData[4] as BaseEvent
      assert(!!keyRemoved)
    })

    it('should have correct event name and timestamps', () => {
      expect(keyRemoved.event_name).toBe('send_account_signing_key_removed')
      expect(keyRemoved.created_at).toBeInstanceOf(Date)
    })

    it('should have correct user data', () => {
      expect(keyRemoved.from_user).not.toBeNull()
      expect(keyRemoved.to_user).toBeNull()
    })

    it('should have correct key removed data', () => {
      expect(keyRemoved.data.account).toBe('\\xa7ded3f6316c7d3b5ae2ed711cf535395db921b1')
      expect(keyRemoved.data.key_slot).toBe(0)
      expect(keyRemoved.data.key).toEqual([
        '\\x351631d94d8cfc12f6adfc2586111990681f216c7d6d8531e669471293f32f07',
        '\\x83577aa62079c3bb5b813017df43832562d133feb3a7447d28849dac74c8aa43',
      ])
    })
  })

  describe('SendAccountReceiveEvent', () => {
    let sendAccountReceive: SendAccountReceiveEvent

    beforeAll(() => {
      sendAccountReceive = parsedData[6] as SendAccountReceiveEvent
      assert(!!sendAccountReceive)
    })

    it('should have correct event name and timestamps', () => {
      expect(sendAccountReceive.event_name).toBe('send_account_receives')
      expect(sendAccountReceive.created_at).toBeInstanceOf(Date)
    })

    it('should have correct user data', () => {
      expect(sendAccountReceive.from_user).not.toBeNull()
      expect(sendAccountReceive.to_user).not.toBeNull()
    })

    it('should have correct receive data', () => {
      expect(sendAccountReceive.data.sender).toBe('0xa0Ee7A142d267C1f36714E4a8F75612F20a79720')
      expect(sendAccountReceive.data.value).toBe(10000000000000000n)
    })
  })

  describe('SendTokenUpgradeEvent', () => {
    let upgrade: SendAccountTransfersEvent

    beforeAll(() => {
      upgrade = parsedData[9] as SendAccountTransfersEvent
      assert(!!upgrade)
    })

    it('should have correct event name and timestamps', () => {
      expect(upgrade.event_name).toBe('send_account_transfers')
      expect(upgrade.created_at).toBeInstanceOf(Date)
    })

    it('should have correct user data', () => {
      expect(upgrade.from_user).toBeNull()
      expect(upgrade.to_user).not.toBeNull()
    })

    it('should have correct upgrade data', () => {
      expect(upgrade.data.f).toBe('0x0000000000000000000000000000000000000000')
      expect(upgrade.data.t).toBe('0x649667EfCcf6497290616e7A669024ffEAF75968')
      expect(upgrade.data.v).toBe(10000000000000000000000n)
      expect(upgrade.data.block_num).toBe(25254355n)
      expect(upgrade.data.tx_idx).toBe(0n)
      expect(upgrade.data.log_idx).toBe(5n)
      expect(upgrade.data.tx_hash).toBe(
        '0xc8e94001e225e3d4570c352a3811de04586c1cfabc8b7c9367d477fcf003424d'
      )
      expect(upgrade.data.coin).toEqual(sendCoin)
    })
  })
})
