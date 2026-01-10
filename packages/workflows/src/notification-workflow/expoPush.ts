/**
 * Expo Push Notification Service
 *
 * Sends push notifications via the Expo Push HTTP API.
 * Supports iOS and Android via Expo push tokens (ExponentPushToken[...] format).
 *
 * API Docs: https://docs.expo.dev/push-notifications/sending-notifications/
 */

import { log } from '@temporalio/activity'
import type { PushToken, SendPushResult } from './types'

// Expo Push API endpoint
const EXPO_PUSH_API_URL = 'https://exp.host/--/api/v2/push/send'

// Maximum messages per request (Expo's limit is 100)
const MAX_MESSAGES_PER_CHUNK = 100

/**
 * Expo push message format as per API specification
 */
export type ExpoPushMessage = {
  to: string
  title?: string
  body?: string
  data?: Record<string, unknown>
  sound?: 'default' | null
  ttl?: number
  expiration?: number
  priority?: 'default' | 'normal' | 'high'
  channelId?: string
  categoryId?: string
  badge?: number
  mutableContent?: boolean
}

/**
 * Expo push ticket returned from the API
 */
export type ExpoPushTicket =
  | {
      status: 'ok'
      id: string
    }
  | {
      status: 'error'
      message: string
      details?: {
        error?:
          | 'DeviceNotRegistered'
          | 'InvalidCredentials'
          | 'MessageTooBig'
          | 'MessageRateExceeded'
      }
    }

/**
 * Response from the Expo Push API
 */
export type ExpoPushResponse = {
  data: ExpoPushTicket[]
  errors?: Array<{
    code: string
    message: string
  }>
}

/**
 * Validates if a token is a valid Expo push token format.
 * Valid formats:
 * - ExponentPushToken[xxxx] (older format)
 * - ExpoPushToken[xxxx] (newer format)
 */
export function isExpoPushToken(token: string): boolean {
  if (!token || typeof token !== 'string') {
    return false
  }
  return /^Expo(nent)?PushToken\[.+\]$/.test(token)
}

/**
 * Filters push tokens to only include valid Expo tokens
 */
export function filterExpoTokens(tokens: PushToken[]): PushToken[] {
  return tokens.filter((token) => {
    if (!token.token || !token.is_active) {
      return false
    }
    // Only process tokens that match Expo format
    // The platform field might be 'expo', 'ios', or 'android' for Expo tokens
    return isExpoPushToken(token.token)
  })
}

/**
 * Chunks an array into smaller arrays of specified size
 */
export function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize))
  }
  return chunks
}

/**
 * Sends push notifications to Expo push tokens.
 * Handles chunking for large batches (max 100 per request).
 *
 * @param tokens - Array of push tokens to send to
 * @param title - Notification title
 * @param body - Notification body
 * @param data - Optional data payload
 * @returns SendPushResult with success counts and any errors
 */
export async function sendExpoPushNotifications(
  tokens: PushToken[],
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<SendPushResult> {
  // Filter to only valid Expo tokens
  const expoTokens = filterExpoTokens(tokens)

  if (expoTokens.length === 0) {
    log.info('No valid Expo push tokens to send to')
    return { success: true, sent: 0, failed: 0 }
  }

  // Build messages for each token
  // Note: filterExpoTokens already ensures token.token is non-null
  const messages: ExpoPushMessage[] = expoTokens.map((token) => ({
    to: token.token as string,
    title,
    body,
    data,
    sound: 'default' as const,
    priority: 'high' as const,
  }))

  // Chunk messages if needed (Expo limit is 100 per request)
  const chunks = chunkArray(messages, MAX_MESSAGES_PER_CHUNK)

  let sent = 0
  let failed = 0
  const errors: string[] = []

  for (const chunk of chunks) {
    try {
      const result = await sendExpoPushChunk(chunk)
      sent += result.sent
      failed += result.failed
      if (result.errors) {
        errors.push(...result.errors)
      }
    } catch (error) {
      // Chunk-level failure - count all as failed
      log.error('Error sending Expo push chunk', { error, chunkSize: chunk.length })
      failed += chunk.length
      errors.push(error instanceof Error ? error.message : 'Unknown chunk error')
    }
  }

  return {
    success: failed === 0,
    sent,
    failed,
    errors: errors.length > 0 ? errors : undefined,
  }
}

/**
 * Sends a single chunk of messages to the Expo Push API.
 * Internal function used by sendExpoPushNotifications.
 */
async function sendExpoPushChunk(messages: ExpoPushMessage[]): Promise<SendPushResult> {
  log.info('Sending Expo push chunk', { count: messages.length })

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
    const errorText = await response.text().catch(() => 'Unknown error')
    throw new Error(`Expo Push API returned ${response.status}: ${errorText}`)
  }

  const result: ExpoPushResponse = await response.json()

  // Check for top-level API errors
  if (result.errors && result.errors.length > 0) {
    throw new Error(`Expo Push API error: ${result.errors.map((e) => e.message).join(', ')}`)
  }

  // Process individual ticket results
  let sent = 0
  let failed = 0
  const errors: string[] = []

  for (let i = 0; i < result.data.length; i++) {
    const ticket = result.data[i]
    const message = messages[i]

    if (!ticket || !message) {
      continue
    }

    if (ticket.status === 'ok') {
      sent++
      log.debug('Expo push sent successfully', {
        token: `${message.to.substring(0, 25)}...`,
        ticketId: ticket.id,
      })
    } else if (ticket.status === 'error') {
      failed++
      const errorMessage = `${ticket.message}${ticket.details?.error ? ` (${ticket.details.error})` : ''}`
      errors.push(errorMessage)

      // Log specific error types for debugging
      if (ticket.details?.error === 'DeviceNotRegistered') {
        log.warn('Expo token no longer valid (DeviceNotRegistered)', {
          token: `${message.to.substring(0, 25)}...`,
        })
        // TODO: Mark this token as inactive in the database
      } else {
        log.error('Expo push failed for token', {
          token: `${message.to.substring(0, 25)}...`,
          error: ticket.message,
          errorType: ticket.details?.error,
        })
      }
    }
  }

  return {
    success: failed === 0,
    sent,
    failed,
    errors: errors.length > 0 ? errors : undefined,
  }
}
