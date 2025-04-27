import { describe, expect, it, jest } from '@jest/globals'
import {
  amountFromActivity,
  counterpart,
  eventNameFromActivity,
  isActivitySwapTransfer,
  isSwapBuyTransfer,
  isSwapSellTransfer,
  phraseFromActivity,
  subtextFromActivity,
} from './activity'

import {
  MockActivityFeed,
  mockReceivedTransfer,
  mockReferral,
  mockSendAccountReceive,
  mockSendtagReferralRewardUSDC,
  mockSendTokenUpgradeEvent,
  mockSentTransfer,
  mockSwapBuyErc20Transfer,
  mockSwapBuyEthTransfer,
  mockSwapSellErc20Transfer,
  mockTagReceipt,
} from 'app/features/activity/utils/__mocks__/mock-activity-feed'
import { byteaToHexEthAddress } from './zod'
import { type Activity, EventSchema } from './zod/activity'
import { tokenPaymasterAddress } from '@my/wagmi'
import { assert } from './assert'
import { shorten } from './strings'
import { hexToBytea } from './hexToBytea'
import type { SwapRouter } from 'app/utils/zod/SwapRouterSchema'
import type { LiquidityPool } from 'app/utils/zod/LiquidityPoolSchema'

jest.mock('@my/wagmi')

const mockSwapRouters = [
  {
    router_addr: '0x6131b5fae19ea4f9d964eac0408e4408b66337b5' as const,
    created_at: new Date(),
  },
]

const mockLiquidityPools = [
  {
    created_at: new Date(),
    pool_name: 'aerodrome',
    pool_type: 'velodrome',
    pool_addr: '0x69bc1d350fe13f499c6aeded2c5ea9471b2a599a' as const,
  },
]

describe('test amountFromActivity', () => {
  it('should return the amount of the activity', () => {
    expect(amountFromActivity(EventSchema.parse(mockReceivedTransfer))).toBe('0.01 USDC')
    expect(amountFromActivity(EventSchema.parse(mockSentTransfer))).toBe('0.07 USDC')
  })
})

describe('test eventNameFromActivity', () => {
  it('should return the received when transfer and to user ID is present', () => {
    const activity = JSON.parse(JSON.stringify(mockReceivedTransfer))
    expect(eventNameFromActivity({ activity: EventSchema.parse(activity) })).toBe('Deposit')
  })
  it('should return the note when received eth and to user ID is present', () => {
    const activity = JSON.parse(JSON.stringify(mockSendAccountReceive))
    expect(eventNameFromActivity({ activity: EventSchema.parse(activity) })).toBe(
      'Send gonna be $1 someday'
    )
  })
  it('should return the note when received eth and from user ID is present', () => {
    const activity = JSON.parse(JSON.stringify({ ...mockSendAccountReceive }))
    activity.from_user = { ...activity.from_user, id: '1234' }
    activity.to_user = { ...activity.to_user, id: null }
    expect(eventNameFromActivity({ activity: EventSchema.parse(activity) })).toBe(
      'Send gonna be $1 someday'
    )
  })
  it('should return the note when transfer and from user ID is present', () => {
    const activity = JSON.parse(JSON.stringify(mockSentTransfer))
    expect(eventNameFromActivity({ activity: EventSchema.parse(activity) })).toBe(
      'Send gonna be $1 someday'
    )
  })
  it('should return the sendtag registered when tag receipts event', () => {
    const activity = JSON.parse(JSON.stringify(mockTagReceipt))
    expect(eventNameFromActivity({ activity: EventSchema.parse(activity) })).toBe(
      'Sendtag Registered'
    )
  })
  it('should return the referral when referrals event', () => {
    const activity = JSON.parse(JSON.stringify(mockReferral))
    expect(eventNameFromActivity({ activity: EventSchema.parse(activity) })).toBe('Referral')
  })
  it('should return I Am Rick James when unknown event name equals i_am_rick_james', () => {
    const activity = JSON.parse(JSON.stringify(MockActivityFeed[4]))
    expect(
      eventNameFromActivity({
        activity: { ...EventSchema.parse(activity), event_name: 'i_am_rick_james' },
      })
    ).toBe('I Am Rick James')
  })
  it('should return Revenue Share when send_account_transfer from SendtagCheckout contract', () => {
    const activity = JSON.parse(JSON.stringify(mockSendtagReferralRewardUSDC))
    const _activity = EventSchema.parse(activity)
    expect(eventNameFromActivity({ activity: _activity })).toBe('Revenue Share')
  })
  it('should return "Trade" when withdrawal address is swap router or liquidity pool', () => {
    const activity = JSON.parse(JSON.stringify(mockSwapSellErc20Transfer))
    expect(
      eventNameFromActivity({
        activity: EventSchema.parse(activity),
        swapRouters: mockSwapRouters,
        liquidityPools: mockLiquidityPools,
      })
    ).toBe('Trade')
  })
  it('should return "Trade" when erc20 deposit address is swap router or liquidity pool', () => {
    const activity = JSON.parse(JSON.stringify(mockSwapBuyErc20Transfer))
    expect(
      eventNameFromActivity({
        activity: EventSchema.parse(activity),
        swapRouters: mockSwapRouters,
        liquidityPools: mockLiquidityPools,
      })
    ).toBe('Trade')
  })
  it('should return "Trade" when eth deposit address is swap router or liquidity pool', () => {
    const activity = JSON.parse(JSON.stringify(mockSwapBuyEthTransfer))
    expect(
      eventNameFromActivity({
        activity: EventSchema.parse(activity),
        swapRouters: mockSwapRouters,
        liquidityPools: mockLiquidityPools,
      })
    ).toBe('Trade')
  })
})

describe('phraseFromActivity', () => {
  it('should return "Deposited" when transfer and to user ID is present', () => {
    expect(phraseFromActivity({ activity: EventSchema.parse(mockReceivedTransfer) })).toBe(
      'Deposited'
    )
  })

  it('should return "Sent" when received eth and to user ID is present', () => {
    expect(phraseFromActivity({ activity: EventSchema.parse(mockSendAccountReceive) })).toBe(
      'Sent you'
    )
  })

  it('should return "Received" when received eth and from user ID is present', () => {
    const activity = JSON.parse(JSON.stringify({ ...mockSendAccountReceive }))
    activity.from_user = { ...activity.from_user, id: '1234' }
    activity.to_user = { ...activity.to_user, id: null }
    expect(phraseFromActivity({ activity: EventSchema.parse(activity) })).toBe('Received')
  })

  it('should return "Received" when transfer and from user ID is present', () => {
    expect(phraseFromActivity({ activity: EventSchema.parse(mockSentTransfer) })).toBe('Received')
  })

  it('should return "Sendtag created" when tag receipts event', () => {
    expect(phraseFromActivity({ activity: EventSchema.parse(mockTagReceipt) })).toBe(
      'Sendtag created'
    )
  })

  it('should return "Referred" when referrals event', () => {
    expect(phraseFromActivity({ activity: EventSchema.parse(mockReferral) })).toBe('Referred')
  })

  it('should return "I am rick james" when unknown event name equals i_am_rick_james', () => {
    const activity = JSON.parse(JSON.stringify(MockActivityFeed[4]))
    expect(
      phraseFromActivity({
        activity: {
          ...EventSchema.parse(activity),
          event_name: 'i_am_rick_james',
        },
      })
    ).toBe('I am rick james')
  })

  it('should return "Earned revenue share" when send_account_transfer from SendtagCheckout contract', () => {
    const _activity = EventSchema.parse(mockSendtagReferralRewardUSDC)
    expect(phraseFromActivity({ activity: _activity })).toBe('Earned revenue share')
  })

  it('should return "Trade" when withdrawal address is swap router or liquidity pool', () => {
    expect(
      phraseFromActivity({
        activity: EventSchema.parse(mockSwapSellErc20Transfer),
        swapRouters: mockSwapRouters,
        liquidityPools: mockLiquidityPools,
      })
    ).toBe('Trade')
  })

  it('should return "Trade" when erc20 deposit address is swap router or liquidity pool', () => {
    const activity = JSON.parse(JSON.stringify(mockSwapBuyErc20Transfer))
    expect(
      phraseFromActivity({
        activity: EventSchema.parse(activity),
        swapRouters: mockSwapRouters,
        liquidityPools: mockLiquidityPools,
      })
    ).toBe('Trade')
  })

  it('should return "Trade" when eth deposit address is swap router or liquidity pool', () => {
    const activity = JSON.parse(JSON.stringify(mockSwapBuyEthTransfer))
    expect(
      phraseFromActivity({
        activity: EventSchema.parse(activity),
        swapRouters: mockSwapRouters,
        liquidityPools: mockLiquidityPools,
      })
    ).toBe('Trade')
  })
})

describe('test subtextFromActivity', () => {
  it('should return the address when transfer and to user ID is present and no from user ID', () => {
    expect(subtextFromActivity({ activity: EventSchema.parse(mockReceivedTransfer) })).toBe(
      shorten(byteaToHexEthAddress.parse(mockReceivedTransfer.data.f), 5, 4)
    )
  })
  it('should return the to user tags when transfer and from user ID is present', () => {
    expect(subtextFromActivity({ activity: EventSchema.parse(mockSentTransfer) })).toEqual(
      `/${mockSentTransfer.to_user.tags[0]}`
    )
  })
  it('should return the tags when tag receipts event', () => {
    expect(subtextFromActivity({ activity: EventSchema.parse(mockTagReceipt) })).toEqual(
      `/${mockTagReceipt.data.tags[0]}`
    )
  })
  it('should return the referrals when referrals event', () => {
    const activity = JSON.parse(JSON.stringify(mockReferral))
    expect(subtextFromActivity({ activity: EventSchema.parse(activity) })).toBe(
      '/disconnect_whorl7351'
    )
  })
  it('should return Paymaster when sent to paymaster', () => {
    const activity = JSON.parse(JSON.stringify(mockSentTransfer))
    activity.to_user = null
    const anyPaymaster = Object.values(tokenPaymasterAddress)[0]
    assert(!!anyPaymaster, 'anyPaymaster not found')
    activity.data.t = hexToBytea(anyPaymaster)
    expect(subtextFromActivity({ activity: EventSchema.parse(activity) })).toBe('Paymaster')
  })
  it('should return Paymaster when received from paymaster', () => {
    const activity = JSON.parse(JSON.stringify(mockReceivedTransfer))
    activity.from_user = null
    const anyPaymaster = Object.values(tokenPaymasterAddress)[0]
    assert(!!anyPaymaster, 'anyPaymaster not found')
    activity.data.f = hexToBytea(anyPaymaster)
    expect(subtextFromActivity({ activity: EventSchema.parse(activity) })).toBe('Paymaster')
  })
  it('should return Sendtags when received from SendtagCheckout contract', () => {
    const activity = JSON.parse(JSON.stringify(mockSendtagReferralRewardUSDC))
    expect(subtextFromActivity({ activity: EventSchema.parse(activity) })).toBe('Sendtags')
  })
  it('should return upgraded amount when mint of new Send Token V1', () => {
    const activity = JSON.parse(JSON.stringify(mockSendTokenUpgradeEvent))
    expect(subtextFromActivity({ activity: EventSchema.parse(activity) })).toBe('1M -> 10,000')
  })
  it('should return coin when withdrawal address is swap router or liquidity pool', () => {
    expect(
      subtextFromActivity({
        activity: EventSchema.parse(mockSwapSellErc20Transfer),
        swapRouters: mockSwapRouters,
        liquidityPools: mockLiquidityPools,
      })
    ).toBe('USDC')
  })
  it('should return coin when erc20 deposit address is swap router or liquidity pool', () => {
    const activity = JSON.parse(JSON.stringify(mockSwapBuyErc20Transfer))
    expect(
      subtextFromActivity({
        activity: EventSchema.parse(activity),
        swapRouters: mockSwapRouters,
        liquidityPools: mockLiquidityPools,
      })
    ).toBe('USDC')
  })
  it('should return coin when eth deposit address is swap router or liquidity pool', () => {
    const activity = JSON.parse(JSON.stringify(mockSwapBuyEthTransfer))
    expect(
      subtextFromActivity({
        activity: EventSchema.parse(activity),
        swapRouters: mockSwapRouters,
        liquidityPools: mockLiquidityPools,
      })
    ).toBe('ETH')
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

describe('isSwapBuyTransfer', () => {
  const swapRouters = [
    { router_addr: '0x5b8B88f0A15c27B7C1ecf78aFfD6e7f4C54b96F0' },
    { router_addr: '0x9e64D7edFd8B1b1eBDf20e4e60d070A6A4d0e3A6' },
  ] as unknown as SwapRouter[]

  let activity: Activity

  it('should return true if sender address matches a swap router address (ETH)', () => {
    activity = {
      data: {
        sender: '0x5b8B88f0A15c27B7C1ecf78aFfD6e7f4C54b96F0',
        f: '0x0000000000000000000000000000000000000000',
      },
    } as Activity

    const result = isSwapBuyTransfer(activity, swapRouters)
    expect(result).toBe(true)
  })

  it('should return true if f address matches a swap router address (ERC-20)', () => {
    activity = {
      data: {
        sender: '0x0000000000000000000000000000000000000000',
        f: '0x9e64D7edFd8B1b1eBDf20e4e60d070A6A4d0e3A6',
      },
    } as Activity

    const result = isSwapBuyTransfer(activity, swapRouters)
    expect(result).toBe(true)
  })

  it('should return false if neither sender nor f address matches a swap router address', () => {
    activity = {
      data: {
        sender: '0x0000000000000000000000000000000000000000',
        f: '0x0000000000000000000000000000000000000000',
      },
    } as Activity

    const result = isSwapBuyTransfer(activity, swapRouters)
    expect(result).toBe(false)
  })

  it('should return false if activity has no sender or f address', () => {
    activity = {
      data: {
        sender: undefined,
        f: undefined,
      },
    } as Activity

    const result = isSwapBuyTransfer(activity, swapRouters)
    expect(result).toBe(false)
  })

  it('should return false if no swapRouters are provided', () => {
    activity = {
      data: {
        sender: '0x5b8B88f0A15c27B7C1ecf78aFfD6e7f4C54b96F0',
        f: '0x0000000000000000000000000000000000000000',
      },
    } as Activity

    const result = isSwapBuyTransfer(activity, [])
    expect(result).toBe(false)
  })

  it('should return true if sender address matches a swap router address even when no f address is provided', () => {
    activity = {
      data: {
        sender: '0x5b8B88f0A15c27B7C1ecf78aFfD6e7f4C54b96F0',
        f: undefined,
      },
    } as Activity

    const result = isSwapBuyTransfer(activity, swapRouters)
    expect(result).toBe(true)
  })
})

describe('isSwapSellTransfer', () => {
  const swapRouters = [
    { router_addr: '0x5b8B88f0A15c27B7C1ecf78aFfD6e7f4C54b96F0' },
    { router_addr: '0x9e64D7edFd8B1b1eBDf20e4e60d070A6A4d0e3A6' },
  ] as unknown as SwapRouter[]

  const liquidityPools = [
    { pool_addr: '0x3dC60B7fF5F4E4B4462A2B755B96eB8a12A3d2B8' },
    { pool_addr: '0x4b89D6b4592B828Fd000fC489Bc6D7fDf4b72227' },
  ] as unknown as LiquidityPool[]

  let activity: Activity

  it('should return true if t address matches a liquidity pool address', () => {
    activity = {
      data: {
        t: '0x3dC60B7fF5F4E4B4462A2B755B96eB8a12A3d2B8',
      },
    } as Activity

    const result = isSwapSellTransfer(activity, swapRouters, liquidityPools)
    expect(result).toBe(true)
  })

  it('should return true if t address matches a swap router address', () => {
    activity = {
      data: {
        t: '0x5b8B88f0A15c27B7C1ecf78aFfD6e7f4C54b96F0',
      },
    } as Activity

    const result = isSwapSellTransfer(activity, swapRouters, liquidityPools)
    expect(result).toBe(true)
  })

  it('should return false if t address does not match any liquidity pool or swap router address', () => {
    activity = {
      data: {
        t: '0x0000000000000000000000000000000000000000',
      },
    } as Activity

    const result = isSwapSellTransfer(activity, swapRouters, liquidityPools)
    expect(result).toBe(false)
  })

  it('should return false if t address is not provided', () => {
    activity = {
      data: {
        t: undefined,
      },
    } as Activity

    const result = isSwapSellTransfer(activity, swapRouters, liquidityPools)
    expect(result).toBe(false)
  })

  it('should return false if no swapRouters and no liquidityPools are provided', () => {
    activity = {
      data: {
        t: '0x5b8B88f0A15c27B7C1ecf78aFfD6e7f4C54b96F0',
      },
    } as Activity

    const result = isSwapSellTransfer(activity, [], [])
    expect(result).toBe(false)
  })

  it('should return true if t address matches a liquidity pool address even if no swap routers are provided', () => {
    activity = {
      data: {
        t: '0x3dC60B7fF5F4E4B4462A2B755B96eB8a12A3d2B8',
      },
    } as Activity

    const result = isSwapSellTransfer(activity, [], liquidityPools)
    expect(result).toBe(true)
  })

  it('should return true if t address matches a swap router address even if no liquidity pools are provided', () => {
    activity = {
      data: {
        t: '0x9e64D7edFd8B1b1eBDf20e4e60d070A6A4d0e3A6',
      },
    } as Activity

    const result = isSwapSellTransfer(activity, swapRouters, [])
    expect(result).toBe(true)
  })
})

describe('isActivitySwapTransfer', () => {
  const swapRouters = [
    { router_addr: '0x5b8B88f0A15c27B7C1ecf78aFfD6e7f4C54b96F0' },
    { router_addr: '0x9e64D7edFd8B1b1eBDf20e4e60d070A6A4d0e3A6' },
  ] as unknown as SwapRouter[]

  const liquidityPools = [
    { pool_addr: '0x3dC60B7fF5F4E4B4462A2B755B96eB8a12A3d2B8' },
    { pool_addr: '0x4b89D6b4592B828Fd000fC489Bc6D7fDf4b72227' },
  ] as unknown as LiquidityPool[]

  let activity: Activity

  it('should return true if isSwapBuyTransfer returns true', () => {
    activity = {
      data: {
        sender: '0x5b8B88f0A15c27B7C1ecf78aFfD6e7f4C54b96F0',
      },
    } as Activity

    const result = isActivitySwapTransfer(activity, swapRouters, liquidityPools)
    expect(result).toBe(true)
  })

  it('should return true if isSwapSellTransfer returns true', () => {
    activity = {
      data: {
        t: '0x3dC60B7fF5F4E4B4462A2B755B96eB8a12A3d2B8',
      },
    } as Activity

    const result = isActivitySwapTransfer(activity, swapRouters, liquidityPools)
    expect(result).toBe(true)
  })

  it('should return false if neither isSwapBuyTransfer nor isSwapSellTransfer return true', () => {
    activity = {
      data: {
        sender: '0x0000000000000000000000000000000000000000',
        t: '0x0000000000000000000000000000000000000000',
      },
    } as Activity

    const result = isActivitySwapTransfer(activity, swapRouters, liquidityPools)
    expect(result).toBe(false)
  })

  it('should return false if no swapRouters or liquidityPools are provided', () => {
    activity = {
      data: {
        sender: '0x5b8B88f0A15c27B7C1ecf78aFfD6e7f4C54b96F0',
      },
    } as Activity

    const result = isActivitySwapTransfer(activity, [], [])
    expect(result).toBe(false)
  })

  it('should return false if neither isSwapBuyTransfer nor isSwapSellTransfer is true (no t or sender address)', () => {
    activity = {
      data: {
        sender: undefined,
        t: undefined,
      },
    } as Activity

    const result = isActivitySwapTransfer(activity, swapRouters, liquidityPools)
    expect(result).toBe(false)
  })
})
