import { describe, expect, it } from '@jest/globals'
import {
  counterpart,
  amountFromActivity,
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
} from 'app/features/activity/utils/__mocks__/mock-activity-feed'
import { byteaToHexEthAddress } from './zod'
import { EventSchema } from './zod/activity'
import { tokenPaymasterAddress } from '@my/wagmi'
import { assert } from './assert'

jest.mock('@my/wagmi')

describe('test amountFromActivity', () => {
  it('should return the amount of the activity', () => {
    expect(amountFromActivity(EventSchema.parse(mockReceivedTransfer))).toBe('0.019032 USDC')
    expect(amountFromActivity(EventSchema.parse(mockSentTransfer))).toBe('0.077777 USDC')
  })
})

describe('test eventNameFromActivity', () => {
  it('should return the received when transfer and to user ID is present', () => {
    const activity = mockReceivedTransfer
    expect(eventNameFromActivity(EventSchema.parse(activity))).toBe('Deposit')
  })
  it('should return the received when received eth and to user ID is present', () => {
    const activity = mockSendAccountReceive
    expect(eventNameFromActivity(EventSchema.parse(activity))).toBe('Received')
  })
  it('should return the sent when received eth and from user ID is present', () => {
    const activity = { ...mockSendAccountReceive }
    // @ts-expect-error mock
    activity.from_user = { ...activity.from_user, id: '1234' }
    // @ts-expect-error mock
    activity.to_user = { ...activity.to_user, id: null }
    expect(eventNameFromActivity(EventSchema.parse(activity))).toBe('Sent')
  })
  it('should return the sent when transfer and from user ID is present', () => {
    const activity = mockSentTransfer
    expect(eventNameFromActivity(EventSchema.parse(activity))).toBe('Sent')
  })
  it('should return the sendtag registered when tag receipts event', () => {
    const activity = mockTagReceipt
    expect(eventNameFromActivity(EventSchema.parse(activity))).toBe('Sendtag Registered')
  })
  it('should return the referral when referrals event', () => {
    const activity = mockReferral
    expect(eventNameFromActivity(EventSchema.parse(activity))).toBe('Referral')
  })
  it('should return I Am Rick James when unknown event name equals i_am_rick_james', () => {
    const activity = MockActivityFeed[4]
    expect(
      eventNameFromActivity({ ...EventSchema.parse(activity), event_name: 'i_am_rick_james' })
    ).toBe('I Am Rick James')
  })
  it('should return Referral Reward when send_account_transfer from SendtagCheckout contract', () => {
    const activity = mockSendtagReferralRewardUSDC
    const _activity = EventSchema.parse(activity)
    expect(eventNameFromActivity(_activity)).toBe('Referral Reward')
  })
})

describe('test subtextFromActivity', () => {
  it('should return the address when transfer and to user ID is present and no from user ID', () => {
    expect(subtextFromActivity(EventSchema.parse(mockReceivedTransfer))).toBe(
      byteaToHexEthAddress.parse(mockReceivedTransfer.data.f)
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
    const activity = mockReferral
    expect(subtextFromActivity(EventSchema.parse(activity))).toBe('/disconnect_whorl7351')
  })
  it('should return Paymaster when sent to paymaster', () => {
    const activity = mockSentTransfer
    // @ts-expect-error mock
    activity.to_user = null
    const anyPaymaster = Object.values(tokenPaymasterAddress)[0]
    assert(!!anyPaymaster, 'anyPaymaster not found')
    activity.data.t = anyPaymaster
    expect(subtextFromActivity(EventSchema.parse(activity))).toBe('Paymaster')
  })
  it('should return Paymaster when received from paymaster', () => {
    const activity = mockReceivedTransfer
    activity.from_user = null
    const anyPaymaster = Object.values(tokenPaymasterAddress)[0]
    assert(!!anyPaymaster, 'anyPaymaster not found')
    activity.data.f = anyPaymaster
    expect(subtextFromActivity(EventSchema.parse(activity))).toBe('Paymaster')
  })
  it('should return Sendtag Checkout when received from SendtagCheckout contract', () => {
    const activity = mockSendtagReferralRewardUSDC
    expect(subtextFromActivity(EventSchema.parse(activity))).toBe('Sendtag Checkout')
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
