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
  mockSentTransfer,
  mockTagReceipt,
} from 'app/features/activity/utils/__mocks__/mock-activity-feed'
import { byteaToHexEthAddress } from './zod'
import { EventSchema } from './zod/activity'

describe('test amountFromActivity', () => {
  it('should return the amount of the activity', () => {
    expect(amountFromActivity(EventSchema.parse(mockReceivedTransfer))).toBe('0.019032 USDC')
    expect(amountFromActivity(EventSchema.parse(mockSentTransfer))).toBe('0.077777 USDC')
  })
})

describe('test eventNameFromActivity', () => {
  it('should return the received when transfer and to user ID is present', () => {
    const activity = MockActivityFeed[0]
    expect(eventNameFromActivity(EventSchema.parse(activity))).toBe('Received')
  })
  it('should return the sent when transfer and from user ID is present', () => {
    const activity = MockActivityFeed[1]
    expect(eventNameFromActivity(EventSchema.parse(activity))).toBe('Sent')
  })
  it('should return the sendtag registered when tag receipts event', () => {
    const activity = MockActivityFeed[2]
    expect(eventNameFromActivity(EventSchema.parse(activity))).toBe('Sendtag Registered')
  })
  it('should return the referral when referrals event', () => {
    const activity = MockActivityFeed[3]
    expect(eventNameFromActivity(EventSchema.parse(activity))).toBe('Referral')
  })
  it('should return I Am Rick James when unknown event name equals i_am_rick_james', () => {
    const activity = MockActivityFeed[4]
    expect(
      eventNameFromActivity({ ...EventSchema.parse(activity), event_name: 'i_am_rick_james' })
    ).toBe('I Am Rick James')
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
      `@${mockSentTransfer.to_user.tags[0]}`
    )
  })
  it('should return the tags when tag receipts event', () => {
    expect(subtextFromActivity(EventSchema.parse(mockTagReceipt))).toEqual(
      `@${mockTagReceipt.data.tags[0]}`
    )
  })
  it('should return the referrals when referrals event', () => {
    const activity = MockActivityFeed[3]
    expect(subtextFromActivity(EventSchema.parse(activity))).toBe('@disconnect_whorl7351')
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
