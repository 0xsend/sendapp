export type BaseNotificationData = {
  route?: string
  path?: string
  userId?: string
  createdAt?: string
}

export type TransferNotificationData = BaseNotificationData & {
  type: 'transfer_received' | 'transfer_sent'
  txHash?: string
  activityId?: string
  sendId?: number
  amount?: string
  tokenSymbol?: string
}

export type SendEarnNotificationData = BaseNotificationData & {
  type: 'send_earn_deposit' | 'send_earn_withdraw'
  amount?: string
  tokenSymbol?: string
  vaultAddress?: string
}

export type SendtagNotificationData = BaseNotificationData & {
  type: 'sendtag_purchase'
  sendtag?: string
}

export type ReferralNotificationData = BaseNotificationData & {
  type: 'referral_bonus'
  amount?: string
  tier?: string
}

export type SystemNotificationData = BaseNotificationData & {
  type: 'system'
  action?: string
  url?: string
}

export type UnknownNotificationData = BaseNotificationData & {
  // Keep this broad so callers can safely handle unknown notification types.
  type: string
}

export type NotificationData =
  | TransferNotificationData
  | SendEarnNotificationData
  | SendtagNotificationData
  | ReferralNotificationData
  | SystemNotificationData
  | UnknownNotificationData

export function isTransferNotification(data: NotificationData): data is TransferNotificationData {
  return data.type === 'transfer_received' || data.type === 'transfer_sent'
}

export function isSendEarnNotification(data: NotificationData): data is SendEarnNotificationData {
  return data.type === 'send_earn_deposit' || data.type === 'send_earn_withdraw'
}

export function isSendtagNotification(data: NotificationData): data is SendtagNotificationData {
  return data.type === 'sendtag_purchase'
}

export function isReferralNotification(data: NotificationData): data is ReferralNotificationData {
  return data.type === 'referral_bonus'
}

export function isSystemNotification(data: NotificationData): data is SystemNotificationData {
  return data.type === 'system'
}

export const AndroidNotificationChannels = {
  DEFAULT: 'default',
  TRANSFERS: 'transfers',
  SEND_EARN: 'send_earn',
  SYSTEM: 'system',
} as const

export type AndroidNotificationChannelId =
  (typeof AndroidNotificationChannels)[keyof typeof AndroidNotificationChannels]
