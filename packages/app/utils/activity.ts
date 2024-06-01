import { formatUnits } from 'viem'
import formatAmount from './formatAmount'
import { isTagReceiptsEvent, isReferralsEvent, isSendAccountTransfersEvent } from './zod/activity'
import type { Activity } from 'app/utils/zod/activity'

/**
 * Returns the counterpart of the activity which could be the logged in user.
 * If the activity is a send account transfer,
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
  if (isReferralsEvent(activity)) {
    return to_user // show the referred
  }
  if (isSendAccountTransfersEvent(activity)) {
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
    case isTagReceiptsEvent(activity): {
      const data = activity.data
      const amount = formatUnits(data.value, data.coin.decimals)
      return `${amount} ${data.coin.symbol}`
    }
    case isReferralsEvent(activity): {
      const data = activity.data
      return `${data.tags.length} Referrals`
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
  switch (true) {
    case isSendAccountTransfersEvent(activity) && !!to_user?.id:
      return 'Received'
    case isSendAccountTransfersEvent(activity) && !!from_user?.id:
      return 'Sent'
    case isTagReceiptsEvent(activity):
      return 'Sendtag Registered'
    case isReferralsEvent(activity):
      return 'Referral'
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
  if (isTagReceiptsEvent(activity) || isReferralsEvent(activity)) {
    return activity.data.tags.map((t) => `@${t}`).join(', ')
  }
  if (_user) {
    if (_user.tags?.[0]) {
      return `@${_user.tags[0]}`
    }
    return `#${_user.send_id}`
  }
  if (isSendAccountTransfersEvent(activity) && from_user?.id) {
    return activity.data.t
  }
  if (isSendAccountTransfersEvent(activity) && to_user?.id) {
    return activity.data.f
  }
  return null
}
