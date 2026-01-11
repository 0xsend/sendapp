/**
 * Type definitions for push notification payloads and handling.
 *
 * These types define the structure of notification data sent from the backend
 * via Expo Push Service and handled by the mobile app.
 */

/** Notification types for different transfer events */
export type NotificationType =
  | 'transfer_received'
  | 'transfer_sent'
  | 'sendtag_purchase'
  | 'send_earn_deposit'
  | 'send_earn_withdraw'
  | 'referral_bonus'
  | 'system'

/** Base notification data included in all notifications */
export interface BaseNotificationData {
  /** Type of notification for routing */
  type: NotificationType
  /** Optional deep link route to navigate to */
  route?: string
  /** User ID the notification is for */
  userId?: string
  /** Timestamp when notification was created */
  createdAt?: string
}

/** Transfer notification data (received/sent) */
export interface TransferNotificationData extends BaseNotificationData {
  type: 'transfer_received' | 'transfer_sent'
  /** Transaction hash for lookup */
  txHash?: string
  /** Activity ID for navigating to detail screen */
  activityId?: string
  /** Send ID of the counterparty */
  sendId?: number
  /** Amount transferred (display string) */
  amount?: string
  /** Token symbol (e.g., 'USDC', 'SEND') */
  tokenSymbol?: string
}

/** SendEarn event notification data */
export interface SendEarnNotificationData extends BaseNotificationData {
  type: 'send_earn_deposit' | 'send_earn_withdraw'
  /** Amount involved in the operation */
  amount?: string
  /** Token symbol */
  tokenSymbol?: string
  /** Vault address */
  vaultAddress?: string
}

/** Sendtag purchase notification */
export interface SendtagNotificationData extends BaseNotificationData {
  type: 'sendtag_purchase'
  /** The purchased sendtag */
  sendtag?: string
}

/** Referral bonus notification */
export interface ReferralNotificationData extends BaseNotificationData {
  type: 'referral_bonus'
  /** Bonus amount */
  amount?: string
  /** Referral tier */
  tier?: string
}

/** System notification for announcements */
export interface SystemNotificationData extends BaseNotificationData {
  type: 'system'
  /** Action to take (e.g., 'update_app', 'view_announcement') */
  action?: string
  /** URL for external action */
  url?: string
}

/** Union of all notification data types */
export type NotificationData =
  | TransferNotificationData
  | SendEarnNotificationData
  | SendtagNotificationData
  | ReferralNotificationData
  | SystemNotificationData
  | BaseNotificationData

/**
 * Type guard to check if notification is a transfer notification
 */
export function isTransferNotification(data: NotificationData): data is TransferNotificationData {
  return data.type === 'transfer_received' || data.type === 'transfer_sent'
}

/**
 * Type guard to check if notification is a SendEarn notification
 */
export function isSendEarnNotification(data: NotificationData): data is SendEarnNotificationData {
  return data.type === 'send_earn_deposit' || data.type === 'send_earn_withdraw'
}

/**
 * Type guard to check if notification is a sendtag notification
 */
export function isSendtagNotification(data: NotificationData): data is SendtagNotificationData {
  return data.type === 'sendtag_purchase'
}

/**
 * Type guard to check if notification is a referral notification
 */
export function isReferralNotification(data: NotificationData): data is ReferralNotificationData {
  return data.type === 'referral_bonus'
}

/**
 * Type guard to check if notification is a system notification
 */
export function isSystemNotification(data: NotificationData): data is SystemNotificationData {
  return data.type === 'system'
}

/** iOS notification categories for quick actions */
export const NotificationCategories = {
  TRANSFER: 'transfer',
  SEND_EARN: 'send_earn',
  SYSTEM: 'system',
} as const

/** iOS notification actions */
export const NotificationActions = {
  VIEW: 'view',
  DISMISS: 'dismiss',
  REPLY: 'reply',
} as const

/** Android notification channel IDs */
export const AndroidNotificationChannels = {
  DEFAULT: 'default',
  TRANSFERS: 'transfers',
  SEND_EARN: 'send_earn',
  SYSTEM: 'system',
} as const

export type AndroidNotificationChannel =
  (typeof AndroidNotificationChannels)[keyof typeof AndroidNotificationChannels]
