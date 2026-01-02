import { router } from 'expo-router'
import type { NotificationData } from 'app/types/notification-types'
import {
  isTransferNotification,
  isSendEarnNotification,
  isSendtagNotification,
  isReferralNotification,
  isSystemNotification,
} from 'app/types/notification-types'
import debug from 'debug'

const log = debug('app:navigation:notification')

/**
 * Navigate to the appropriate screen based on notification data.
 *
 * Handles different notification types and routes to the correct
 * screen with the appropriate parameters.
 *
 * @param data - The notification data containing routing information
 */
export function navigateFromNotification(data: NotificationData): void {
  log('Navigating from notification:', data)

  // If explicit route provided, use it directly
  if (data.route) {
    log('Using explicit route:', data.route)
    router.push(data.route as Parameters<typeof router.push>[0])
    return
  }

  // Handle specific notification types
  if (isTransferNotification(data)) {
    navigateToTransfer(data)
    return
  }

  if (isSendEarnNotification(data)) {
    navigateToSendEarn(data)
    return
  }

  if (isSendtagNotification(data)) {
    navigateToSendtag(data)
    return
  }

  if (isReferralNotification(data)) {
    navigateToReferrals()
    return
  }

  if (isSystemNotification(data)) {
    navigateFromSystemNotification(data)
    return
  }

  // Fallback: navigate to activity screen
  log('Falling back to activity screen')
  router.push('/activity')
}

/**
 * Navigate to transfer-related screens
 */
function navigateToTransfer(
  data: Extract<NotificationData, { type: 'transfer_received' | 'transfer_sent' }>
): void {
  log('Navigating to transfer:', data)

  // If we have a sendId, navigate to their profile history
  if (data.sendId) {
    router.push(`/profile/${data.sendId}/history`)
    return
  }

  // If we have activity details, navigate to activity details screen
  if (data.activityId || data.txHash) {
    // Navigate to activity tab - details can be opened from there
    router.push('/activity')
    return
  }

  // Default to activity screen
  router.push('/activity')
}

/**
 * Navigate to SendEarn screens
 */
function navigateToSendEarn(
  data: Extract<NotificationData, { type: 'send_earn_deposit' | 'send_earn_withdraw' }>
): void {
  log('Navigating to SendEarn:', data)
  // Navigate to earn screen
  router.push('/earn')
}

/**
 * Navigate to Sendtag-related screens
 */
function navigateToSendtag(data: Extract<NotificationData, { type: 'sendtag_purchase' }>): void {
  log('Navigating to Sendtag:', data)
  // Navigate to profile to see the new sendtag
  router.push('/profile')
}

/**
 * Navigate to referrals screen
 */
function navigateToReferrals(): void {
  log('Navigating to referrals')
  router.push('/rewards')
}

/**
 * Handle system notification navigation
 */
function navigateFromSystemNotification(data: Extract<NotificationData, { type: 'system' }>): void {
  log('Handling system notification:', data)

  switch (data.action) {
    case 'view_announcement':
      // Navigate to settings/announcements or home
      router.push('/')
      break
    case 'update_app':
      // Navigate to settings
      router.push('/settings')
      break
    default:
      // Default to home
      router.push('/')
  }
}

/**
 * Parse notification data from unknown payload.
 *
 * Safely extracts and validates notification data from an expo-notifications
 * payload which may have unknown structure.
 *
 * @param payload - Raw notification data payload
 * @returns Parsed notification data or null if invalid
 */
export function parseNotificationData(payload: unknown): NotificationData | null {
  if (!payload || typeof payload !== 'object') {
    log('Invalid payload: not an object')
    return null
  }

  const data = payload as Record<string, unknown>

  // Validate type field exists and is a known type
  if (typeof data.type !== 'string') {
    log('Invalid payload: missing type field')
    return null
  }

  const validTypes = [
    'transfer_received',
    'transfer_sent',
    'sendtag_purchase',
    'send_earn_deposit',
    'send_earn_withdraw',
    'referral_bonus',
    'system',
  ]

  if (!validTypes.includes(data.type)) {
    log('Unknown notification type:', data.type)
    // Return as base notification data with the type
    return {
      type: data.type as NotificationData['type'],
      route: typeof data.route === 'string' ? data.route : undefined,
      userId: typeof data.userId === 'string' ? data.userId : undefined,
      createdAt: typeof data.createdAt === 'string' ? data.createdAt : undefined,
    }
  }

  // Build validated notification data based on type
  const baseData = {
    type: data.type as NotificationData['type'],
    route: typeof data.route === 'string' ? data.route : undefined,
    userId: typeof data.userId === 'string' ? data.userId : undefined,
    createdAt: typeof data.createdAt === 'string' ? data.createdAt : undefined,
  }

  // Add type-specific fields
  if (data.type === 'transfer_received' || data.type === 'transfer_sent') {
    return {
      ...baseData,
      type: data.type,
      txHash: typeof data.txHash === 'string' ? data.txHash : undefined,
      activityId: typeof data.activityId === 'string' ? data.activityId : undefined,
      sendId: typeof data.sendId === 'number' ? data.sendId : undefined,
      amount: typeof data.amount === 'string' ? data.amount : undefined,
      tokenSymbol: typeof data.tokenSymbol === 'string' ? data.tokenSymbol : undefined,
    }
  }

  if (data.type === 'send_earn_deposit' || data.type === 'send_earn_withdraw') {
    return {
      ...baseData,
      type: data.type,
      amount: typeof data.amount === 'string' ? data.amount : undefined,
      tokenSymbol: typeof data.tokenSymbol === 'string' ? data.tokenSymbol : undefined,
      vaultAddress: typeof data.vaultAddress === 'string' ? data.vaultAddress : undefined,
    }
  }

  if (data.type === 'sendtag_purchase') {
    return {
      ...baseData,
      type: data.type,
      sendtag: typeof data.sendtag === 'string' ? data.sendtag : undefined,
    }
  }

  if (data.type === 'referral_bonus') {
    return {
      ...baseData,
      type: data.type,
      amount: typeof data.amount === 'string' ? data.amount : undefined,
      tier: typeof data.tier === 'string' ? data.tier : undefined,
    }
  }

  if (data.type === 'system') {
    return {
      ...baseData,
      type: data.type,
      action: typeof data.action === 'string' ? data.action : undefined,
      url: typeof data.url === 'string' ? data.url : undefined,
    }
  }

  // Fallback to base data
  return baseData
}

/**
 * Get the notification channel for Android based on notification type.
 *
 * @param type - The notification type
 * @returns The Android notification channel ID
 */
export function getNotificationChannelId(type: NotificationData['type']): string {
  switch (type) {
    case 'transfer_received':
    case 'transfer_sent':
      return 'transfers'
    case 'send_earn_deposit':
    case 'send_earn_withdraw':
      return 'send_earn'
    case 'system':
      return 'system'
    default:
      return 'default'
  }
}
