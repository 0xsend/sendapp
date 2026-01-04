import {
  baseMainnet,
  sendCheckAddress,
  sendtagCheckoutAddress,
  sendTokenV0Address,
  sendTokenV0LockboxAddress,
  tokenPaymasterAddress,
} from '@my/wagmi'
import { sendCoin, sendV0Coin } from 'app/data/coins'
import { ContractLabels } from 'app/data/contract-labels'
import { useAddressBook } from 'app/utils/useAddressBook'
import type { Activity } from 'app/utils/zod/activity'
import type { LiquidityPool } from 'app/utils/zod/LiquidityPoolSchema'
import type { SwapRouter } from 'app/utils/zod/SwapRouterSchema'
import { useCallback, useMemo } from 'react'
import { formatUnits, isAddressEqual } from 'viem'
import formatAmount from './formatAmount'
import { pgAddrCondValues } from './pgAddrCondValues'
import { shorten, squish } from './strings'
import {
  isReferralsEvent,
  isSendAccountTransfersEvent,
  isTagReceiptsEvent,
  isTagReceiptUSDCEvent,
} from './zod/activity'
import { isSendAccountReceiveEvent } from './zod/activity/SendAccountReceiveEventSchema'
import { isSendTokenUpgradeEvent } from './zod/activity/SendAccountTransfersEventSchema'
import {
  isSendEarnDepositEvent,
  isSendEarnEvent,
  isSendEarnWithdrawEvent,
  isTemporalSendEarnDepositEvent,
} from './zod/activity/SendEarnEventSchema'
import {
  isTemporalEthTransfersEvent,
  isTemporalTokenTransfersEvent,
  temporalEventNameFromStatus,
} from './zod/activity/TemporalTransfersEventSchema'
import { calculateTicketsFromWei, SENDPOT_CONTRACT_ADDRESS } from 'app/data/sendpot'
import { CommentsTime } from 'app/utils/dateHelper'
import { Spinner } from '@my/ui'
import { useTranslation } from 'react-i18next'

type ActivityTranslateFn = (
  key: string,
  defaultValue?: string,
  options?: Record<string, unknown>
) => string

const translateWithDefault = (
  t: ActivityTranslateFn | undefined,
  key: string,
  defaultValue: string,
  options?: Record<string, unknown>
) => {
  if (!t) return defaultValue
  return t(key, defaultValue, options)
}

const wagmiAddresWithLabel = (addresses: `0x${string}`[], label: string) =>
  Object.values(addresses).map((a) => [a, label])

/**
 * @see useAddressBook
 * @deprecated
 */
const AddressLabels = {
  ...Object.fromEntries(
    wagmiAddresWithLabel(Object.values(tokenPaymasterAddress), ContractLabels.Paymaster)
  ),
  ...Object.fromEntries(
    wagmiAddresWithLabel(Object.values(sendtagCheckoutAddress), ContractLabels.SendtagCheckout)
  ),
}

const labelAddress = (address: `0x${string}`): string =>
  AddressLabels[address] ?? shorten(address ?? '', 5, 4)

const amountPrefix = (activity: Activity) => (activity.from_user?.id ? '' : '+ ')

/**
 * Returns the counterpart of the activity which could be the logged in user.
 * If the activity is a send account transfer or receive,
 *   if received, the counterpart is the user who sent the token.
 *   if sent, the counterpart is the user who received the token.
 * If the activity is a tag receipt, the actor is the user who created the tag.
 * If the activity is a referral, the actor is the user who referred the user.
 * If the activity is a temporal transfer, the actor is the user who sent the token.
 */
export function counterpart(activity: Activity): Activity['from_user'] | Activity['to_user'] {
  const { from_user, to_user } = activity
  if (isTagReceiptsEvent(activity)) {
    return from_user
  }
  if (isReferralsEvent(activity) && !!from_user?.id) {
    return to_user // show the referred
  }
  if (isReferralsEvent(activity) && !!to_user?.id) {
    return from_user // show the referrer
  }
  if (isSendAccountTransfersEvent(activity) || isSendAccountReceiveEvent(activity)) {
    if (from_user?.id) {
      // if i am the sender, show the receiver
      return to_user
    }
    if (to_user?.id) {
      // if i am the receiver, show the sender
      return from_user
    }
  }
  if (isTemporalEthTransfersEvent(activity) || isTemporalTokenTransfersEvent(activity)) {
    return to_user
  }
  return null // not a send or receive event
}

/**
 * Returns the amount of the activity if there is one.
 */
export function amountFromActivity(
  activity: Activity,
  swapRouters: SwapRouter[] = [],
  liquidityPools: LiquidityPool[] = []
): string {
  switch (true) {
    case isTemporalTokenTransfersEvent(activity): {
      const { v, coin } = activity.data
      if (coin) {
        const amount = formatAmount(formatUnits(v, coin.decimals), 5, coin.formatDecimals)
        return `${amountPrefix(activity)}${amount} ${coin.symbol}`
      }
      return `${amountPrefix(activity)}${formatAmount(`${v}`, 5, 0)}`
    }
    case isTemporalEthTransfersEvent(activity): {
      const { value, coin } = activity.data
      if (coin) {
        const amount = formatAmount(formatUnits(value, coin.decimals), 5, coin.formatDecimals)
        return `${amountPrefix(activity)}${amount} ${coin.symbol}`
      }
      return `${amountPrefix(activity)}${formatAmount(`${value}`, 5, 0)}`
    }
    case isSendAccountTransfersEvent(activity): {
      const { v, coin } = activity.data
      const isSellTransfer = isSwapSellTransfer(activity, swapRouters, liquidityPools)
      if (coin) {
        // scale the send v0 amount to send v1 amount
        if (
          isAddressEqual(
            activity.data.coin?.token as `0x${string}`,
            sendTokenV0Address[baseMainnet.id]
          )
        ) {
          const amount = formatAmount(
            formatUnits(v * BigInt(1e16), sendCoin.decimals),
            5,
            coin.formatDecimals
          )

          return `${amountPrefix(activity)}${amount} ${coin.symbol}`
        }

        const amount = formatAmount(formatUnits(v, coin.decimals), 5, coin.formatDecimals)

        return `${isSellTransfer || activity.from_user?.id ? '' : '+ '}${amount} ${coin.symbol}`
      }
      return `${amountPrefix(activity)}${formatAmount(`${v}`, 5, 0)}`
    }
    case isSendAccountReceiveEvent(activity): {
      const { coin } = activity.data
      if (coin) {
        const amount = formatAmount(
          formatUnits(activity.data.value, coin.decimals),
          5,
          coin.formatDecimals
        )

        return `${amount} ${coin.symbol}`
      }
      return formatAmount(`${activity.data.value}`, 5, 0)
    }
    case isTemporalSendEarnDepositEvent(activity): {
      const { assets, coin } = activity.data
      if (coin && assets !== undefined && assets !== null) {
        const amount = formatAmount(formatUnits(assets, coin.decimals), 5, coin.formatDecimals)
        return `${amount} ${coin.symbol}`
      }
      // Fallback if coin or assets are missing (less likely for this event type)
      return assets !== undefined && assets !== null ? formatAmount(`${assets}`, 5, 0) : ''
    }
    case isTagReceiptsEvent(activity) || isTagReceiptUSDCEvent(activity): {
      const data = activity.data
      const amount = formatAmount(
        formatUnits(data.value, data.coin.decimals),
        5,
        data.coin.formatDecimals
      )

      return `${amount} ${data.coin.symbol}`
    }
    case isReferralsEvent(activity) && !!activity.from_user?.id: {
      // only show if the user is the referrer
      return '' // no amount
    }
    case isReferralsEvent(activity) && !!activity.to_user?.id: {
      // only show if the user is the referred
      return '' // no amount
    }
    case activity.event_name === 'send_account_signing_key_added': {
      return ''
    }
    case activity.event_name === 'send_account_signing_key_removed': {
      return ''
    }
    default:
      if (__DEV__) console.log('unknown activity', activity)
      return ''
  }
}

export const noteFromActivity = (activity: Activity) =>
  (isTemporalTokenTransfersEvent(activity) ||
    isTemporalEthTransfersEvent(activity) ||
    isSendAccountTransfersEvent(activity) ||
    isSendAccountReceiveEvent(activity)) &&
  activity.data.note
    ? decodeURIComponent(activity.data.note)
    : null

/**
 * Determines if the given activity is a swap buy transfer.
 * A swap buy transfer is validated by checking if the sender or token address matches any address in the provided swap routers.
 *
 * @param activity - The activity to check.
 * @param swapRouters - Optional list of swap routers to check against.
 * @returns `true` if the activity is a swap buy transfer, otherwise `false`.
 */
export const isSwapBuyTransfer = (activity: Activity, swapRouters: SwapRouter[] = []) => {
  const { data } = activity

  // For ETH receives (SendAccountReceive events), check the sender field
  const isEthBuy =
    isSendAccountReceiveEvent(activity) &&
    data.sender &&
    swapRouters.some((swapRouter) => isAddressEqual(data.sender, swapRouter.router_addr))

  // For ERC20 transfers (SendAccountTransfers events), check the from (f) field
  const isErc20Buy =
    isSendAccountTransfersEvent(activity) &&
    data.f &&
    swapRouters.some((swapRouter) => isAddressEqual(data.f, swapRouter.router_addr))

  return Boolean(isEthBuy || isErc20Buy)
}

/**
 * Determines if the given activity is a swap sell transfer.
 * A swap sell transfer is validated by checking if the address `data.t` matches any address in the provided liquidity pools or swap routers.
 *
 * @param activity - The activity to check.
 * @param swapRouters - Optional list of swap routers to check against.
 * @param liquidityPools - Optional list of liquidity pools to check against.
 * @returns `true` if the activity is a swap sell transfer, otherwise `false`.
 */
export const isSwapSellTransfer = (
  activity: Activity,
  swapRouters: SwapRouter[] = [],
  liquidityPools: LiquidityPool[] = []
) => {
  const { data } = activity

  // Only check the 't' field for ERC20 transfers (SendAccountTransfers events)
  return Boolean(
    isSendAccountTransfersEvent(activity) &&
      data.t &&
      (liquidityPools.some((liquidityPool) => isAddressEqual(data.t, liquidityPool.pool_addr)) ||
        swapRouters.some((swapRouter) => isAddressEqual(data.t, swapRouter.router_addr)))
  )
}

/**
 * Checks if the activity represents a ticket purchase from the Send Pot contract.
 * @param activity - The activity to check.
 * @returns `true` if the activity is an ERC20 transfer *to* the Send Pot contract, otherwise `false`.
 */
export const isSendPotTicketPurchase = (activity: Activity): boolean => {
  return (
    isSendAccountTransfersEvent(activity) &&
    isAddressEqual(activity.data.t, SENDPOT_CONTRACT_ADDRESS)
  )
}

/**
 * Checks if the activity represents a win payout from the Send Pot contract.
 * @param activity - The activity to check.
 * @returns `true` if the activity is an ERC20 transfer *from* the Send Pot contract, otherwise `false`.
 */
export const isSendPotWin = (activity: Activity): boolean => {
  return (
    isSendAccountTransfersEvent(activity) &&
    isAddressEqual(activity.data.f, SENDPOT_CONTRACT_ADDRESS)
  )
}

/**
 * Get the SendCheck contract address for the current chain.
 */
const getSendCheckContractAddress = (): `0x${string}` | undefined => {
  return sendCheckAddress?.[baseMainnet.id]
}

/**
 * Checks if the activity represents creating/funding a Send Check.
 * This is when tokens are transferred TO the SendCheck contract.
 * @param activity - The activity to check.
 * @returns `true` if the activity is a transfer to the SendCheck contract, otherwise `false`.
 */
export const isSendCheckCreate = (activity: Activity): boolean => {
  const checkAddress = getSendCheckContractAddress()
  if (!checkAddress) return false
  return isSendAccountTransfersEvent(activity) && isAddressEqual(activity.data.t, checkAddress)
}

/**
 * Checks if the activity represents claiming a Send Check.
 * This is when tokens are transferred FROM the SendCheck contract to the user.
 * @param activity - The activity to check.
 * @returns `true` if the activity is a transfer from the SendCheck contract, otherwise `false`.
 */
export const isSendCheckClaim = (activity: Activity): boolean => {
  const checkAddress = getSendCheckContractAddress()
  if (!checkAddress) return false
  return isSendAccountTransfersEvent(activity) && isAddressEqual(activity.data.f, checkAddress)
}

/**
 * Checks if the activity is a Send Check related transfer (create or claim).
 * @param activity - The activity to check.
 * @returns `true` if the activity involves the SendCheck contract, otherwise `false`.
 */
export const isSendCheckTransfer = (activity: Activity): boolean => {
  return isSendCheckCreate(activity) || isSendCheckClaim(activity)
}

/**
 * Checks if a given activity is a swap transfer.
 * A swap transfer can either be a swap buy transfer or a swap sell transfer.
 *
 * @param activity - The activity to check.
 * @param swapRouters - Optional list of swap routers to validate the activity against.
 * @param liquidityPools - Optional list of liquidity pools to validate the activity against.
 * @returns `true` if the activity is a swap transfer, otherwise `false`.
 */
export const isActivitySwapTransfer = (
  activity: Activity,
  swapRouters: SwapRouter[] = [],
  liquidityPools: LiquidityPool[] = []
) => {
  return (
    isSwapBuyTransfer(activity, swapRouters) ||
    isSwapSellTransfer(activity, swapRouters, liquidityPools)
  )
}

/**
 * Returns the human readable event name of the activity.
 * @param activity - The activity to check.
 * @param swapRouters - Optional list of swap routers to validate the activity against.
 * @param liquidityPools - Optional list of liquidity pools to validate the activity against.
 * @deprecated use useEventNameFromActivity instead
 * @returns the human readable event name of the activity
 */
export function eventNameFromActivity({
  activity,
  swapRouters = [],
  liquidityPools = [],
  t,
}: {
  activity: Activity
  swapRouters?: SwapRouter[]
  liquidityPools?: LiquidityPool[]
  t?: ActivityTranslateFn
}): string {
  const { event_name, from_user, to_user, data } = activity
  const isERC20Transfer = isSendAccountTransfersEvent(activity)
  const isETHReceive = isSendAccountReceiveEvent(activity)
  const isTransferOrReceive = isERC20Transfer || isETHReceive
  const isTemporalTransfer =
    isTemporalEthTransfersEvent(activity) || isTemporalTokenTransfersEvent(activity)
  const isSwapTransfer = isActivitySwapTransfer(activity, swapRouters, liquidityPools)
  const note = noteFromActivity(activity)
  const translate = (key: string, defaultValue: string, options?: Record<string, unknown>) =>
    translateWithDefault(t, key, defaultValue, options)

  switch (true) {
    case isSendPotTicketPurchase(activity):
      return translate('events.sendpot.ticketPurchase', 'Bought')
    case isSendPotWin(activity):
      return translate('events.sendpot.win', 'Sendpot Win')
    case isSendCheckCreate(activity):
      return translate('events.sendCheck.create', 'Sent Check')
    case isSendCheckClaim(activity):
      return translate('events.sendCheck.claim', 'Claimed Check')
    case isTemporalSendEarnDepositEvent(activity):
      return activity.data.status === 'failed'
        ? translate('events.temporal.depositFailed', 'Deposit Failed')
        : temporalEventNameFromStatus(data.status, (statusKey, defaultValue) =>
            translate(statusKey, defaultValue)
          )
    case isSendEarnDepositEvent(activity):
      return translate('events.sendEarn.deposit', 'Send Earn Deposit')
    case isSendEarnWithdrawEvent(activity):
      return translate('events.sendEarn.withdraw', 'Send Earn Withdraw')
    case isERC20Transfer && isAddressEqual(data.f, sendtagCheckoutAddress[baseMainnet.id]):
      return translate('events.revenueShare', 'Revenue Share')
    case isSendTokenUpgradeEvent(activity):
      return translate('events.sendTokenUpgrade', 'Send Token Upgrade')
    case isERC20Transfer && to_user?.send_id === undefined:
      if (isSwapTransfer) {
        return translate('events.trade', 'Trade')
      }
      return translate('events.withdraw', 'Withdraw')
    case isTransferOrReceive && from_user === null:
      if (isSwapTransfer) {
        return translate('events.trade', 'Trade')
      }
      return translate('events.deposit', 'Deposit')
    case (isTransferOrReceive || isTemporalTransfer) && !!to_user?.id:
      return note || translate('events.received', 'Received')
    case (isTransferOrReceive || isTemporalTransfer) && !!from_user?.id:
      return note || translate('events.sent', 'Sent')
    case isTagReceiptsEvent(activity) || isTagReceiptUSDCEvent(activity):
      return translate('events.sendtagRegistered', 'Sendtag Registered')
    case isReferralsEvent(activity) && !!from_user?.id:
      return translate('events.referral', 'Referral')
    case isReferralsEvent(activity) && !!to_user?.id:
      return translate('events.referredBy', 'Referred By')
    case event_name === 'send_account_signing_key_added':
      return translate('events.sendAccountSigningKeyAdded', 'Send Account Signing Key Added')
    case event_name === 'send_account_signing_key_removed':
      return translate('events.sendAccountSigningKeyRemoved', 'Send Account Signing Key Removed')

    default:
      return event_name // catch-all i_am_rick_james -> I Am Rick James
        .split('_')
        .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
        .join(' ')
  }
}

/**
 * Returns the human readable event name of the activity.
 * @param activity
 * @param swapRouters - Optional list of swap routers to validate the activity against.
 * @param liquidityPools - Optional list of liquidity pools to validate the activity against.
 * @returns the human readable event name of the activity
 */
export function useEventNameFromActivity({
  activity,
  swapRouters = [],
  liquidityPools = [],
}: {
  activity: Activity
  swapRouters?: SwapRouter[]
  liquidityPools?: LiquidityPool[]
}): string {
  const isERC20Transfer = isSendAccountTransfersEvent(activity)
  const { data: addressBook } = useAddressBook()
  const { t } = useTranslation('activity')
  const translator = useCallback(
    (key: string, defaultValue?: string, options?: Record<string, unknown>) =>
      t(key, { defaultValue, ...options }),
    [t]
  )

  return useMemo(() => {
    if (
      isSendEarnDepositEvent(activity) &&
      addressBook?.[activity.data.sender] === ContractLabels.SendEarnAffiliate
    ) {
      return translator('events.rewards', 'Rewards')
    }
    if (isERC20Transfer && addressBook?.[activity.data.t] === ContractLabels.SendEarn) {
      return translator('events.deposit', 'Deposit')
    }
    if (isERC20Transfer && addressBook?.[activity.data.f] === ContractLabels.SendEarn) {
      return translator('events.withdraw', 'Withdraw')
    }
    // this should have always been a hook
    return eventNameFromActivity({ activity, swapRouters, liquidityPools, t: translator })
  }, [activity, addressBook, isERC20Transfer, swapRouters, liquidityPools, translator])
}

/**
 * Returns the human-readable phrase for event name of the activity for activity details.
 * @param activity - The activity to check.
 * @param swapRouters - Optional list of swap routers to validate the activity against.
 * @param liquidityPools - Optional list of liquidity pools to validate the activity against.
 * @returns
 */
export function phraseFromActivity({
  activity,
  swapRouters = [],
  liquidityPools = [],
  t,
}: {
  activity: Activity
  swapRouters?: SwapRouter[]
  liquidityPools?: LiquidityPool[]
  t?: ActivityTranslateFn
}): string {
  const { event_name, from_user, to_user, data } = activity
  const isERC20Transfer = isSendAccountTransfersEvent(activity)
  const isETHReceive = isSendAccountReceiveEvent(activity)
  const isTransferOrReceive = isERC20Transfer || isETHReceive
  const isTemporalTransfer =
    isTemporalEthTransfersEvent(activity) || isTemporalTokenTransfersEvent(activity)
  const isSwapTransfer = isActivitySwapTransfer(activity, swapRouters, liquidityPools)
  const translate = (key: string, defaultValue: string, options?: Record<string, unknown>) =>
    translateWithDefault(t, key, defaultValue, options)

  switch (true) {
    case isSendPotWin(activity):
      return translate('phrases.sendpot.win', 'won')
    case isSendPotTicketPurchase(activity):
      return translate('phrases.sendpot.ticketPurchase', 'bought')
    case isSendCheckCreate(activity):
      return translate('phrases.sendCheck.create', 'Created a Send Check')
    case isSendCheckClaim(activity):
      return translate('phrases.sendCheck.claim', 'Claimed a Send Check')
    case isTemporalSendEarnDepositEvent(activity):
      return activity.data.status === 'failed'
        ? translate('phrases.sendEarn.depositFailed', 'Failed to deposit to Send Earn')
        : translate('phrases.sendEarn.depositPending', 'Depositing to Send Earn...')
    case isSendEarnDepositEvent(activity):
      return translate('phrases.sendEarn.depositComplete', 'Deposited to Send Earn')
    case isSendEarnWithdrawEvent(activity):
      return translate('phrases.sendEarn.withdrawComplete', 'Withdrew from Send Earn')
    case isERC20Transfer && isAddressEqual(data.f, sendtagCheckoutAddress[baseMainnet.id]):
      return translate('phrases.revenueShare', 'Earned revenue share')
    case isSendTokenUpgradeEvent(activity):
      return translate('phrases.upgrade', 'Upgraded')
    case isERC20Transfer && to_user?.send_id === undefined:
      if (isSwapTransfer) {
        return translate('phrases.trade', 'Trade')
      }
      return translate('phrases.withdraw', 'Withdrew')
    case isTransferOrReceive && from_user === null:
      if (isSwapTransfer) {
        return translate('phrases.trade', 'Trade')
      }
      return translate('phrases.deposit', 'Deposited')
    case (isTransferOrReceive || isTemporalTransfer) && !!to_user?.id:
      return translate('phrases.sentYou', 'Sent you')
    case (isTransferOrReceive || isTemporalTransfer) && !!from_user?.id:
      return translate('phrases.received', 'Received')
    case isTagReceiptsEvent(activity) || isTagReceiptUSDCEvent(activity):
      return data.tags?.length > 1
        ? translate('phrases.sendtagsCreated', 'Sendtags created')
        : translate('phrases.sendtagCreated', 'Sendtag created')
    case isReferralsEvent(activity) && !!from_user?.id:
      return translate('phrases.referred', 'Referred')
    case isReferralsEvent(activity) && !!to_user?.id:
      return translate('phrases.referredYou', 'Referred you')
    case event_name === 'send_account_signing_key_added':
      return translate('phrases.sendAccountSigningKeyAdded', 'Added')
    default:
      return event_name
        .split('_')
        .join(' ')
        .replace(/^./, (char) => char.toUpperCase())
  }
}

/**
 * Returns the phrase for event name of the activity for activity details.
 * @param activity
 * @param swapRouters - Optional list of swap routers to validate the activity against.
 * @param liquidityPools - Optional list of liquidity pools to validate the activity against.
 * @returns the phrase for event name of the activity for activity details
 */
export function usePhraseFromActivity({
  activity,
  swapRouters = [],
  liquidityPools = [],
}: {
  activity: Activity
  swapRouters?: SwapRouter[]
  liquidityPools?: LiquidityPool[]
}): string {
  const isERC20Transfer = isSendAccountTransfersEvent(activity)
  const { data: addressBook } = useAddressBook()
  const isSendEarnDeposit = isSendEarnDepositEvent(activity)
  const { t } = useTranslation('activity')
  const translator = useCallback(
    (key: string, defaultValue?: string, options?: Record<string, unknown>) =>
      t(key, { defaultValue, ...options }),
    [t]
  )

  return useMemo(() => {
    if (
      isSendEarnDeposit &&
      addressBook?.[activity.data.sender] === ContractLabels.SendEarnAffiliate
    ) {
      return translator('phrases.sendEarn.affiliateReward', 'Earned rewards')
    }
    if (isERC20Transfer && addressBook?.[activity.data.t] === ContractLabels.SendEarn) {
      return translator('phrases.sendEarn.depositComplete', 'Deposited to Send Earn')
    }
    if (isERC20Transfer && addressBook?.[activity.data.f] === ContractLabels.SendEarn) {
      return translator('phrases.sendEarn.withdrawComplete', 'Withdrew from Send Earn')
    }
    // this should have always been a hook
    return phraseFromActivity({ activity, swapRouters, liquidityPools, t: translator })
  }, [
    activity,
    addressBook,
    isERC20Transfer,
    isSendEarnDeposit,
    swapRouters,
    liquidityPools,
    translator,
  ])
}

/**
 * Returns the subtext of the activity if there is one.
 */
export function subtextFromActivity({
  activity,
  swapRouters = [],
  liquidityPools = [],
  t,
}: {
  activity: Activity
  swapRouters?: SwapRouter[]
  liquidityPools?: LiquidityPool[]
  t?: ActivityTranslateFn
}): string | null {
  const _user = counterpart(activity)
  const { from_user, to_user, data, event_name } = activity
  const isERC20Transfer = isSendAccountTransfersEvent(activity)
  const isETHReceive = isSendAccountReceiveEvent(activity)
  const isSwapTransfer = isActivitySwapTransfer(activity, swapRouters, liquidityPools)
  const translate = (key: string, defaultValue: string, options?: Record<string, unknown>) =>
    translateWithDefault(t, key, defaultValue, options)

  if (isSendPotTicketPurchase(activity)) {
    const tickets = calculateTicketsFromWei(data.v)
    const ticketCount = typeof tickets === 'bigint' ? Number(tickets) : tickets
    const defaultLabel = `${ticketCount} ticket${ticketCount === 1 ? '' : 's'}`
    return translate('subtext.tickets', defaultLabel, {
      count: ticketCount,
    })
  }

  if (isSendCheckTransfer(activity)) {
    return translate('subtext.you', 'You')
  }

  if (isTagReceiptsEvent(activity) || isTagReceiptUSDCEvent(activity)) {
    return activity.data.tags.map((t) => `/${t}`).join(', ')
  }
  if (isReferralsEvent(activity)) {
    if (from_user?.id) {
      // show the referred
      return userNameFromActivityUser(to_user)
    }
    // show the referrer
    return userNameFromActivityUser(from_user)
  }
  if (_user) {
    return userNameFromActivityUser(_user)
  }
  if (isSendTokenUpgradeEvent(activity)) {
    // 1B supply -> 100B supply
    // 0 decimals -> 18 decimals
    // 1e16 == 10^18/100
    // show previous amount = (current amount / 1e16)
    const {
      data: { v: currentAmount },
    } = activity
    const prevAmount = currentAmount / BigInt(1e16)
    return `${formatAmount(String(prevAmount), 5, sendV0Coin.formatDecimals)} -> ${formatAmount(
      formatUnits(currentAmount, data.coin.decimals),
      5,
      sendCoin.formatDecimals
    )}`
  }
  if (isSwapTransfer) {
    return activity.data.coin?.symbol
  }
  if (isERC20Transfer && from_user?.id) {
    return labelAddress(data.t)
  }
  if (isETHReceive && from_user?.id) {
    return labelAddress(data.sender)
  }
  if (isERC20Transfer && to_user?.id) {
    return labelAddress(data.f)
  }
  if (isETHReceive && to_user?.id) {
    return labelAddress(data.log_addr)
  }
  if (isTemporalTokenTransfersEvent(activity)) {
    return labelAddress(activity.data.t)
  }
  if (isTemporalEthTransfersEvent(activity)) {
    return labelAddress(activity.data.log_addr)
  }
  if (event_name === 'send_account_signing_key_added') {
    return translate('subtext.sendAccountSigningKey', 'Send Account Signing Key')
  }
  return null
}

/**
 * Returns the external address associated with the activity subtext if the subtext
 * represents an external address (not a Send user).
 * Used to make address labels clickable links to /profile/{address}
 */
export function subtextAddressFromActivity({
  activity,
  swapRouters = [],
  liquidityPools = [],
}: {
  activity: Activity
  swapRouters?: SwapRouter[]
  liquidityPools?: LiquidityPool[]
}): `0x${string}` | null {
  const _user = counterpart(activity)
  const { from_user, to_user, data } = activity
  const isERC20Transfer = isSendAccountTransfersEvent(activity)
  const isETHReceive = isSendAccountReceiveEvent(activity)
  const isSwapTransfer = isActivitySwapTransfer(activity, swapRouters, liquidityPools)

  // If there's a Send user counterpart, don't return an address (it's not external)
  if (_user) return null
  if (isSwapTransfer) return null

  // Return the external address for linking
  if (isERC20Transfer && from_user?.id) {
    return data.t as `0x${string}`
  }
  if (isETHReceive && from_user?.id) {
    return data.sender as `0x${string}`
  }
  if (isERC20Transfer && to_user?.id) {
    return data.f as `0x${string}`
  }
  if (isETHReceive && to_user?.id) {
    return data.log_addr as `0x${string}`
  }
  if (isTemporalTokenTransfersEvent(activity)) {
    return activity.data.t as `0x${string}`
  }
  if (isTemporalEthTransfersEvent(activity)) {
    return activity.data.log_addr as `0x${string}`
  }
  return null
}

export function useSubtextFromActivity({
  activity,
  swapRouters = [],
  liquidityPools = [],
}: {
  activity: Activity
  swapRouters?: SwapRouter[]
  liquidityPools?: LiquidityPool[]
}): string | null {
  const isERC20Transfer = isSendAccountTransfersEvent(activity)
  const { data: addressBook } = useAddressBook()
  const { t } = useTranslation('activity')
  const translator = useCallback(
    (key: string, defaultValue?: string, options?: Record<string, unknown>) =>
      t(key, { defaultValue, ...options }),
    [t]
  )
  return useMemo(() => {
    const sendEarnLabel = translator('subtext.sendEarn', 'Send Earn')

    if (isTemporalSendEarnDepositEvent(activity)) {
      if (activity.data.status === 'failed') {
        return activity.data.error_message || sendEarnLabel
      }
      return sendEarnLabel
    }
    if (isSendEarnEvent(activity)) {
      return sendEarnLabel
    }
    if (isERC20Transfer) {
      if (addressBook?.[activity.data.t] === ContractLabels.SendEarn) {
        return sendEarnLabel
      }
      if (addressBook?.[activity.data.f] === ContractLabels.SendEarn) {
        return sendEarnLabel
      }
    }
    // this should have always been a hook
    return subtextFromActivity({ activity, swapRouters, liquidityPools, t: translator })
  }, [activity, addressBook, isERC20Transfer, swapRouters, liquidityPools, translator])
}

/**
 * Returns the name of the user from the activity user.
 * The cascading fallback is to:
 * 1. First, main sendtag
 * 2. 2nd, profile name
 * 3. 3rd, Send ID
 */
export function userNameFromActivityUser(
  user: Activity['from_user'] | Activity['to_user']
): string {
  switch (true) {
    case !!user?.main_tag_name:
      return `/${user.main_tag_name}`
    case !!user?.tags?.[0]:
      return `/${user.tags[0]}`
    case !!user?.name:
      return user.name
    case !!user?.send_id:
      return `#${user.send_id}`
    case user === null:
      return ''
    default:
      console.error('no user name found', user)
      if (__DEV__) {
        throw new Error('no user name found')
      }
      return ''
  }
}

/**
 * Creates base filtering conditions for activity feed queries to exclude system addresses
 * like paymasters that should be filtered from activity displays.
 *
 * @param extraFrom - Additional addresses to ignore in 'from' field
 * @param extraTo - Additional addresses to ignore in 'to' field
 * @returns SQL condition string for use in Supabase queries
 */
export function getBaseAddressFilterCondition({
  extraFrom = [],
  extraTo = [],
}: { extraFrom?: `0x${string}`[]; extraTo?: `0x${string}`[] } = {}): string {
  const paymasterAddresses = Object.values(tokenPaymasterAddress)
  const sendTokenV0LockboxAddresses = Object.values(sendTokenV0LockboxAddress)

  // Base addresses to ignore in 'from' field
  const fromIgnoreAddresses = [
    ...paymasterAddresses, // show fees on send screen instead
    ...extraFrom,
  ]

  // Base addresses to ignore in 'to' field
  const toIgnoreAddresses = [
    ...paymasterAddresses, // show fees on send screen instead
    ...sendTokenV0LockboxAddresses, // will instead show the "mint"
    ...extraTo,
  ]

  const fromTransferIgnoreValues = pgAddrCondValues(fromIgnoreAddresses)
  const toTransferIgnoreValues = pgAddrCondValues(toIgnoreAddresses)

  return squish(`
    data->t.is.null,
    data->f.is.null,
    and(
      data->>t.not.in.(${toTransferIgnoreValues}),
      data->>f.not.in.(${fromTransferIgnoreValues})
    )
  `)
}

export function useDateFromActivity({ activity }: { activity: Activity }) {
  const { created_at, data } = activity
  const isTemporalTransfer =
    isTemporalEthTransfersEvent(activity) || isTemporalTokenTransfersEvent(activity)
  const { t, i18n } = useTranslation('activity')
  const locale = i18n.resolvedLanguage ?? i18n.language ?? 'en'

  if (isTemporalTransfer) {
    switch (data.status) {
      case 'failed':
        return t('status.failed', { defaultValue: 'Failed' })
      case 'cancelled':
        return t('status.cancelled', { defaultValue: 'Cancelled' })
      case 'confirmed':
        return CommentsTime(new Date(created_at), locale)
      default:
        return <Spinner size="small" color={'$color11'} />
    }
  }

  return CommentsTime(new Date(created_at), locale)
}

export function useDateDetailsFromActivity({ activity }: { activity: Activity }) {
  const { created_at, data } = activity
  const isTemporalTransfer =
    isTemporalEthTransfersEvent(activity) || isTemporalTokenTransfersEvent(activity)
  const { t, i18n } = useTranslation('activity')
  const locale = i18n.resolvedLanguage ?? i18n.language ?? 'en'

  if (isTemporalTransfer) {
    switch (data.status) {
      case 'failed':
        return t('status.failed', { defaultValue: 'Failed' })
      case 'cancelled':
        return t('status.cancelled', { defaultValue: 'Cancelled' })
      case 'confirmed':
        return created_at.toLocaleString(locale)
      default:
        return <Spinner size="small" color={'$color11'} />
    }
  }

  return created_at.toLocaleString(locale)
}
