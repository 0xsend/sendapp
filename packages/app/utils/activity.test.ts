import { describe, expect, it } from '@jest/globals'
import {
  phraseFromActivity,
  amountFromActivity,
  counterpart,
  eventNameFromActivity,
  subtextFromActivity,
} from './activity'

import {
  MockActivityFeed,
  mockReceivedTransfer,
  mockReferral,
  mockSendAccountReceive,
  mockSendtagReferralRewardUSDC,
  mockSentTransfer,
  mockTagReceipt,
  mockSendTokenUpgradeEvent,
} from 'app/features/activity/utils/__mocks__/mock-activity-feed'
import { byteaToHexEthAddress } from './zod'
import { EventSchema } from './zod/activity'
import { tokenPaymasterAddress } from '@my/wagmi'
import { assert } from './assert'
import { shorten } from './strings'
import { hexToBytea } from './hexToBytea'

jest.mock('@my/wagmi')

describe('test amountFromActivity', () => {
  it('should return the amount of the activity', () => {
    expect(amountFromActivity(EventSchema.parse(mockReceivedTransfer))).toBe('0.019032 USDC')
    expect(amountFromActivity(EventSchema.parse(mockSentTransfer))).toBe('0.077777 USDC')
  })
})

describe('test eventNameFromActivity', () => {
  it('should return the received when transfer and to user ID is present', () => {
    const activity = JSON.parse(JSON.stringify(mockReceivedTransfer))
    expect(eventNameFromActivity(EventSchema.parse(activity))).toBe('Deposit')
  })
  it('should return the received when received eth and to user ID is present', () => {
    const activity = JSON.parse(JSON.stringify(mockSendAccountReceive))
    expect(eventNameFromActivity(EventSchema.parse(activity))).toBe('Received')
  })
  it('should return the sent when received eth and from user ID is present', () => {
    const activity = JSON.parse(JSON.stringify({ ...mockSendAccountReceive }))
    activity.from_user = { ...activity.from_user, id: '1234' }
    activity.to_user = { ...activity.to_user, id: null }
    expect(eventNameFromActivity(EventSchema.parse(activity))).toBe('Sent')
  })
  it('should return the sent when transfer and from user ID is present', () => {
    const activity = JSON.parse(JSON.stringify(mockSentTransfer))
    expect(eventNameFromActivity(EventSchema.parse(activity))).toBe('Sent')
  })
  it('should return the sendtag registered when tag receipts event', () => {
    const activity = JSON.parse(JSON.stringify(mockTagReceipt))
    expect(eventNameFromActivity(EventSchema.parse(activity))).toBe('Sendtag Registered')
  })
  it('should return the referral when referrals event', () => {
    const activity = JSON.parse(JSON.stringify(mockReferral))
    expect(eventNameFromActivity(EventSchema.parse(activity))).toBe('Referral')
  })
  it('should return I Am Rick James when unknown event name equals i_am_rick_james', () => {
    const activity = JSON.parse(JSON.stringify(MockActivityFeed[4]))
    expect(
      eventNameFromActivity({ ...EventSchema.parse(activity), event_name: 'i_am_rick_james' })
    ).toBe('I Am Rick James')
  })
  it('should return Referral Reward when send_account_transfer from SendtagCheckout contract', () => {
    const activity = JSON.parse(JSON.stringify(mockSendtagReferralRewardUSDC))
    const _activity = EventSchema.parse(activity)
    expect(eventNameFromActivity(_activity)).toBe('Referral Reward')
  })
})

describe('phraseFromActivity', () => {
  it('should return "Deposited" when transfer and to user ID is present', () => {
    expect(phraseFromActivity(EventSchema.parse(mockReceivedTransfer))).toBe('Deposited')
  })

  it('should return "Sent" when received eth and to user ID is present', () => {
    expect(phraseFromActivity(EventSchema.parse(mockSendAccountReceive))).toBe('Sent you')
  })

  it('should return "Received" when received eth and from user ID is present', () => {
    const activity = JSON.parse(JSON.stringify({ ...mockSendAccountReceive }))
    activity.from_user = { ...activity.from_user, id: '1234' }
    activity.to_user = { ...activity.to_user, id: null }
    expect(phraseFromActivity(EventSchema.parse(activity))).toBe('Received')
  })

  it('should return "Received" when transfer and from user ID is present', () => {
    expect(phraseFromActivity(EventSchema.parse(mockSentTransfer))).toBe('Received')
  })

  it('should return "Sendtag created" when tag receipts event', () => {
    expect(phraseFromActivity(EventSchema.parse(mockTagReceipt))).toBe('Sendtag created')
  })

  it('should return "Referred" when referrals event', () => {
    expect(phraseFromActivity(EventSchema.parse(mockReferral))).toBe('Referred')
  })

  it('should return "I am rick james" when unknown event name equals i_am_rick_james', () => {
    const activity = JSON.parse(JSON.stringify(MockActivityFeed[4]))
    expect(
      phraseFromActivity({
        ...EventSchema.parse(activity),
        event_name: 'i_am_rick_james',
      })
    ).toBe('I am rick james')
  })

  it('should return "Earned referral reward" when send_account_transfer from SendtagCheckout contract', () => {
    const _activity = EventSchema.parse(mockSendtagReferralRewardUSDC)
    expect(phraseFromActivity(_activity)).toBe('Earned referral reward')
  })
})

describe('test subtextFromActivity', () => {
  it('should return the address when transfer and to user ID is present and no from user ID', () => {
    expect(subtextFromActivity(EventSchema.parse(mockReceivedTransfer))).toBe(
      shorten(byteaToHexEthAddress.parse(mockReceivedTransfer.data.f), 5, 4)
    )
  })
  it('should return the to user tags when transfer and from user ID is present', () => {
    expect(subtextFromActivity(EventSchema.parse(mockSentTransfer))).toEqual(
      `/${mockSentTransfer.to_user.tags[0]}`
    )
  })
  it('should return the tags when tag receipts event', () => {
    expect(subtextFromActivity(EventSchema.parse(mockTagReceipt))).toEqual(
      `/${mockTagReceipt.data.tags[0]}`
    )
  })
  it('should return the referrals when referrals event', () => {
    const activity = JSON.parse(JSON.stringify(mockReferral))
    expect(subtextFromActivity(EventSchema.parse(activity))).toBe('/disconnect_whorl7351')
  })
  it('should return Paymaster when sent to paymaster', () => {
    const activity = JSON.parse(JSON.stringify(mockSentTransfer))
    activity.to_user = null
    const anyPaymaster = Object.values(tokenPaymasterAddress)[0]
    assert(!!anyPaymaster, 'anyPaymaster not found')
    activity.data.t = hexToBytea(anyPaymaster)
    console.log(EventSchema.parse(activity))
    expect(subtextFromActivity(EventSchema.parse(activity))).toBe('Paymaster')
  })
  it('should return Paymaster when received from paymaster', () => {
    const activity = JSON.parse(JSON.stringify(mockReceivedTransfer))
    activity.from_user = null
    const anyPaymaster = Object.values(tokenPaymasterAddress)[0]
    assert(!!anyPaymaster, 'anyPaymaster not found')
    activity.data.f = hexToBytea(anyPaymaster)
    expect(subtextFromActivity(EventSchema.parse(activity))).toBe('Paymaster')
  })
  it('should return Sendtag Checkout when received from SendtagCheckout contract', () => {
    const activity = JSON.parse(JSON.stringify(mockSendtagReferralRewardUSDC))
    expect(subtextFromActivity(EventSchema.parse(activity))).toBe('Sendtag Checkout')
  })
  it('should return upgraded amount when mint of new Send Token V1', () => {
    const activity = JSON.parse(JSON.stringify(mockSendTokenUpgradeEvent))
    expect(subtextFromActivity(EventSchema.parse(activity))).toBe('1M -> 10,000')
  })
})

describe('test userFromActivity', () => {
  it('should return the from user when transfer and to user ID is present', () => {
    expect(counterpart(EventSchema.parse(mockReceivedTransfer))).toEqual(
      mockReceivedTransfer.from_user
    )
  })
  it('should return the to user when transfer and from user ID is present', () => {
    expect(counterpart(EventSchema.parse(mockSentTransfer))).toEqual(mockSentTransfer.to_user)
  })
  it('should return the from user when tag receipts event', () => {
    expect(counterpart(EventSchema.parse(mockTagReceipt))).toEqual(mockTagReceipt.from_user)
  })
  it('should return the to user when referrals event', () => {
    expect(counterpart(EventSchema.parse(mockReferral))).toEqual(mockReferral.to_user)
  })
})
