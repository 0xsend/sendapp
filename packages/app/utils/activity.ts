import {
  baseMainnet,
  sendtagCheckoutAddress,
  sendTokenV0Address,
  sendTokenV0LockboxAddress,
  tokenPaymasterAddress,
} from '@my/wagmi'
import { sendCoin, sendV0Coin } from 'app/data/coins'
import type { Activity } from 'app/utils/zod/activity'
import { EventArraySchema } from 'app/utils/zod/activity'
import { formatUnits, isAddressEqual } from 'viem'
import formatAmount from './formatAmount'
import { pgAddrCondValues } from './pgAddrCondValues'
import { shorten, squish } from './strings'
import type { AddressBook } from './useAddressBook'
import { ContractLabels } from './useAddressBook'
import {
  isReferralsEvent,
  isSendAccountTransfersEvent,
  isTagReceiptsEvent,
  isTagReceiptUSDCEvent,
  VirtualEvents,
} from './zod/activity'
import { isSendAccountReceiveEvent } from './zod/activity/SendAccountReceiveEventSchema'
import { isSendTokenUpgradeEvent } from './zod/activity/SendAccountTransfersEventSchema'
import {
  isTemporalEthTransfersEvent,
  isTemporalTokenTransfersEvent,
  temporalEventNameFromStatus,
} from './zod/activity/TemporalTransfersEventSchema'
import type { SwapRouter } from 'app/utils/zod/SwapRouterSchema'
import type { LiquidityPool } from 'app/utils/zod/LiquidityPoolSchema'
import { SENDPOT_CONTRACT_ADDRESS } from 'app/data/sendpot'
import { isSendEarnEvent } from './zod/activity/SendEarnEventSchema'

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
        return `${amount} ${coin.symbol}`
      }
      return formatAmount(`${v}`, 5, 0)
    }
    case isTemporalEthTransfersEvent(activity): {
      const { value, coin } = activity.data
      if (coin) {
        const amount = formatAmount(formatUnits(value, coin.decimals), 5, coin.formatDecimals)
        return `${amount} ${coin.symbol}`
      }
      return formatAmount(`${value}`, 5, 0)
    }
    case isSendAccountTransfersEvent(activity) || isSendEarnEvent(activity): {
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

          return `${amount} ${coin.symbol}`
        }

        const amount = formatAmount(formatUnits(v, coin.decimals), 5, coin.formatDecimals)

        return `${isSellTransfer ? '- ' : ''}${amount} ${coin.symbol}`
      }
      return formatAmount(`${v}`, 5, 0)
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
  isTemporalTokenTransfersEvent(activity) ||
  isTemporalEthTransfersEvent(activity) ||
  isSendAccountTransfersEvent(activity) ||
  isSendAccountReceiveEvent(activity)
    ? activity.data.note ?? null
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

  const isEthBuy =
    data.sender &&
    swapRouters.some((swapRouter) => isAddressEqual(data.sender, swapRouter.router_addr))

  const isErc20Buy =
    data.f && swapRouters.some((swapRouter) => isAddressEqual(data.f, swapRouter.router_addr))

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

  return Boolean(
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
 * @returns
 */
export function eventNameFromActivity(
  activity: Activity,
  swapRouters: SwapRouter[] = [],
  liquidityPools: LiquidityPool[] = []
) {
  const { event_name, from_user, to_user, data } = activity
  const isERC20Transfer = isSendAccountTransfersEvent(activity)
  const isETHReceive = isSendAccountReceiveEvent(activity)
  const isTransferOrReceive = isERC20Transfer || isETHReceive
  const isTemporalTransfer =
    isTemporalEthTransfersEvent(activity) || isTemporalTokenTransfersEvent(activity)
  const isSwapTransfer = isActivitySwapTransfer(activity, swapRouters, liquidityPools)

  switch (true) {
    case isSendPotTicketPurchase(activity):
      return 'Ticket Purchase'
    case isSendPotWin(activity):
      return 'SendPot Win'
    // Virtual events (client-side processed)
    case event_name === VirtualEvents.SendEarnDeposit:
      return 'Send Earn Deposit'
    case event_name === VirtualEvents.SendEarnWithdraw:
      return 'Send Earn Withdraw'

    // Database events
    case isTemporalTransfer:
      return temporalEventNameFromStatus(data.status)
    case isERC20Transfer && isAddressEqual(data.f, sendtagCheckoutAddress[baseMainnet.id]):
      return 'Revenue Share'
    case isSendTokenUpgradeEvent(activity):
      return 'Send Token Upgrade'
    case isERC20Transfer && to_user?.send_id === undefined:
      if (isSwapTransfer) {
        return 'Trade'
      }
      return 'Withdraw'
    case isTransferOrReceive && from_user === null:
      if (isSwapTransfer) {
        return 'Trade'
      }
      return 'Deposit'
    case isTransferOrReceive && !!to_user?.id:
      return 'Received'
    case isTransferOrReceive && !!from_user?.id:
      return 'Sent'
    case isTagReceiptsEvent(activity) || isTagReceiptUSDCEvent(activity):
      return 'Sendtag Registered'
    case isReferralsEvent(activity) && !!from_user?.id:
      return 'Referral'
    case isReferralsEvent(activity) && !!to_user?.id:
      return 'Referred By'

    default:
      return event_name // catch-all i_am_rick_james -> I Am Rick James
        .split('_')
        .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
        .join(' ')
  }
}

/**
 * Returns the human-readable phrase for event name of the activity for activity details.
 * @param activity - The activity to check.
 * @param swapRouters - Optional list of swap routers to validate the activity against.
 * @param liquidityPools - Optional list of liquidity pools to validate the activity against.
 * @returns
 */
export function phraseFromActivity(
  activity: Activity,
  swapRouters: SwapRouter[] = [],
  liquidityPools: LiquidityPool[] = []
) {
  const { event_name, from_user, to_user, data } = activity
  const isERC20Transfer = isSendAccountTransfersEvent(activity)
  const isETHReceive = isSendAccountReceiveEvent(activity)
  const isTransferOrReceive = isERC20Transfer || isETHReceive
  const isTemporalTransfer =
    isTemporalEthTransfersEvent(activity) || isTemporalTokenTransfersEvent(activity)
  const isSwapTransfer = isActivitySwapTransfer(activity, swapRouters, liquidityPools)

  switch (true) {
    case isSendPotTicketPurchase(activity):
      return 'Bought Tickets'
    // Virtual events (client-side processed)
    case event_name === VirtualEvents.SendEarnDeposit:
      return 'Deposited to Send Earn'
    case event_name === VirtualEvents.SendEarnWithdraw:
      return 'Withdrew from Send Earn'

    // Database events
    case isTemporalTransfer:
      return temporalEventNameFromStatus(data.status)
    case isERC20Transfer && isAddressEqual(data.f, sendtagCheckoutAddress[baseMainnet.id]):
      return 'Earned revenue share'
    case isSendTokenUpgradeEvent(activity):
      return 'Upgraded'
    case isERC20Transfer && to_user?.send_id === undefined:
      if (isSwapTransfer) {
        return 'Trade'
      }
      return 'Withdrew'
    case isTransferOrReceive && from_user === null:
      if (isSwapTransfer) {
        return 'Trade'
      }
      return 'Deposited'
    case isTransferOrReceive && !!to_user?.id:
      return 'Sent you'
    case isTransferOrReceive && !!from_user?.id:
      return 'Received'
    case isTagReceiptsEvent(activity) || isTagReceiptUSDCEvent(activity):
      return data.tags?.length > 1 ? 'Sendtags created' : 'Sendtag created'
    case isReferralsEvent(activity) && !!from_user?.id:
      return 'Referred'
    case isReferralsEvent(activity) && !!to_user?.id:
      return 'Referred you'
    default:
      return event_name
        .split('_')
        .join(' ')
        .replace(/^./, (char) => char.toUpperCase())
  }
}

/**
 * Returns the subtext of the activity if there is one.
 */
export function subtextFromActivity(
  activity: Activity,
  swapRouters: SwapRouter[] = [],
  liquidityPools: LiquidityPool[] = []
): string | null {
  const _user = counterpart(activity)
  const { from_user, to_user, data } = activity
  const isERC20Transfer = isSendAccountTransfersEvent(activity)
  const isETHReceive = isSendAccountReceiveEvent(activity)
  const isSwapTransfer = isActivitySwapTransfer(activity, swapRouters, liquidityPools)

  if (isSendPotTicketPurchase(activity)) {
    return null // No subtext for ticket purchases
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
  return null
}

/**
 * Returns the name of the user from the activity user.
 * The cascading fallback is to:
 * 1. First, sendtag
 * 2. 2nd, profile name
 * 3. 3rd, Send ID
 */
export function userNameFromActivityUser(
  user: Activity['from_user'] | Activity['to_user']
): string {
  switch (true) {
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
 * Processes an activity to determine if its event_name should be overridden based on contextual data.
 * This allows for more accurate event classification without changing the database schema.
 *
 * @param activity The original activity from the database
 * @param addressBook The address book containing known addresses and their labels
 * @returns A processed activity with potentially modified event_name
 */
export function processActivity(activity: Activity, addressBook: AddressBook): Activity {
  // Clone the activity to avoid mutating the original
  const processedActivity = { ...activity }

  // Rule 1: Send Account Transfer to Send Earn Vault should be a Send Earn Deposit
  if (
    isSendAccountTransfersEvent(activity) &&
    activity.to_user?.send_id === undefined && // Currently identified as a "Withdraw"
    addressBook[activity.data.t] === ContractLabels.SendEarn // Destination is a Send Earn vault
  ) {
    // Override the event_name to our virtual event type
    processedActivity.event_name = VirtualEvents.SendEarnDeposit
  }

  // Rule 2: Send Account Transfer from Send Earn Vault should be a Send Earn Withdraw
  if (
    isSendAccountTransfersEvent(activity) &&
    addressBook[activity.data.f] === ContractLabels.SendEarn // Source is a Send Earn vault
  ) {
    // Override the event_name to our virtual event type
    processedActivity.event_name = VirtualEvents.SendEarnWithdraw
  }

  return processedActivity
}

/**
 * Processes an array of activities using the processActivity function.
 *
 * @param activities Array of activities from the database
 * @param addressBook The address book containing known addresses and their labels
 * @returns Array of processed activities
 */
export function processActivities(activities: Activity[], addressBook: AddressBook): Activity[] {
  return activities.map((activity) => processActivity(activity, addressBook))
}

/**
 * Centralized function to parse and process activity data from the database.
 * This function handles both the parsing of raw data and the contextual processing
 * to identify special cases like Send Earn deposits and withdrawals.
 *
 * @param data Raw data from the database
 * @param options Processing options
 * @param options.addressBook Address book for contextual processing
 * @returns Processed activities with potentially modified event types
 */
export function parseAndProcessActivities(
  data: unknown,
  options: {
    addressBook?: AddressBook
    // Future parameters can be added here
  } = {}
): Activity[] {
  // Parse the raw data using the Zod schema
  const activities = EventArraySchema.parse(data)

  // Process activities if addressBook is available
  if (options.addressBook) {
    const processed = processActivities(activities, options.addressBook)
    return processed
  }

  return activities
}

/**
 * Creates base filtering conditions for activity feed queries to exclude system addresses
 * like paymasters that should be filtered from activity displays.
 *
 * @param customFromIgnore - Additional addresses to ignore in 'from' field
 * @param customToIgnore - Additional addresses to ignore in 'to' field
 * @returns SQL condition string for use in Supabase queries
 */

export function getBaseAddressFilterCondition(
  customFromIgnore: `0x${string}`[] = [],
  customToIgnore: `0x${string}`[] = []
): string {
  const paymasterAddresses = Object.values(tokenPaymasterAddress)
  const sendTokenV0LockboxAddresses = Object.values(sendTokenV0LockboxAddress)

  // Base addresses to ignore in 'from' field
  const fromIgnoreAddresses = [
    ...paymasterAddresses, // show fees on send screen instead
    ...customFromIgnore,
  ]

  // Base addresses to ignore in 'to' field
  const toIgnoreAddresses = [
    ...paymasterAddresses, // show fees on send screen instead
    ...sendTokenV0LockboxAddresses, // will instead show the "mint"
    ...customToIgnore,
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
