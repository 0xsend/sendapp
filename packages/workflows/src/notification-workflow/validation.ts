/**
 * Notification Payload Validation and Sanitization
 *
 * Security hardening for notification payloads to prevent:
 * - DoS via oversized payloads
 * - Injection via unsanitized content
 * - Information leakage via uncontrolled data
 */

import { log } from '@temporalio/activity'

// ============================================================================
// Constants
// ============================================================================

/** Maximum title length for notifications */
export const MAX_TITLE_LENGTH = 100

/** Maximum body length for notifications */
export const MAX_BODY_LENGTH = 500

/** Maximum total data payload size in bytes (5KB) */
export const MAX_DATA_SIZE = 5 * 1024

/** Maximum number of keys in data object */
export const MAX_DATA_KEYS = 20

/** Maximum string length for data values */
export const MAX_DATA_VALUE_LENGTH = 1000

/** Allowed data keys for notification payloads */
export const ALLOWED_DATA_KEYS = Object.freeze([
  'type',
  'route',
  'path',
  'txHash',
  'senderAddress',
  'recipientAddress',
  'amount',
  'token',
  'note',
  'badge',
  'tag',
  'timestamp',
] as const)

/** Notification types that are allowed */
export const ALLOWED_NOTIFICATION_TYPES = Object.freeze([
  'transfer_received',
  'transfer_sent',
  'account_activity',
  'system',
] as const)

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Check if value is a plain object (not null, not array)
 */
export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Safely get a string value with truncation
 * @param value - The value to sanitize
 * @param maxLength - Maximum allowed length
 * @param defaultValue - Default if value is invalid
 * @returns Sanitized string
 */
export function safeString(value: unknown, maxLength: number, defaultValue: string): string {
  if (typeof value !== 'string') return defaultValue
  return value.slice(0, maxLength)
}

/**
 * Sanitize a notification title
 * - Truncates to max length
 * - Strips control characters
 * - Provides default if empty
 */
export function sanitizeTitle(title: unknown): string {
  if (typeof title !== 'string' || !title.trim()) {
    return 'Notification'
  }

  // Strip control characters except newlines (intentional control char regex)
  // biome-ignore lint/suspicious/noControlCharactersInRegex: intentional sanitization of control characters
  const sanitized = title.replace(/[\x00-\x09\x0B\x0C\x0E-\x1F\x7F]/g, '')

  return sanitized.slice(0, MAX_TITLE_LENGTH).trim() || 'Notification'
}

/**
 * Sanitize a notification body
 * - Truncates to max length
 * - Strips control characters except newlines
 * - Returns empty string if invalid
 */
export function sanitizeBody(body: unknown): string {
  if (typeof body !== 'string') {
    return ''
  }

  // Strip control characters except newlines and tabs (intentional control char regex)
  // biome-ignore lint/suspicious/noControlCharactersInRegex: intentional sanitization of control characters
  const sanitized = body.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')

  return sanitized.slice(0, MAX_BODY_LENGTH)
}

/**
 * Validate and sanitize notification data object
 * - Filters to allowed keys only
 * - Enforces value length limits
 * - Enforces total size limit
 * - Returns sanitized data or empty object
 */
export function sanitizeNotificationData(
  data: unknown
): Record<string, string | number | boolean | null> {
  if (!isPlainObject(data)) {
    return {}
  }

  const sanitized: Record<string, string | number | boolean | null> = {}
  const allowedKeysSet = new Set(ALLOWED_DATA_KEYS)
  let keyCount = 0
  let estimatedSize = 0

  for (const [key, value] of Object.entries(data)) {
    // Check key count limit
    if (keyCount >= MAX_DATA_KEYS) {
      log.warn('Data object has too many keys, truncating', { maxKeys: MAX_DATA_KEYS })
      break
    }

    // Only allow explicitly allowed keys
    if (!allowedKeysSet.has(key as (typeof ALLOWED_DATA_KEYS)[number])) {
      log.debug('Filtering out non-allowed data key', { key })
      continue
    }

    // Sanitize value based on type
    let sanitizedValue: string | number | boolean | null = null

    if (typeof value === 'string') {
      sanitizedValue = value.slice(0, MAX_DATA_VALUE_LENGTH)
      estimatedSize += key.length + sanitizedValue.length
    } else if (typeof value === 'number' && Number.isFinite(value)) {
      sanitizedValue = value
      estimatedSize += key.length + 20 // approximate number size
    } else if (typeof value === 'boolean') {
      sanitizedValue = value
      estimatedSize += key.length + 5
    } else if (value === null) {
      sanitizedValue = null
      estimatedSize += key.length + 4
    } else {
      // Skip non-primitive values (objects, arrays, undefined)
      log.debug('Filtering out non-primitive data value', { key, valueType: typeof value })
      continue
    }

    // Check total size limit
    if (estimatedSize > MAX_DATA_SIZE) {
      log.warn('Data object exceeds size limit, truncating', { maxSize: MAX_DATA_SIZE })
      break
    }

    sanitized[key] = sanitizedValue
    keyCount++
  }

  return sanitized
}

/**
 * Validate notification type against allowed types
 */
export function isValidNotificationType(
  type: unknown
): type is (typeof ALLOWED_NOTIFICATION_TYPES)[number] {
  if (typeof type !== 'string') return false
  return (ALLOWED_NOTIFICATION_TYPES as readonly string[]).includes(type)
}

/**
 * Sanitize a complete notification payload
 * Returns a sanitized payload with validated fields
 */
export function sanitizeNotificationPayload(payload: {
  title?: unknown
  body?: unknown
  data?: unknown
}): {
  title: string
  body: string
  data: Record<string, string | number | boolean | null>
} {
  return {
    title: sanitizeTitle(payload.title),
    body: sanitizeBody(payload.body),
    data: sanitizeNotificationData(payload.data),
  }
}

/**
 * Check if an Expo push token format is valid
 * Expo tokens look like: ExponentPushToken[xxxx] or ExpoPushToken[xxxx]
 */
export function isValidExpoPushToken(token: unknown): token is string {
  if (typeof token !== 'string') return false
  if (token.length < 20 || token.length > 200) return false
  return token.startsWith('ExponentPushToken[') || token.startsWith('ExpoPushToken[')
}

/**
 * Check if a web push endpoint is valid
 * - Must be HTTPS
 * - Must be from a known push service
 */
export function isValidWebPushEndpoint(endpoint: unknown): endpoint is string {
  if (typeof endpoint !== 'string') return false
  if (endpoint.length > 2048) return false

  try {
    const url = new URL(endpoint)
    if (url.protocol !== 'https:') return false

    // Known push service domains
    const knownDomains = [
      'fcm.googleapis.com',
      'updates.push.services.mozilla.com',
      'web.push.apple.com',
      'wns.windows.com',
      'push.services.mozilla.com',
    ]

    const hostname = url.hostname.toLowerCase()
    return knownDomains.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`))
  } catch {
    return false
  }
}

/**
 * Redact sensitive data for logging
 * Returns a version of the object safe for logging
 */
export function redactForLogging(obj: Record<string, unknown>): Record<string, unknown> {
  const sensitiveKeys = ['token', 'auth', 'p256dh', 'key', 'secret', 'password', 'credential']
  const redacted: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase()
    const isSensitive = sensitiveKeys.some((k) => lowerKey.includes(k))

    if (isSensitive && typeof value === 'string') {
      redacted[key] = value.length > 10 ? `${value.substring(0, 5)}...[REDACTED]` : '[REDACTED]'
    } else if (typeof value === 'object' && value !== null) {
      // Don't recursively log nested objects
      redacted[key] = '[Object]'
    } else {
      redacted[key] = value
    }
  }

  return redacted
}
