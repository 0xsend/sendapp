/**
 * Transform raw Activity data into typed ActivityRow items.
 * All heavy computation happens here - row components just render.
 */

import type { TFunction } from 'i18next'
import type { Activity } from 'app/utils/zod/activity'
import type { SwapRouter } from 'app/utils/zod/SwapRouterSchema'
import type { LiquidityPool } from 'app/utils/zod/LiquidityPoolSchema'
import type { AddressBook } from 'app/utils/useAddressBook'
import type {
  ActivityRow,
  UserTransferRow,
  SwapRow,
  SendpotRow,
  SendcheckRow,
  EarnRow,
  ExternalRow,
  UpgradeRow,
  TagReceiptRow,
  ReferralRow,
  SigningKeyRow,
  HeaderRow,
} from './activityRowTypes'
import { counterpart, userNameFromActivityUser, noteFromActivity } from 'app/utils/activity'
import {
  isTemporalEthTransfersEvent,
  isTemporalTokenTransfersEvent,
  temporalEventNameFromStatus,
} from 'app/utils/zod/activity/TemporalTransfersEventSchema'
import {
  isSendEarnDepositEvent,
  isSendEarnWithdrawEvent,
  isTemporalSendEarnDepositEvent,
  isTagReceiptsEvent,
  isTagReceiptUSDCEvent,
  isReferralsEvent,
} from 'app/utils/zod/activity'
import {
  isSendAccountTransfersEvent,
  isSendTokenUpgradeEvent,
} from 'app/utils/zod/activity/SendAccountTransfersEventSchema'
import { isSendAccountReceiveEvent } from 'app/utils/zod/activity/SendAccountReceiveEventSchema'
import formatAmount from 'app/utils/formatAmount'
import { formatUnits } from 'viem'
import { SENDPOT_CONTRACT_ADDRESS, calculateTicketsFromWei } from 'app/data/sendpot'
import {
  baseMainnet,
  sendCheckAddress,
  sendtagCheckoutAddress,
  sendTokenV0Address,
} from '@my/wagmi'
import { sendCoin, sendV0Coin } from 'app/data/coins'
import { shorten } from 'app/utils/strings'
import { ContractLabels } from 'app/data/contract-labels'

export interface TransformContext {
  t: TFunction<'activity'>
  locale: string
  swapRouters: SwapRouter[] | undefined
  liquidityPools: LiquidityPool[] | undefined
  addressBook: AddressBook | undefined
}

interface GroupedActivities {
  title: string
  activities: Activity[]
}

/**
 * Label an address using addressBook lookup or shorten it
 */
function labelAddress(address: string, addressBook: AddressBook | undefined): string {
  if (addressBook && address in addressBook) {
    return addressBook[address] ?? shorten(address, 5, 4)
  }
  return shorten(address, 5, 4)
}

/**
 * Pre-computed addresses and sets for fast lookups
 */
interface AddressContext {
  routerAddrs: Set<string>
  poolAddrs: Set<string>
  sendPotAddr: string
  sendCheckAddr: string | undefined
  sendtagCheckoutAddr: string | undefined
  sendTokenV0Addr: string | undefined
}

export function createAddressContext(
  swapRouters: SwapRouter[] | undefined,
  liquidityPools: LiquidityPool[] | undefined
): AddressContext {
  return {
    routerAddrs: new Set((swapRouters || []).map((r) => r.router_addr.toLowerCase())),
    poolAddrs: new Set((liquidityPools || []).map((p) => p.pool_addr.toLowerCase())),
    sendPotAddr: SENDPOT_CONTRACT_ADDRESS.toLowerCase(),
    sendCheckAddr: sendCheckAddress?.[baseMainnet.id]?.toLowerCase(),
    sendtagCheckoutAddr: sendtagCheckoutAddress[baseMainnet.id]?.toLowerCase(),
    sendTokenV0Addr: sendTokenV0Address[baseMainnet.id]?.toLowerCase(),
  }
}

/**
 * Group activities by date and remove duplicates
 */
export function groupActivitiesByDate(
  activities: Activity[],
  t: TFunction<'activity'>,
  locale: string
): GroupedActivities[] {
  // Remove duplicates
  const seenEventIds = new Set<string>()
  const uniqueActivities = activities.filter((activity) => {
    if (seenEventIds.has(activity.event_id)) return false
    seenEventIds.add(activity.event_id)
    return true
  })

  // Group by date
  const groupMap = new Map<string, Activity[]>()
  const groupOrder: string[] = []

  for (const activity of uniqueActivities) {
    const isToday = activity.created_at.toDateString() === new Date().toDateString()
    const dateKey = isToday
      ? t('sections.today')
      : activity.created_at.toLocaleDateString(locale, { day: 'numeric', month: 'long' })

    if (!groupMap.has(dateKey)) {
      groupMap.set(dateKey, [])
      groupOrder.push(dateKey)
    }
    const group = groupMap.get(dateKey)
    if (group) group.push(activity)
  }

  return groupOrder.map((title) => ({
    title,
    activities: groupMap.get(title) ?? [],
  }))
}

/**
 * Compute relative time string
 */
function computeRelativeDate(
  createdAt: Date,
  formatter: Intl.RelativeTimeFormat,
  now: number
): string {
  const diffMs = createdAt.getTime() - now
  const diffSeconds = Math.round(diffMs / 1000)
  const minutes = Math.round(diffSeconds / 60)
  const hours = Math.round(diffSeconds / 3600)
  const days = Math.round(diffSeconds / 86400)

  if (Math.abs(diffSeconds) < 60) return formatter.format(diffSeconds, 'second')
  if (Math.abs(minutes) < 60) return formatter.format(minutes, 'minute')
  if (Math.abs(hours) < 24) return formatter.format(hours, 'hour')
  return formatter.format(days, 'day')
}

/**
 * Compute amount string for an activity
 */
function computeAmount(
  activity: Activity,
  isSwapSell: boolean,
  sendTokenV0Addr: string | undefined
): string {
  const { from_user, data: activityData } = activity
  const amountPrefix = from_user?.id ? '' : '+ '

  if (isTemporalTokenTransfersEvent(activity)) {
    const { v, coin } = activityData
    if (coin)
      return `${amountPrefix}${formatAmount(formatUnits(v, coin.decimals), 5, coin.formatDecimals)} ${coin.symbol}`
    return `${amountPrefix}${formatAmount(`${v}`, 5, 0)}`
  }

  if (isTemporalEthTransfersEvent(activity)) {
    const { value, coin } = activityData
    if (coin)
      return `${amountPrefix}${formatAmount(formatUnits(value, coin.decimals), 5, coin.formatDecimals)} ${coin.symbol}`
    return `${amountPrefix}${formatAmount(`${value}`, 5, 0)}`
  }

  if (isSendAccountTransfersEvent(activity)) {
    const { v, coin } = activityData
    if (coin) {
      if (sendTokenV0Addr && coin.token?.toLowerCase() === sendTokenV0Addr) {
        return `${amountPrefix}${formatAmount(formatUnits(v * BigInt(1e16), sendCoin.decimals), 5, coin.formatDecimals)} ${coin.symbol}`
      }
      const prefix = isSwapSell || from_user?.id ? '' : '+ '
      return `${prefix}${formatAmount(formatUnits(v, coin.decimals), 5, coin.formatDecimals)} ${coin.symbol}`
    }
    return `${amountPrefix}${formatAmount(`${v}`, 5, 0)}`
  }

  if (isSendAccountReceiveEvent(activity)) {
    const { value, coin } = activityData
    if (coin)
      return `${formatAmount(formatUnits(value, coin.decimals), 5, coin.formatDecimals)} ${coin.symbol}`
    return formatAmount(`${value}`, 5, 0)
  }

  if (isTemporalSendEarnDepositEvent(activity)) {
    const { assets, coin } = activityData
    if (coin && assets !== undefined && assets !== null)
      return `${formatAmount(formatUnits(assets, coin.decimals), 5, coin.formatDecimals)} ${coin.symbol}`
    if (assets !== undefined && assets !== null) return formatAmount(`${assets}`, 5, 0)
  }

  if (isTagReceiptsEvent(activity) || isTagReceiptUSDCEvent(activity)) {
    const { value, coin } = activityData
    return `${formatAmount(formatUnits(value, coin.decimals), 5, coin.formatDecimals)} ${coin.symbol}`
  }

  return ''
}

/**
 * Generate avatar URL for a user or address
 */
function generateAvatarUrl(name: string): string {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=52&format=png&background=86ad7f`
}

/**
 * Transform a single activity into a typed ActivityRow
 */
export function transformActivity(
  activity: Activity,
  ctx: TransformContext,
  addrCtx: AddressContext,
  formatter: Intl.RelativeTimeFormat,
  now: number,
  isFirst: boolean,
  isLast: boolean,
  sectionIndex: number
): Exclude<ActivityRow, HeaderRow> {
  const { t } = ctx
  const {
    routerAddrs,
    poolAddrs,
    sendPotAddr,
    sendCheckAddr,
    sendtagCheckoutAddr,
    sendTokenV0Addr,
  } = addrCtx
  const { from_user, to_user, data: activityData, event_name } = activity

  // Pre-compute addresses
  const toAddr = isSendAccountTransfersEvent(activity) ? activityData.t?.toLowerCase() : undefined
  const fromAddr = isSendAccountTransfersEvent(activity) ? activityData.f?.toLowerCase() : undefined
  const senderAddr = isSendAccountReceiveEvent(activity)
    ? activityData.sender?.toLowerCase()
    : undefined

  // Detect activity type
  const isSwapSell =
    isSendAccountTransfersEvent(activity) &&
    toAddr &&
    (poolAddrs.has(toAddr) || routerAddrs.has(toAddr))
  const isSwapBuy =
    (isSendAccountReceiveEvent(activity) && senderAddr && routerAddrs.has(senderAddr)) ||
    (isSendAccountTransfersEvent(activity) && fromAddr && routerAddrs.has(fromAddr))
  const isSwap = isSwapSell || isSwapBuy

  const isSendPotPurchase = isSendAccountTransfersEvent(activity) && toAddr === sendPotAddr
  const isSendPotWin = isSendAccountTransfersEvent(activity) && fromAddr === sendPotAddr
  const isSendCheckCreate =
    isSendAccountTransfersEvent(activity) && sendCheckAddr && toAddr === sendCheckAddr
  const isSendCheckClaim =
    isSendAccountTransfersEvent(activity) && sendCheckAddr && fromAddr === sendCheckAddr

  // Common fields
  const baseFields = {
    eventId: activity.event_id,
    amount: computeAmount(activity, isSwapSell, sendTokenV0Addr),
    date: computeRelativeDate(activity.created_at, formatter, now),
    isFirst,
    isLast,
    sectionIndex,
  }

  // Sendpot
  if (isSendPotPurchase || isSendPotWin) {
    const tickets = isSendPotPurchase ? calculateTicketsFromWei(activityData.v) : null
    const ticketCount =
      tickets !== null ? (typeof tickets === 'bigint' ? Number(tickets) : tickets) : null
    const ticketText =
      ticketCount !== null
        ? t('subtext.tickets', { count: ticketCount, defaultValue: '{{count}} ticket' })
        : ''
    return {
      kind: 'sendpot',
      ...baseFields,
      title: isSendPotWin
        ? t('events.sendpot.win', { defaultValue: 'Sendpot Win' })
        : t('events.sendpot.ticketPurchase', { defaultValue: 'Bought' }),
      subtitle: ticketText,
    } satisfies SendpotRow
  }

  // Sendcheck
  if (isSendCheckCreate || isSendCheckClaim) {
    return {
      kind: 'sendcheck',
      ...baseFields,
      title: isSendCheckClaim
        ? t('events.sendCheck.claim', { defaultValue: 'Claimed Check' })
        : t('events.sendCheck.create', { defaultValue: 'Sent Check' }),
      subtitle: t('subtext.you', { defaultValue: 'You' }),
      isClaim: !!isSendCheckClaim,
    } satisfies SendcheckRow
  }

  // Swap/trade
  if (isSwap) {
    const coinSymbol = activityData?.coin?.symbol ?? ''
    return {
      kind: 'swap',
      ...baseFields,
      title: t('events.trade', { defaultValue: 'Trade' }),
      subtitle: coinSymbol,
      coinSymbol,
      isBuy: isSwapBuy,
    } satisfies SwapRow
  }

  // Send Earn
  if (isSendEarnDepositEvent(activity) || isTemporalSendEarnDepositEvent(activity)) {
    const isFailed = isTemporalSendEarnDepositEvent(activity) && activityData.status === 'failed'
    const isTemporal = isTemporalSendEarnDepositEvent(activity)
    const sendEarnLabel = t('subtext.sendEarn', { defaultValue: 'Send Earn' })

    // Check if this is an affiliate reward
    const isAffiliateReward =
      isSendEarnDepositEvent(activity) &&
      ctx.addressBook?.[activityData.sender] === ContractLabels.SendEarnAffiliate

    let earnTitle: string
    if (isAffiliateReward) {
      earnTitle = t('events.rewards', { defaultValue: 'Rewards' })
    } else if (isFailed) {
      earnTitle = t('events.temporal.depositFailed', { defaultValue: 'Deposit Failed' })
    } else if (isTemporal) {
      // Use temporal status for pending states
      earnTitle = temporalEventNameFromStatus(activityData.status, (key, defaultValue) =>
        t(key, { defaultValue })
      )
    } else {
      earnTitle = t('events.sendEarn.deposit', { defaultValue: 'Send Earn Deposit' })
    }

    const earnSubtitle = isFailed
      ? (isTemporal && activityData.error_message) || sendEarnLabel
      : sendEarnLabel

    return {
      kind: 'earn',
      ...baseFields,
      title: earnTitle,
      subtitle: earnSubtitle,
      isDeposit: true,
      isFailed,
    } satisfies EarnRow
  }

  if (isSendEarnWithdrawEvent(activity)) {
    return {
      kind: 'earn',
      ...baseFields,
      title: t('events.sendEarn.withdraw', { defaultValue: 'Send Earn Withdraw' }),
      subtitle: t('subtext.sendEarn', { defaultValue: 'Send Earn' }),
      isDeposit: false,
      isFailed: false,
    } satisfies EarnRow
  }

  // SEND token upgrade
  if (isSendTokenUpgradeEvent(activity)) {
    const prevAmount = activityData.v / BigInt(1e16)
    const conversionText = `${formatAmount(String(prevAmount), 5, sendV0Coin.formatDecimals)} → ${formatAmount(formatUnits(activityData.v, activityData.coin.decimals), 5, sendCoin.formatDecimals)}`
    return {
      kind: 'upgrade',
      ...baseFields,
      title: t('events.sendTokenUpgrade', { defaultValue: 'Send Token Upgrade' }),
      subtitle: conversionText,
    } satisfies UpgradeRow
  }

  // Tag receipt
  if (isTagReceiptsEvent(activity) || isTagReceiptUSDCEvent(activity)) {
    return {
      kind: 'tag-receipt',
      ...baseFields,
      title: t('events.sendtagRegistered', { defaultValue: 'Sendtag Registered' }),
      subtitle: activityData.tags.map((tag: string) => `/${tag}`).join(', '),
    } satisfies TagReceiptRow
  }

  // Referral
  if (isReferralsEvent(activity)) {
    const isReferrer = Boolean(from_user?.id)
    const otherUser = isReferrer ? to_user : from_user
    return {
      kind: 'referral',
      ...baseFields,
      title: isReferrer
        ? t('events.referral', { defaultValue: 'Referral' })
        : t('events.referredBy', { defaultValue: 'Referred By' }),
      subtitle: userNameFromActivityUser(otherUser) ?? '',
      avatarUrl:
        otherUser?.avatar_url ||
        generateAvatarUrl(otherUser?.name ?? otherUser?.main_tag_name ?? 'U'),
      isVerified: otherUser?.is_verified ?? false,
      counterpartSendId: otherUser?.send_id ?? null,
    } satisfies ReferralRow
  }

  // Signing key
  if (
    event_name === 'send_account_signing_key_added' ||
    event_name === 'send_account_signing_key_removed'
  ) {
    const isAdded = event_name === 'send_account_signing_key_added'
    return {
      kind: 'signing-key',
      ...baseFields,
      title: isAdded
        ? t('events.sendAccountSigningKeyAdded', { defaultValue: 'Send Account Signing Key Added' })
        : t('events.sendAccountSigningKeyRemoved', {
            defaultValue: 'Send Account Signing Key Removed',
          }),
      subtitle: t('subtext.sendAccountSigningKey', { defaultValue: 'Send Account Signing Key' }),
    } satisfies SigningKeyRow
  }

  // User transfer (between Send users)
  const user = counterpart(activity)
  if (user) {
    const note = noteFromActivity(activity)
    let subtitle: string
    if (isSendAccountTransfersEvent(activity) && fromAddr === sendtagCheckoutAddr) {
      subtitle = t('events.revenueShare', { defaultValue: 'Revenue Share' })
    } else if (to_user?.id) {
      subtitle = note || t('events.received', { defaultValue: 'Received' })
    } else {
      subtitle = note || t('events.sent', { defaultValue: 'Sent' })
    }

    return {
      kind: 'user-transfer',
      ...baseFields,
      title: userNameFromActivityUser(user) ?? '',
      subtitle,
      avatarUrl:
        user.avatar_url ||
        generateAvatarUrl(user.name ?? user.main_tag_name ?? String(user.send_id) ?? 'U'),
      isVerified: user.is_verified ?? false,
      isReceived: Boolean(to_user?.id),
      counterpartSendId: user.send_id ?? null,
    } satisfies UserTransferRow
  }

  // External transfer (to/from non-Send addresses)
  let title: string
  let subtitle: string
  let isWithdraw = false
  let isDeposit = false
  const { addressBook } = ctx
  const coinSymbol = activityData?.coin?.symbol ?? ''

  if (isSendAccountTransfersEvent(activity)) {
    if (to_user?.send_id === undefined && from_user?.id) {
      title = t('events.withdraw', { defaultValue: 'Withdraw' })
      subtitle = labelAddress(activityData.t ?? '', addressBook)
      isWithdraw = true
    } else if (from_user === null && to_user?.id) {
      title = t('events.deposit', { defaultValue: 'Deposit' })
      subtitle = labelAddress(activityData.f ?? '', addressBook)
      isDeposit = true
    } else {
      title = from_user?.id
        ? t('events.sent', { defaultValue: 'Sent' })
        : t('events.received', { defaultValue: 'Received' })
      subtitle = labelAddress(from_user?.id ? activityData.t : (activityData.f ?? ''), addressBook)
    }
  } else if (isSendAccountReceiveEvent(activity)) {
    if (from_user === null && to_user?.id) {
      title = t('events.deposit', { defaultValue: 'Deposit' })
      isDeposit = true
    } else {
      title = t('events.received', { defaultValue: 'Received' })
    }
    subtitle = labelAddress(activityData.sender ?? activityData.log_addr ?? '', addressBook)
  } else if (isTemporalTokenTransfersEvent(activity)) {
    title = from_user?.id
      ? t('events.sent', { defaultValue: 'Sent' })
      : t('events.received', { defaultValue: 'Received' })
    subtitle = labelAddress(activityData.t ?? '', addressBook)
  } else if (isTemporalEthTransfersEvent(activity)) {
    title = from_user?.id
      ? t('events.sent', { defaultValue: 'Sent' })
      : t('events.received', { defaultValue: 'Received' })
    subtitle = labelAddress(activityData.log_addr ?? '', addressBook)
  } else {
    title = event_name
    subtitle = ''
  }

  return {
    kind: 'external',
    ...baseFields,
    title,
    subtitle,
    avatarUrl: subtitle ? generateAvatarUrl(subtitle) : generateAvatarUrl('?'),
    coinSymbol,
    isWithdraw,
    isDeposit,
  } satisfies ExternalRow
}

/**
 * Transform all activities into typed rows with headers.
 * This is the main entry point for the transformation.
 */
export function transformActivitiesToRows(
  pages: Activity[][] | undefined,
  ctx: TransformContext
): ActivityRow[] {
  if (!pages) return []

  const { t, locale, swapRouters, liquidityPools } = ctx
  const activities = pages.flat()

  // Group by date
  const groups = groupActivitiesByDate(activities, t, locale)

  // Pre-compute context
  const addrCtx = createAddressContext(swapRouters, liquidityPools)
  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
  const now = Date.now()

  const result: ActivityRow[] = []

  groups.forEach((group, sectionIndex) => {
    // Add header
    result.push({
      kind: 'header',
      title: group.title,
      sectionIndex,
    } satisfies HeaderRow)

    // Transform activities
    const count = group.activities.length
    group.activities.forEach((activity, activityIndex) => {
      const row = transformActivity(
        activity,
        ctx,
        addrCtx,
        formatter,
        now,
        activityIndex === 0,
        activityIndex === count - 1,
        sectionIndex
      )
      result.push(row)
    })
  })

  return result
}
