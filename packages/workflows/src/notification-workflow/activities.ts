import { bootstrap } from '@my/workflows/utils'
import { ApplicationFailure, log } from '@temporalio/activity'
import type { Address } from 'viem'
import { formatUnits } from 'viem'
import type { Json } from '@my/supabase/database.types'
import webpush from 'web-push'

function redactId(id: string): string {
  if (!id) return ''
  return id.length > 12 ? `${id.slice(0, 8)}...` : `${id.slice(0, 4)}...`
}

function redactHex(value: string): string {
  if (typeof value !== 'string') return ''
  if (value.length <= 14) return value
  return `${value.slice(0, 8)}...${value.slice(-6)}`
}

function getWebPushHost(endpoint: string): string {
  try {
    return new URL(endpoint).hostname
  } catch {
    return 'unknown'
  }
}
import {
  getUserPushTokens,
  getUserIdFromAddress,
  createNotification,
  getUserMainTagName,
  markTokenInactive,
} from './supabase'
import type {
  TransferNotificationParams,
  PushNotificationPayload,
  InAppNotificationPayload,
  SendPushResult,
  CreateNotificationResult,
  NotificationType,
  PushToken,
  ExpoPushMessage,
  ExpoPushTicket,
} from './types'
import {
  sanitizeTitle,
  sanitizeBody,
  sanitizeNotificationData,
  isValidExpoPushToken,
  isValidWebPushEndpoint,
  MAX_TITLE_LENGTH,
  MAX_BODY_LENGTH,
} from './validation'
import { allCoinsDict } from 'app/data/coins'
import formatAmount, { localizeAmount } from 'app/utils/formatAmount'

type NotificationActivities = {
  /**
   * Send push notifications to all registered devices for a user
   */
  sendPushNotificationActivity: (payload: PushNotificationPayload) => Promise<SendPushResult>

  /**
   * Create an in-app notification record
   */
  createInAppNotificationActivity: (
    payload: InAppNotificationPayload
  ) => Promise<CreateNotificationResult>

  /**
   * Notify recipient of a received transfer
   */
  notifyTransferReceivedActivity: (params: TransferNotificationParams) => Promise<void>

  /**
   * Notify sender of a sent transfer
   */
  notifyTransferSentActivity: (params: TransferNotificationParams) => Promise<void>

  /**
   * Get user ID from wallet address
   */
  getUserIdFromAddressActivity: (address: Address) => Promise<string | null>
}

export const createNotificationActivities = (
  env: Record<string, string | undefined>
): NotificationActivities => {
  bootstrap(env)

  // Capture VAPID keys from env for use in activities
  const vapidConfig = {
    publicKey: env.VAPID_PUBLIC_KEY,
    privateKey: env.VAPID_PRIVATE_KEY,
    subject: env.VAPID_SUBJECT,
  }

  return {
    sendPushNotificationActivity: (payload) => sendPushNotificationActivity(payload, vapidConfig),
    createInAppNotificationActivity,
    notifyTransferReceivedActivity: (params) => notifyTransferReceivedActivity(params, vapidConfig),
    notifyTransferSentActivity: (params) => notifyTransferSentActivity(params, vapidConfig),
    getUserIdFromAddressActivity,
  }
}

const EXPO_PUSH_API_URL = 'https://exp.host/--/api/v2/push/send'
const EXPO_RECEIPTS_API_URL = 'https://exp.host/--/api/v2/push/getReceipts'

/** Web push TTL (time to live) in seconds - 24 hours */
const WEB_PUSH_TTL = 24 * 60 * 60

/** Web push urgency - high for important notifications */
const WEB_PUSH_URGENCY = 'high' as const

/**
 * Send push notifications via Expo Push Service
 * Handles tokens from ios/android platforms that are in Expo format
 */
async function sendExpoNotifications(
  tokens: PushToken[],
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<{ sent: number; failed: number; errors: string[]; invalidTokenIds: number[] }> {
  // Filter for tokens that are in Expo push token format and validate
  // Expo platform covers both iOS and Android devices
  const expoTokens = tokens.filter(
    (t) => t.platform === 'expo' && t.token && isValidExpoPushToken(t.token)
  )

  if (expoTokens.length === 0) {
    return { sent: 0, failed: 0, errors: [], invalidTokenIds: [] }
  }

  // Sanitize title and body for push notifications
  const sanitizedTitle = sanitizeTitle(title)
  const sanitizedBody = sanitizeBody(body)
  const sanitizedData = sanitizeNotificationData(data)

  // Build messages for Expo Push Service
  // We know token.token is non-null from the filter above
  const messages: ExpoPushMessage[] = expoTokens.map((token) => ({
    to: token.token as string,
    sound: 'default',
    title: sanitizedTitle,
    body: sanitizedBody,
    data: sanitizedData,
    priority: 'high',
    channelId: 'default',
  }))

  log.info('Sending Expo push notifications', {
    count: messages.length,
    titleLength: sanitizedTitle.length,
  })

  let sent = 0
  let failed = 0
  const errors: string[] = []
  const invalidTokenIds: number[] = []

  try {
    // Send to Expo Push Service
    const response = await fetch(EXPO_PUSH_API_URL, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    })

    if (!response.ok) {
      const errorText = await response.text()
      log.error('Expo Push API error', { status: response.status, error: errorText })
      return {
        sent: 0,
        failed: expoTokens.length,
        errors: [`Expo API error: ${response.status}`],
        invalidTokenIds: [],
      }
    }

    const result = (await response.json()) as { data: ExpoPushTicket[] }
    const tickets = result.data

    // Process tickets to identify successful sends and invalid tokens
    for (let i = 0; i < tickets.length; i++) {
      const ticket = tickets[i]
      const token = expoTokens[i]

      if (!ticket) continue

      if (ticket.status === 'ok') {
        sent++
        log.info('Push notification sent successfully', {
          ticketId: ticket.id,
          tokenId: token?.id !== undefined ? Number(token.id) : undefined,
        })
      } else if (ticket.status === 'error') {
        failed++
        const errorMsg = ticket.message || 'Unknown Expo error'
        errors.push(errorMsg)

        log.error('Expo push notification failed', {
          error: errorMsg,
          details: ticket.details,
          tokenId: token?.id !== undefined ? Number(token.id) : undefined,
        })

        // Check for invalid token errors
        if (
          ticket.details?.error === 'DeviceNotRegistered' ||
          ticket.details?.error === 'InvalidCredentials'
        ) {
          if (token?.id !== undefined) {
            invalidTokenIds.push(Number(token.id))
          }
        }
      }
    }
  } catch (error) {
    log.error('Error calling Expo Push API', { error })
    return {
      sent: 0,
      failed: expoTokens.length,
      errors: [error instanceof Error ? error.message : 'Unknown error'],
      invalidTokenIds: [],
    }
  }

  return { sent, failed, errors, invalidTokenIds }
}

/**
 * Web Push subscription info from database
 */
type WebPushSubscription = {
  id: number
  endpoint: string
  p256dh: string
  auth: string
}

type VapidConfig = {
  publicKey: string | undefined
  privateKey: string | undefined
  subject: string | undefined
}

/**
 * Send web push notifications using the Web Push Protocol
 * Requires VAPID keys to be configured
 * Security: validates endpoints, sanitizes payloads, uses safe defaults
 */
async function sendWebPushNotifications(
  tokens: PushToken[],
  title: string,
  body: string,
  vapidConfig: VapidConfig,
  data?: Record<string, unknown>
): Promise<{
  sent: number
  failed: number
  errors: string[]
  invalidTokenIds: number[]
  skipped?: number
}> {
  // Filter for web push tokens with required fields and validate endpoints
  const webSubscriptions: WebPushSubscription[] = tokens
    .filter(
      (t): t is PushToken & { endpoint: string; p256dh: string; auth: string } =>
        t.platform === 'web' &&
        typeof t.endpoint === 'string' &&
        typeof t.p256dh === 'string' &&
        typeof t.auth === 'string' &&
        isValidWebPushEndpoint(t.endpoint)
    )
    .map((t) => ({
      id: Number(t.id),
      endpoint: t.endpoint,
      p256dh: t.p256dh,
      auth: t.auth,
    }))

  if (webSubscriptions.length === 0) {
    return { sent: 0, failed: 0, errors: [], invalidTokenIds: [] }
  }

  const {
    publicKey: vapidPublicKey,
    privateKey: vapidPrivateKey,
    subject: vapidSubject,
  } = vapidConfig

  if (!vapidPublicKey || !vapidPrivateKey || !vapidSubject) {
    log.warn('Web push VAPID keys not configured, skipping web push notifications', {
      subscriptionsSkipped: webSubscriptions.length,
    })
    // Return as skipped (not failed) - this is intentional in local dev environments
    return {
      sent: 0,
      failed: 0,
      errors: [],
      invalidTokenIds: [],
      skipped: webSubscriptions.length,
    }
  }

  // Sanitize title and body
  const sanitizedTitle = sanitizeTitle(title)
  const sanitizedBody = sanitizeBody(body)
  const sanitizedData = sanitizeNotificationData(data)

  log.info('Sending web push notifications', {
    count: webSubscriptions.length,
    titleLength: sanitizedTitle.length,
  })

  let sent = 0
  let failed = 0
  const errors: string[] = []
  const invalidTokenIds: number[] = []

  // Build the notification payload with sanitized data
  // Explicitly construct data without spread to prevent prototype pollution
  const resolvedPath =
    typeof sanitizedData.path === 'string'
      ? sanitizedData.path
      : typeof sanitizedData.route === 'string'
        ? sanitizedData.route
        : '/activity'

  const notificationData: Record<string, string | number | boolean | null> = {
    // Keep both keys for backwards compatibility across clients
    path: resolvedPath,
    route: resolvedPath,
    type: typeof sanitizedData.type === 'string' ? sanitizedData.type : null,
  }

  // Copy allowed keys from sanitized data
  for (const [key, value] of Object.entries(sanitizedData)) {
    if (key !== 'path' && key !== 'route' && key !== 'type') {
      notificationData[key] = value
    }
  }

  const payload = JSON.stringify({
    title: sanitizedTitle,
    options: {
      body: sanitizedBody,
      data: notificationData,
      tag: `send-${typeof sanitizedData.type === 'string' ? sanitizedData.type : 'notification'}`,
      renotify: true,
    },
  })

  // Send to each subscription using web-push library
  for (const subscription of webSubscriptions) {
    try {
      log.info('Sending web push notification', {
        subscriptionId: subscription.id,
        endpointHost: getWebPushHost(subscription.endpoint),
        payloadSize: payload.length,
      })

      await webpush.sendNotification(
        {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.p256dh,
            auth: subscription.auth,
          },
        },
        payload,
        {
          vapidDetails: {
            subject: vapidSubject,
            publicKey: vapidPublicKey,
            privateKey: vapidPrivateKey,
          },
          TTL: WEB_PUSH_TTL,
          urgency: WEB_PUSH_URGENCY,
        }
      )

      sent++
      log.info('Web push notification sent successfully', {
        subscriptionId: subscription.id,
      })
    } catch (error) {
      failed++
      const errorMsg = error instanceof Error ? error.message : 'Unknown web push error'
      errors.push(errorMsg)

      // Log without sensitive endpoint details
      log.error('Web push notification failed', {
        subscriptionId: subscription.id,
        errorType: error instanceof Error ? error.name : 'Unknown',
        // Only log status codes, not full error message which may contain sensitive info
        statusCode: errorMsg.match(/\b(4\d{2}|5\d{2})\b/)?.[0] || 'unknown',
      })

      // Check for invalid subscription errors (410 Gone, 404 Not Found)
      // Also handle 403 which can indicate expired or invalid subscriptions
      if (
        errorMsg.includes('410') ||
        errorMsg.includes('404') ||
        errorMsg.includes('403') ||
        errorMsg.includes('expired') ||
        errorMsg.includes('unsubscribed') ||
        errorMsg.includes('NotRegistered')
      ) {
        invalidTokenIds.push(subscription.id)
        log.info('Marking subscription as invalid for removal', {
          subscriptionId: subscription.id,
        })
      }
    }
  }

  return { sent, failed, errors, invalidTokenIds }
}

/**
 * Send push notifications to all registered devices for a user.
 * Supports Expo push notifications for iOS/Android and web push.
 */
async function sendPushNotificationActivity(
  payload: PushNotificationPayload,
  vapidConfig: VapidConfig
): Promise<SendPushResult> {
  const { userId, title, body, data } = payload

  log.info('Sending push notifications', { userId: redactId(userId), title })

  const tokens = await getUserPushTokens(userId)

  if (tokens.length === 0) {
    log.info('No push tokens found for user', { userId: redactId(userId) })
    return { success: true, sent: 0, failed: 0 }
  }

  let totalSent = 0
  let totalFailed = 0
  let totalSkipped = 0
  const allErrors: string[] = []
  const allInvalidTokenIds: number[] = []

  // Send Expo notifications (iOS/Android)
  const expoResult = await sendExpoNotifications(tokens, title, body, data)
  totalSent += expoResult.sent
  totalFailed += expoResult.failed
  allErrors.push(...expoResult.errors)
  allInvalidTokenIds.push(...expoResult.invalidTokenIds)

  // Send Web Push notifications
  const webResult = await sendWebPushNotifications(tokens, title, body, vapidConfig, data)
  totalSent += webResult.sent
  totalFailed += webResult.failed
  totalSkipped += webResult.skipped ?? 0
  allErrors.push(...webResult.errors)
  allInvalidTokenIds.push(...webResult.invalidTokenIds)

  // Mark all invalid tokens as inactive
  for (const tokenId of allInvalidTokenIds) {
    try {
      await markTokenInactive(tokenId)
      log.info('Marked invalid push token as inactive', { tokenId })
    } catch (error) {
      log.error('Failed to mark push token as inactive', { tokenId, error })
    }
  }

  log.info('Push notifications sent', {
    userId: redactId(userId),
    totalSent,
    totalFailed,
    totalSkipped,
    expoSent: expoResult.sent,
    webSent: webResult.sent,
    webSkipped: webResult.skipped ?? 0,
  })

  return {
    success: totalFailed === 0,
    sent: totalSent,
    failed: totalFailed,
    errors: allErrors.length > 0 ? allErrors : undefined,
    skipped: totalSkipped > 0 ? totalSkipped : undefined,
  }
}

/**
 * Create an in-app notification record in the database.
 */
async function createInAppNotificationActivity(
  payload: InAppNotificationPayload
): Promise<CreateNotificationResult> {
  const { userId, type, title, body, data } = payload

  log.info('Creating in-app notification', { userId: redactId(userId), type, title })

  const { data: result, error } = await createNotification({
    user_id: userId,
    type,
    title,
    body,
    data: data as Json | undefined,
  })

  if (error) {
    // Check if it's a retryable error by code
    if (error.code && ['57P03', '08006', '08001', '08004'].includes(error.code)) {
      throw ApplicationFailure.retryable('Database connection error, retrying...', 'DB_ERROR', {
        error,
        userId,
      })
    }
    throw ApplicationFailure.nonRetryable('Failed to create notification', 'DB_ERROR', {
      error,
      userId,
    })
  }

  return {
    id: result?.id || 0,
    created: !!result,
  }
}

/**
 * Notify recipient of a received transfer
 */
async function notifyTransferReceivedActivity(
  params: TransferNotificationParams,
  vapidConfig: VapidConfig
): Promise<void> {
  const { senderAddress, recipientAddress, amount, token, txHash, note } = params

  log.info('Notifying transfer received', {
    recipientAddress: redactHex(recipientAddress),
    senderAddress: redactHex(senderAddress),
    amount,
    txHash: redactHex(txHash),
  })

  // Get recipient user ID
  const recipientUserId = await getUserIdFromAddress(recipientAddress)
  if (!recipientUserId) {
    log.warn('Could not find recipient user ID, skipping notification', {
      recipientAddress: redactHex(recipientAddress),
    })
    return
  }

  // Get sender tag name for friendly display
  const senderUserId = await getUserIdFromAddress(senderAddress)
  const senderTagName = senderUserId ? await getUserMainTagName(senderUserId) : null
  const senderDisplay = senderTagName
    ? `/${senderTagName}`
    : `${senderAddress.slice(0, 6)}...${senderAddress.slice(-4)}`

  const coinInfo = token ? allCoinsDict[token] : undefined
  const formattedAmount = localizeAmount(
    formatAmount(
      formatUnits(BigInt(amount), coinInfo?.decimals || 18),
      12,
      coinInfo?.formatDecimals
    )
  )

  const tokenSymbol = coinInfo?.symbol || 'ETH'

  const title = `+ ${formattedAmount} ${tokenSymbol}`
  const body = note ? `${decodeURI(note)}\n\n${senderDisplay}` : senderDisplay

  const notificationData = {
    type: 'transfer_received' as const,
    txHash,
    senderAddress,
    amount,
    token,
    note,
  }

  // Create in-app notification
  await createInAppNotificationActivity({
    userId: recipientUserId,
    type: 'transfer_received' as NotificationType,
    title,
    body,
    data: notificationData,
  })

  // Send push notification
  await sendPushNotificationActivity(
    {
      userId: recipientUserId,
      title,
      body,
      data: notificationData,
    },
    vapidConfig
  )
}

/**
 * Notify sender of a sent transfer (confirmation)
 */
async function notifyTransferSentActivity(
  params: TransferNotificationParams,
  vapidConfig: VapidConfig
): Promise<void> {
  const { senderAddress, recipientAddress, amount, token, txHash, note } = params

  log.info('Notifying transfer sent', {
    senderAddress: redactHex(senderAddress),
    recipientAddress: redactHex(recipientAddress),
    amount,
    txHash: redactHex(txHash),
  })

  // Get sender user ID
  const senderUserId = await getUserIdFromAddress(senderAddress)
  if (!senderUserId) {
    log.warn('Could not find sender user ID, skipping notification', {
      senderAddress: redactHex(senderAddress),
    })
    return
  }

  // Get recipient tag name for friendly display
  const recipientUserId = await getUserIdFromAddress(recipientAddress)
  const recipientTagName = recipientUserId ? await getUserMainTagName(recipientUserId) : null
  const recipientDisplay = recipientTagName
    ? `/${recipientTagName}`
    : `${recipientAddress.slice(0, 6)}...${recipientAddress.slice(-4)}`

  const coinInfoSent = token ? allCoinsDict[token] : undefined
  const formattedAmount = localizeAmount(
    formatAmount(
      formatUnits(BigInt(amount), coinInfoSent?.decimals || 18),
      12,
      coinInfoSent?.formatDecimals
    )
  )

  const tokenSymbol = coinInfoSent?.symbol || 'ETH'

  const title = 'Transfer Sent'
  const body = `You sent ${formattedAmount} ${tokenSymbol} to ${recipientDisplay}`

  const notificationData = {
    type: 'transfer_sent' as const,
    txHash,
    recipientAddress,
    amount,
    token,
    note,
  }

  // Create in-app notification
  await createInAppNotificationActivity({
    userId: senderUserId,
    type: 'transfer_sent' as NotificationType,
    title,
    body,
    data: notificationData,
  })

  // Send push notification
  await sendPushNotificationActivity(
    {
      userId: senderUserId,
      title,
      body,
      data: notificationData,
    },
    vapidConfig
  )
}

/**
 * Get user ID from wallet address - exposed as activity
 */
async function getUserIdFromAddressActivity(address: Address): Promise<string | null> {
  return getUserIdFromAddress(address)
}
