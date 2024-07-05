import { formatUnits } from 'viem'
import formatAmount from './formatAmount'
import { isTagReceiptsEvent, isReferralsEvent, isSendAccountTransfersEvent } from './zod/activity'
import type { Activity } from 'app/utils/zod/activity'
import { isSendAccountReceiveEvent } from './zod/activity/SendAccountReceiveEventSchema'
import { tokenPaymasterAddress } from '@my/wagmi'

const wagmiAddresWithLabel = (addresses: `0x${string}`[], label: string) =>
  Object.values(addresses).map((a) => [a, label])

const AddressLabels = {
  ...Object.fromEntries(wagmiAddresWithLabel(Object.values(tokenPaymasterAddress), 'Paymaster')),
}

const labelAddress = (address: `0x${string}`): string => AddressLabels[address] ?? address

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
        const amount = formatUnits(v, coin.decimals)
        return `${amount} ${coin.symbol}`
      }
      return formatAmount(`${v}`, 5, 0)
    }
    case isSendAccountReceiveEvent(activity): {
      const { coin } = activity.data
      if (coin) {
        const amount = formatUnits(activity.data.value, coin.decimals)
        return `${amount} ${coin.symbol}`
      }
      return formatAmount(`${activity.data.value}`, 5, 0)
    }
    case isTagReceiptsEvent(activity): {
      const data = activity.data
      const amount = formatUnits(data.value, data.coin.decimals)
      return `${amount} ${data.coin.symbol}`
    }
    case isReferralsEvent(activity) && !!activity.from_user?.id: {
      // only show if the user is the referrer
      const data = activity.data
      return `${data.tags.length} Referrals`
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
  const { event_name, from_user, to_user } = activity
  const isTransferOrReceive =
    isSendAccountTransfersEvent(activity) || isSendAccountReceiveEvent(activity)
  switch (true) {
    case isTransferOrReceive && !!to_user?.id:
      return 'Received'
    case isTransferOrReceive && !!from_user?.id:
      return 'Sent'
    case isTagReceiptsEvent(activity):
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
 * Returns the subtext of the activity if there is one.
 */
export function subtextFromActivity(activity: Activity): string | null {
  const _user = counterpart(activity)
  const { from_user, to_user } = activity
  if (isTagReceiptsEvent(activity)) {
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
  if (isSendAccountTransfersEvent(activity) && from_user?.id) {
    return labelAddress(activity.data.t)
  }
  if (isSendAccountReceiveEvent(activity) && from_user?.id) {
    return labelAddress(activity.data.sender)
  }
  if (isSendAccountTransfersEvent(activity) && to_user?.id) {
    return labelAddress(activity.data.f)
  }
  if (isSendAccountReceiveEvent(activity) && to_user?.id) {
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
