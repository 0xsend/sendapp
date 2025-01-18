import { formatUnits, isAddressEqual } from 'viem'
import formatAmount, { localizeAmount } from './formatAmount'
import {
  isTagReceiptsEvent,
  isReferralsEvent,
  isSendAccountTransfersEvent,
  isTagReceiptUSDCEvent,
} from './zod/activity'
import type { Activity } from 'app/utils/zod/activity'
import { isSendAccountReceiveEvent } from './zod/activity/SendAccountReceiveEventSchema'
import { baseMainnet, sendtagCheckoutAddress, tokenPaymasterAddress } from '@my/wagmi'
import { shorten } from './strings'

const wagmiAddresWithLabel = (addresses: `0x${string}`[], label: string) =>
  Object.values(addresses).map((a) => [a, label])

const AddressLabels = {
  ...Object.fromEntries(wagmiAddresWithLabel(Object.values(tokenPaymasterAddress), 'Paymaster')),
  ...Object.fromEntries(
    wagmiAddresWithLabel(Object.values(sendtagCheckoutAddress), 'Sendtag Checkout')
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
  return null // not a send or receive event
}

/**
 * Returns the amount of the activity if there is one.
 */
export function amountFromActivity(activity: Activity): string {
  switch (true) {
    case isSendAccountTransfersEvent(activity): {
      const { v, coin } = activity.data
      if (coin) {
        const amount = localizeAmount(formatUnits(v, coin.decimals))
        return `${amount} ${coin.symbol}`
      }
      return formatAmount(`${v}`, 5, 0)
    }
    case isSendAccountReceiveEvent(activity): {
      const { coin } = activity.data
      if (coin) {
        const amount = localizeAmount(formatUnits(activity.data.value, coin.decimals))
        return `${amount} ${coin.symbol}`
      }
      return formatAmount(`${activity.data.value}`, 5, 0)
    }
    case isTagReceiptsEvent(activity) || isTagReceiptUSDCEvent(activity): {
      const data = activity.data
      const amount = localizeAmount(formatUnits(data.value, data.coin.decimals))
      return `${amount} ${data.coin.symbol}`
    }
    case isReferralsEvent(activity) && !!activity.from_user?.id: {
      // only show if the user is the referrer
      const data = activity.data
      return `${data.tags.length} ${data.tags.length > 1 ? 'Referrals' : 'Referral'}`
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

/**
 * Returns the human readable event name of the activity.
 * @param activity
 * @returns
 */
export function eventNameFromActivity(activity: Activity) {
  const { event_name, from_user, to_user, data } = activity
  const isERC20Transfer = isSendAccountTransfersEvent(activity)
  const isETHReceive = isSendAccountReceiveEvent(activity)
  const isTransferOrReceive = isERC20Transfer || isETHReceive
  switch (true) {
    case isERC20Transfer && isAddressEqual(data.f, sendtagCheckoutAddress[baseMainnet.id]):
      return 'Referral Reward'
    case isERC20Transfer && to_user?.send_id === undefined:
      return 'Withdraw'
    case isTransferOrReceive && from_user === null:
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
 * @param activity
 * @returns
 */
export function phraseFromActivity(activity: Activity) {
  const { event_name, from_user, to_user, data } = activity
  const isERC20Transfer = isSendAccountTransfersEvent(activity)
  const isETHReceive = isSendAccountReceiveEvent(activity)
  const isTransferOrReceive = isERC20Transfer || isETHReceive

  switch (true) {
    case isERC20Transfer && isAddressEqual(data.f, sendtagCheckoutAddress[baseMainnet.id]):
      return 'Earned referral reward'
    case isERC20Transfer && to_user?.send_id === undefined:
      return 'Withdrew'
    case isTransferOrReceive && from_user === null:
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
export function subtextFromActivity(activity: Activity): string | null {
  const _user = counterpart(activity)
  const { from_user, to_user, data } = activity
  const isERC20Transfer = isSendAccountTransfersEvent(activity)
  const isETHReceive = isSendAccountReceiveEvent(activity)
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
