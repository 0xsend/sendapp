import { describe, expect, it, vi, beforeEach } from 'vitest'

// Mock the Temporal activity log
vi.mock('@temporalio/activity', () => ({
  log: {
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}))

import {
  sanitizeTitle,
  sanitizeBody,
  sanitizeNotificationData,
  isValidExpoPushToken,
  isValidWebPushEndpoint,
  isPlainObject,
  safeString,
  isValidNotificationType,
  sanitizeNotificationPayload,
  redactForLogging,
  MAX_TITLE_LENGTH,
  MAX_BODY_LENGTH,
  MAX_DATA_SIZE,
  MAX_DATA_KEYS,
  MAX_DATA_VALUE_LENGTH,
  ALLOWED_DATA_KEYS,
} from './validation'

describe('Notification Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('isPlainObject', () => {
    it('should return true for plain objects', () => {
      expect(isPlainObject({})).toBe(true)
      expect(isPlainObject({ key: 'value' })).toBe(true)
    })

    it('should return false for non-objects', () => {
      expect(isPlainObject(null)).toBe(false)
      expect(isPlainObject(undefined)).toBe(false)
      expect(isPlainObject('string')).toBe(false)
      expect(isPlainObject(123)).toBe(false)
      expect(isPlainObject([])).toBe(false)
      expect(isPlainObject([1, 2, 3])).toBe(false)
    })
  })

  describe('safeString', () => {
    it('should return string values within max length', () => {
      expect(safeString('hello', 10, 'default')).toBe('hello')
    })

    it('should truncate strings exceeding max length', () => {
      expect(safeString('hello world', 5, 'default')).toBe('hello')
    })

    it('should return default for non-string values', () => {
      expect(safeString(123, 10, 'default')).toBe('default')
      expect(safeString(null, 10, 'default')).toBe('default')
      expect(safeString(undefined, 10, 'default')).toBe('default')
      expect(safeString({}, 10, 'default')).toBe('default')
    })
  })

  describe('sanitizeTitle', () => {
    it('should return valid titles unchanged', () => {
      expect(sanitizeTitle('Transfer Received')).toBe('Transfer Received')
      expect(sanitizeTitle('+ 100 USDC')).toBe('+ 100 USDC')
    })

    it('should return default for invalid titles', () => {
      expect(sanitizeTitle('')).toBe('Notification')
      expect(sanitizeTitle('   ')).toBe('Notification')
      expect(sanitizeTitle(null)).toBe('Notification')
      expect(sanitizeTitle(undefined)).toBe('Notification')
      expect(sanitizeTitle(123)).toBe('Notification')
    })

    it('should truncate long titles', () => {
      const longTitle = 'A'.repeat(200)
      expect(sanitizeTitle(longTitle).length).toBe(MAX_TITLE_LENGTH)
    })

    it('should strip control characters', () => {
      expect(sanitizeTitle('Hello\x00World')).toBe('HelloWorld')
      expect(sanitizeTitle('Test\x1FTitle')).toBe('TestTitle')
    })

    it('should preserve newlines in titles', () => {
      // Newlines may appear in multi-line titles
      expect(sanitizeTitle('Line1\nLine2')).toBe('Line1\nLine2')
    })
  })

  describe('sanitizeBody', () => {
    it('should return valid body unchanged', () => {
      expect(sanitizeBody('You received 100 USDC from /alice')).toBe(
        'You received 100 USDC from /alice'
      )
    })

    it('should return empty string for invalid body', () => {
      expect(sanitizeBody(null)).toBe('')
      expect(sanitizeBody(undefined)).toBe('')
      expect(sanitizeBody(123)).toBe('')
      expect(sanitizeBody({})).toBe('')
    })

    it('should truncate long body', () => {
      const longBody = 'A'.repeat(1000)
      expect(sanitizeBody(longBody).length).toBe(MAX_BODY_LENGTH)
    })

    it('should strip control characters but preserve newlines', () => {
      expect(sanitizeBody('Hello\nWorld')).toBe('Hello\nWorld')
      expect(sanitizeBody('Hello\x00World')).toBe('HelloWorld')
    })
  })

  describe('sanitizeNotificationData', () => {
    it('should pass through allowed keys', () => {
      const data = {
        type: 'transfer_received',
        txHash: '0x123',
        amount: '1000000',
      }
      const result = sanitizeNotificationData(data)
      expect(result).toEqual(data)
    })

    it('should filter out non-allowed keys', () => {
      const data = {
        type: 'transfer_received',
        txHash: '0x123',
        maliciousKey: 'evil',
        unknownField: 'attack',
      }
      const result = sanitizeNotificationData(data)
      // Verify result only has the allowed keys
      expect(Object.keys(result).sort()).toEqual(['txHash', 'type'])
      expect(result.type).toBe('transfer_received')
      expect(result.txHash).toBe('0x123')
      // maliciousKey and unknownField should not be in the result
      expect('maliciousKey' in result).toBe(false)
      expect('unknownField' in result).toBe(false)
    })

    it('should return empty object for invalid input', () => {
      expect(sanitizeNotificationData(null)).toEqual({})
      expect(sanitizeNotificationData(undefined)).toEqual({})
      expect(sanitizeNotificationData('string')).toEqual({})
      expect(sanitizeNotificationData([])).toEqual({})
    })

    it('should handle primitive values correctly', () => {
      const data = {
        type: 'transfer_received',
        amount: '1000000',
        badge: 5,
      }
      const result = sanitizeNotificationData(data)
      expect(result.type).toBe('transfer_received')
      expect(result.amount).toBe('1000000')
      expect(result.badge).toBe(5)
    })

    it('should truncate long string values', () => {
      const data = {
        note: 'A'.repeat(2000),
      }
      const result = sanitizeNotificationData(data)
      expect((result.note as string).length).toBe(MAX_DATA_VALUE_LENGTH)
    })

    it('should filter out non-primitive values', () => {
      const data = {
        type: 'transfer_received',
        nestedObject: { nested: 'value' },
        arrayValue: [1, 2, 3],
      }
      const result = sanitizeNotificationData(data)
      expect(result).toEqual({ type: 'transfer_received' })
    })

    it('should handle null values correctly', () => {
      const data = {
        type: 'transfer_received',
        token: null,
      }
      const result = sanitizeNotificationData(data)
      expect(result.token).toBeNull()
    })

    it('should filter out NaN and Infinity', () => {
      const data = {
        badge: Number.NaN,
        type: 'transfer_received',
      }
      const result = sanitizeNotificationData(data)
      expect(result).not.toHaveProperty('badge')
      expect(result.type).toBe('transfer_received')
    })
  })

  describe('isValidExpoPushToken', () => {
    it('should accept valid ExponentPushToken format', () => {
      expect(isValidExpoPushToken('ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]')).toBe(true)
      expect(isValidExpoPushToken('ExponentPushToken[ABC123-DEF456-GHI789]')).toBe(true)
    })

    it('should accept valid ExpoPushToken format', () => {
      expect(isValidExpoPushToken('ExpoPushToken[xxxxxxxxxxxxxxxxxxxxxx]')).toBe(true)
    })

    it('should reject invalid tokens', () => {
      expect(isValidExpoPushToken('')).toBe(false)
      expect(isValidExpoPushToken('invalid-token')).toBe(false)
      expect(isValidExpoPushToken('ExponentPushToke')).toBe(false)
      expect(isValidExpoPushToken(null)).toBe(false)
      expect(isValidExpoPushToken(undefined)).toBe(false)
      expect(isValidExpoPushToken(123)).toBe(false)
    })

    it('should reject tokens that are too short or too long', () => {
      expect(isValidExpoPushToken('ExpoPushToken[x]')).toBe(false) // too short
      expect(isValidExpoPushToken(`ExpoPushToken[${'x'.repeat(250)}]`)).toBe(false) // too long
    })
  })

  describe('isValidWebPushEndpoint', () => {
    it('should accept valid FCM endpoints', () => {
      expect(isValidWebPushEndpoint('https://fcm.googleapis.com/fcm/send/abcdef123456')).toBe(true)
    })

    it('should accept valid Mozilla endpoints', () => {
      expect(
        isValidWebPushEndpoint('https://updates.push.services.mozilla.com/wpush/v2/abcdef')
      ).toBe(true)
      expect(isValidWebPushEndpoint('https://push.services.mozilla.com/wpush/v2/abcdef')).toBe(true)
    })

    it('should accept valid Apple endpoints', () => {
      expect(isValidWebPushEndpoint('https://web.push.apple.com/QWERTYabcdef')).toBe(true)
    })

    it('should reject HTTP endpoints', () => {
      expect(isValidWebPushEndpoint('http://fcm.googleapis.com/fcm/send/abcdef123456')).toBe(false)
    })

    it('should reject unknown domains', () => {
      expect(isValidWebPushEndpoint('https://evil.com/push')).toBe(false)
      expect(isValidWebPushEndpoint('https://fake-fcm.googleapis.com.evil.com/push')).toBe(false)
    })

    it('should reject invalid input', () => {
      expect(isValidWebPushEndpoint('')).toBe(false)
      expect(isValidWebPushEndpoint(null)).toBe(false)
      expect(isValidWebPushEndpoint(undefined)).toBe(false)
      expect(isValidWebPushEndpoint('not-a-url')).toBe(false)
    })

    it('should reject endpoints that are too long', () => {
      const longEndpoint = `https://fcm.googleapis.com/${'x'.repeat(3000)}`
      expect(isValidWebPushEndpoint(longEndpoint)).toBe(false)
    })
  })

  describe('isValidNotificationType', () => {
    it('should accept valid notification types', () => {
      expect(isValidNotificationType('transfer_received')).toBe(true)
      expect(isValidNotificationType('transfer_sent')).toBe(true)
      expect(isValidNotificationType('account_activity')).toBe(true)
      expect(isValidNotificationType('system')).toBe(true)
    })

    it('should reject invalid notification types', () => {
      expect(isValidNotificationType('invalid_type')).toBe(false)
      expect(isValidNotificationType('')).toBe(false)
      expect(isValidNotificationType(null)).toBe(false)
      expect(isValidNotificationType(123)).toBe(false)
    })
  })

  describe('sanitizeNotificationPayload', () => {
    it('should sanitize complete payload', () => {
      const payload = {
        title: 'Transfer Received',
        body: 'You received 100 USDC',
        data: {
          type: 'transfer_received',
          txHash: '0x123',
        },
      }
      const result = sanitizeNotificationPayload(payload)
      expect(result.title).toBe('Transfer Received')
      expect(result.body).toBe('You received 100 USDC')
      expect(result.data.type).toBe('transfer_received')
      expect(result.data.txHash).toBe('0x123')
    })

    it('should provide defaults for missing fields', () => {
      const payload = {}
      const result = sanitizeNotificationPayload(payload)
      expect(result.title).toBe('Notification')
      expect(result.body).toBe('')
      expect(result.data).toEqual({})
    })
  })

  describe('redactForLogging', () => {
    it('should redact sensitive keys', () => {
      const obj = {
        token: 'secret-token-value',
        auth: 'auth-key',
        p256dh: 'public-key',
        userId: 'user-123',
      }
      const result = redactForLogging(obj)
      expect(result.token).toContain('[REDACTED]')
      expect(result.auth).toContain('[REDACTED]')
      expect(result.p256dh).toContain('[REDACTED]')
      expect(result.userId).toBe('user-123')
    })

    it('should handle nested objects', () => {
      const obj = {
        data: { nested: 'value' },
        name: 'test',
      }
      const result = redactForLogging(obj)
      expect(result.data).toBe('[Object]')
      expect(result.name).toBe('test')
    })

    it('should handle short sensitive values', () => {
      const obj = {
        token: 'short',
      }
      const result = redactForLogging(obj)
      expect(result.token).toBe('[REDACTED]')
    })
  })

  describe('Constants', () => {
    it('should have reasonable limits', () => {
      expect(MAX_TITLE_LENGTH).toBe(100)
      expect(MAX_BODY_LENGTH).toBe(500)
      expect(MAX_DATA_SIZE).toBe(5 * 1024)
      expect(MAX_DATA_KEYS).toBe(20)
      expect(MAX_DATA_VALUE_LENGTH).toBe(1000)
    })

    it('should have all expected allowed keys', () => {
      const expectedKeys = [
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
      ]
      expect([...ALLOWED_DATA_KEYS]).toEqual(expectedKeys)
    })
  })
})
