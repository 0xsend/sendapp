/**
 * Expo Push Notification Service
 *
 * Sends push notifications via the Expo Push HTTP API.
 * Supports iOS and Android via Expo push tokens (ExponentPushToken[...] format).
 *
 * API Docs: https://docs.expo.dev/push-notifications/sending-notifications/
 */

import { log } from '@temporalio/activity'
import type { PushToken, SendPushResult, ReceiptCheckResult } from './types'

// Expo Push API endpoints
const EXPO_PUSH_API_URL = 'https://exp.host/--/api/v2/push/send'
const EXPO_RECEIPTS_API_URL = 'https://exp.host/--/api/v2/push/getReceipts'

// Maximum messages per request (Expo's limit is 100)
const MAX_MESSAGES_PER_CHUNK = 100

// Concurrency limit for sending chunks
const MAX_CONCURRENT_CHUNKS = 6

// Retry configuration for transient errors
const MAX_RETRIES = 3
const INITIAL_RETRY_DELAY_MS = 1000
const MAX_RETRY_DELAY_MS = 30000

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
 * Expo push receipt returned when checking delivery status
 */
export type ExpoPushReceipt =
  | {
      status: 'ok'
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
 * Response from the Expo Receipts API
 */
export type ExpoReceiptsResponse = {
  data: Record<string, ExpoPushReceipt>
  errors?: Array<{
    code: string
    message: string
  }>
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
 * Sleep utility for retry backoff
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Calculate exponential backoff delay with jitter
 */
function getRetryDelay(attempt: number): number {
  const baseDelay = INITIAL_RETRY_DELAY_MS * 2 ** attempt
  const jitter = Math.random() * 0.3 * baseDelay // Add up to 30% jitter
  return Math.min(baseDelay + jitter, MAX_RETRY_DELAY_MS)
}

/**
 * Determines if an error is retryable (transient)
 */
function isRetryableError(ticket: ExpoPushTicket): boolean {
  if (ticket.status !== 'error') return false
  // MessageRateExceeded is the main transient error
  return ticket.details?.error === 'MessageRateExceeded'
}

/**
 * Runs async functions with limited concurrency
 */
async function runWithConcurrency<T, R>(
  items: T[],
  fn: (item: T) => Promise<R>,
  concurrency: number
): Promise<R[]> {
  const results: R[] = []
  const executing: Promise<void>[] = []

  for (const item of items) {
    const p = fn(item).then((result) => {
      results.push(result)
    })
    executing.push(p as Promise<void>)

    if (executing.length >= concurrency) {
      await Promise.race(executing)
      // Remove completed promises
      for (let i = executing.length - 1; i >= 0; i--) {
        // Check if promise is settled by racing with an immediately resolved promise
        const settled = await Promise.race([
          executing[i]?.then(() => true).catch(() => true),
          Promise.resolve(false),
        ])
        if (settled) {
          executing.splice(i, 1)
        }
      }
    }
  }

  await Promise.all(executing)
  return results
}

/** Internal result from sending a chunk, includes retry info */
type ChunkSendResult = SendPushResult & {
  /** Messages that need retry due to rate limiting */
  messagesToRetry?: ExpoPushMessage[]
}

/**
 * Masks a token for logging (don't expose full token values)
 */
function maskToken(token: string): string {
  if (token.length <= 30) return '[redacted]'
  return `${token.substring(0, 20)}...[redacted]`
}

/**
 * Sends push notifications to Expo push tokens.
 * Handles chunking for large batches (max 100 per request).
 * Uses concurrency limiting and retry with backoff for rate limiting.
 *
 * @param tokens - Array of push tokens to send to
 * @param title - Notification title
 * @param body - Notification body
 * @param data - Optional data payload
 * @returns SendPushResult with success counts, errors, ticket IDs, and tokens to deactivate
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

  log.info('Sending Expo push notifications', {
    totalTokens: expoTokens.length,
    chunks: chunks.length,
    concurrency: MAX_CONCURRENT_CHUNKS,
  })

  // Send chunks with concurrency limit
  const chunkResults = await runWithConcurrency(
    chunks,
    (chunk) => sendExpoPushChunkWithRetry(chunk),
    MAX_CONCURRENT_CHUNKS
  )

  // Aggregate results
  let sent = 0
  let failed = 0
  const errors: string[] = []
  const ticketIds: string[] = []
  const tokensToDeactivate: string[] = []

  for (const result of chunkResults) {
    sent += result.sent
    failed += result.failed
    if (result.errors) {
      errors.push(...result.errors)
    }
    if (result.ticketIds) {
      ticketIds.push(...result.ticketIds)
    }
    if (result.tokensToDeactivate) {
      tokensToDeactivate.push(...result.tokensToDeactivate)
    }
  }

  log.info('Expo push notifications complete', {
    sent,
    failed,
    ticketCount: ticketIds.length,
    tokensToDeactivate: tokensToDeactivate.length,
  })

  return {
    success: failed === 0,
    sent,
    failed,
    errors: errors.length > 0 ? errors : undefined,
    ticketIds: ticketIds.length > 0 ? ticketIds : undefined,
    tokensToDeactivate: tokensToDeactivate.length > 0 ? tokensToDeactivate : undefined,
  }
}

/**
 * Sends a chunk with retry logic for transient errors (rate limiting).
 */
async function sendExpoPushChunkWithRetry(messages: ExpoPushMessage[]): Promise<SendPushResult> {
  let currentMessages = messages
  let totalSent = 0
  let totalFailed = 0
  const allErrors: string[] = []
  const allTicketIds: string[] = []
  const allTokensToDeactivate: string[] = []

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (currentMessages.length === 0) break

    if (attempt > 0) {
      const delay = getRetryDelay(attempt - 1)
      log.info('Retrying rate-limited messages', {
        attempt,
        messageCount: currentMessages.length,
        delayMs: Math.round(delay),
      })
      await sleep(delay)
    }

    try {
      const result = await sendExpoPushChunk(currentMessages)

      totalSent += result.sent
      totalFailed += result.failed - (result.messagesToRetry?.length || 0)

      if (result.errors) {
        // Filter out rate limit errors from final errors if we'll retry
        const finalErrors = result.messagesToRetry?.length
          ? result.errors.filter((e) => !e.includes('MessageRateExceeded'))
          : result.errors
        if (finalErrors.length > 0) {
          allErrors.push(...finalErrors)
        }
      }

      if (result.ticketIds) {
        allTicketIds.push(...result.ticketIds)
      }

      if (result.tokensToDeactivate) {
        allTokensToDeactivate.push(...result.tokensToDeactivate)
      }

      // Check if we have messages to retry
      if (result.messagesToRetry && result.messagesToRetry.length > 0) {
        currentMessages = result.messagesToRetry
      } else {
        break // No more retries needed
      }
    } catch (error) {
      // Chunk-level failure - if this is not the last attempt, retry the whole chunk
      if (attempt < MAX_RETRIES) {
        log.warn('Chunk send failed, will retry', {
          attempt,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
        continue
      }

      // Final attempt failed
      log.error('Error sending Expo push chunk after retries', {
        error,
        chunkSize: currentMessages.length,
      })
      totalFailed += currentMessages.length
      allErrors.push(error instanceof Error ? error.message : 'Unknown chunk error')
      break
    }
  }

  return {
    success: totalFailed === 0,
    sent: totalSent,
    failed: totalFailed,
    errors: allErrors.length > 0 ? allErrors : undefined,
    ticketIds: allTicketIds.length > 0 ? allTicketIds : undefined,
    tokensToDeactivate: allTokensToDeactivate.length > 0 ? allTokensToDeactivate : undefined,
  }
}

/**
 * Sends a single chunk of messages to the Expo Push API.
 * Returns messages that should be retried due to rate limiting.
 */
async function sendExpoPushChunk(messages: ExpoPushMessage[]): Promise<ChunkSendResult> {
  log.debug('Sending Expo push chunk', { count: messages.length })

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
  const ticketIds: string[] = []
  const tokensToDeactivate: string[] = []
  const messagesToRetry: ExpoPushMessage[] = []

  for (let i = 0; i < result.data.length; i++) {
    const ticket = result.data[i]
    const message = messages[i]

    if (!ticket || !message) {
      continue
    }

    if (ticket.status === 'ok') {
      sent++
      ticketIds.push(ticket.id)
      log.debug('Expo push sent successfully', {
        token: maskToken(message.to),
        ticketId: ticket.id,
      })
    } else if (ticket.status === 'error') {
      const errorMessage = `${ticket.message}${ticket.details?.error ? ` (${ticket.details.error})` : ''}`

      // Check if this is a retryable error
      if (isRetryableError(ticket)) {
        messagesToRetry.push(message)
        log.warn('Rate limited, will retry', { token: maskToken(message.to) })
      } else {
        failed++
        errors.push(errorMessage)

        // Handle DeviceNotRegistered - collect token for deactivation
        if (ticket.details?.error === 'DeviceNotRegistered') {
          tokensToDeactivate.push(message.to)
          log.warn('Token no longer valid (DeviceNotRegistered)', {
            token: maskToken(message.to),
          })
        } else {
          log.error('Expo push failed for token', {
            token: maskToken(message.to),
            error: ticket.message,
            errorType: ticket.details?.error,
          })
        }
      }
    }
  }

  return {
    success: failed === 0 && messagesToRetry.length === 0,
    sent,
    failed,
    errors: errors.length > 0 ? errors : undefined,
    ticketIds: ticketIds.length > 0 ? ticketIds : undefined,
    tokensToDeactivate: tokensToDeactivate.length > 0 ? tokensToDeactivate : undefined,
    messagesToRetry: messagesToRetry.length > 0 ? messagesToRetry : undefined,
  }
}

/**
 * Checks push notification receipts from Expo.
 * Should be called ~15 minutes after sending to verify delivery.
 *
 * @param ticketIds - Array of ticket IDs from successful sends
 * @returns ReceiptCheckResult with delivery status and tokens to deactivate
 */
export async function checkExpoPushReceipts(ticketIds: string[]): Promise<ReceiptCheckResult> {
  if (ticketIds.length === 0) {
    return { checked: 0, delivered: 0, failed: 0 }
  }

  log.info('Checking Expo push receipts', { count: ticketIds.length })

  // Chunk ticket IDs (API has limits)
  const chunks = chunkArray(ticketIds, MAX_MESSAGES_PER_CHUNK)

  let checked = 0
  let delivered = 0
  let failed = 0
  const errors: string[] = []
  const tokensToDeactivate: string[] = []

  for (const chunk of chunks) {
    try {
      const response = await fetch(EXPO_RECEIPTS_API_URL, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids: chunk }),
      })

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error')
        log.error('Expo Receipts API error', { status: response.status, error: errorText })
        continue
      }

      const result: ExpoReceiptsResponse = await response.json()

      if (result.errors && result.errors.length > 0) {
        log.error('Expo Receipts API returned errors', { errors: result.errors })
        continue
      }

      // Process each receipt
      for (const [ticketId, receipt] of Object.entries(result.data)) {
        checked++

        if (receipt.status === 'ok') {
          delivered++
        } else if (receipt.status === 'error') {
          failed++
          errors.push(`${ticketId}: ${receipt.message}`)

          // DeviceNotRegistered means we should deactivate the token
          // Note: We don't have the token here, but the caller can map ticketId -> token
          if (receipt.details?.error === 'DeviceNotRegistered') {
            log.warn('Receipt indicates device not registered', { ticketId })
            // Store ticketId; caller needs to map to token
            tokensToDeactivate.push(ticketId)
          } else {
            log.error('Push delivery failed', {
              ticketId,
              error: receipt.message,
              errorType: receipt.details?.error,
            })
          }
        }
      }
    } catch (error) {
      log.error('Error checking Expo push receipts', { error })
      errors.push(error instanceof Error ? error.message : 'Unknown error')
    }
  }

  log.info('Expo push receipt check complete', {
    checked,
    delivered,
    failed,
    tokensToDeactivate: tokensToDeactivate.length,
  })

  return {
    checked,
    delivered,
    failed,
    errors: errors.length > 0 ? errors : undefined,
    tokensToDeactivate: tokensToDeactivate.length > 0 ? tokensToDeactivate : undefined,
  }
}
