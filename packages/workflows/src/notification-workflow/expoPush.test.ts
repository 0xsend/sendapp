import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import type { PushToken } from './types'

// Mock @temporalio/activity before importing the module
jest.mock('@temporalio/activity', () => ({
  log: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}))

// Mock global fetch
const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>
global.fetch = mockFetch

// Import after mocks
import {
  isExpoPushToken,
  filterExpoTokens,
  chunkArray,
  sendExpoPushNotifications,
} from './expoPush'
import type { ExpoPushResponse } from './expoPush'

describe('Expo Push Module', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('isExpoPushToken', () => {
    it('should return true for valid ExponentPushToken format', () => {
      expect(isExpoPushToken('ExponentPushToken[xxxxxxxxxxxxxx]')).toBe(true)
      expect(isExpoPushToken('ExponentPushToken[abc123DEF456]')).toBe(true)
    })

    it('should return true for valid ExpoPushToken format', () => {
      expect(isExpoPushToken('ExpoPushToken[xxxxxxxxxxxxxx]')).toBe(true)
      expect(isExpoPushToken('ExpoPushToken[abc123DEF456]')).toBe(true)
    })

    it('should return false for invalid token formats', () => {
      expect(isExpoPushToken('')).toBe(false)
      expect(isExpoPushToken('invalid-token')).toBe(false)
      expect(isExpoPushToken('ExponentPushToken')).toBe(false)
      expect(isExpoPushToken('ExponentPushToken[]')).toBe(false)
      expect(isExpoPushToken('APNS:device-token-here')).toBe(false)
      expect(isExpoPushToken('web-push-subscription')).toBe(false)
    })

    it('should return false for null/undefined', () => {
      // @ts-expect-error testing invalid input
      expect(isExpoPushToken(null)).toBe(false)
      // @ts-expect-error testing invalid input
      expect(isExpoPushToken(undefined)).toBe(false)
    })
  })

  describe('filterExpoTokens', () => {
    const mockUserId = 'user-123'
    const baseToken: Omit<PushToken, 'token' | 'platform' | 'is_active'> = {
      id: 1,
      user_id: mockUserId,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      endpoint: null,
      p256dh: null,
      auth: null,
      device_id: null,
      last_used_at: null,
    }

    it('should filter to only valid active Expo tokens', () => {
      const tokens: PushToken[] = [
        {
          ...baseToken,
          id: 1,
          token: 'ExponentPushToken[valid1]',
          platform: 'expo',
          is_active: true,
        },
        {
          ...baseToken,
          id: 2,
          token: 'ExpoPushToken[valid2]',
          platform: 'expo',
          is_active: true,
        },
        {
          ...baseToken,
          id: 3,
          token: 'web-push-token',
          platform: 'web',
          is_active: true,
        },
        {
          ...baseToken,
          id: 4,
          token: 'ExponentPushToken[inactive]',
          platform: 'expo',
          is_active: false,
        },
        {
          ...baseToken,
          id: 5,
          token: null,
          platform: 'expo',
          is_active: true,
        },
      ]

      const result = filterExpoTokens(tokens)
      expect(result).toHaveLength(2)
      expect(result[0]?.token).toBe('ExponentPushToken[valid1]')
      expect(result[1]?.token).toBe('ExpoPushToken[valid2]')
    })

    it('should return empty array when no valid Expo tokens', () => {
      const tokens: PushToken[] = [
        {
          ...baseToken,
          id: 1,
          token: 'web-push-token',
          platform: 'web',
          is_active: true,
        },
      ]

      const result = filterExpoTokens(tokens)
      expect(result).toHaveLength(0)
    })
  })

  describe('chunkArray', () => {
    it('should chunk array into specified sizes', () => {
      const array = [1, 2, 3, 4, 5, 6, 7]
      const chunks = chunkArray(array, 3)
      expect(chunks).toEqual([[1, 2, 3], [4, 5, 6], [7]])
    })

    it('should return single chunk when array is smaller than chunk size', () => {
      const array = [1, 2, 3]
      const chunks = chunkArray(array, 100)
      expect(chunks).toEqual([[1, 2, 3]])
    })

    it('should handle empty array', () => {
      const chunks = chunkArray([], 10)
      expect(chunks).toEqual([])
    })

    it('should handle exact chunk size', () => {
      const array = [1, 2, 3, 4]
      const chunks = chunkArray(array, 2)
      expect(chunks).toEqual([
        [1, 2],
        [3, 4],
      ])
    })
  })

  describe('sendExpoPushNotifications', () => {
    const mockUserId = 'user-123'
    const baseToken: Omit<PushToken, 'token' | 'platform' | 'is_active'> = {
      id: 1,
      user_id: mockUserId,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      endpoint: null,
      p256dh: null,
      auth: null,
      device_id: null,
      last_used_at: null,
    }

    it('should return success with 0 sent when no valid tokens', async () => {
      const tokens: PushToken[] = [
        {
          ...baseToken,
          token: 'web-push-token',
          platform: 'web',
          is_active: true,
        },
      ]

      const result = await sendExpoPushNotifications(tokens, 'Test', 'Body')
      expect(result).toEqual({ success: true, sent: 0, failed: 0 })
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('should send notifications successfully', async () => {
      const tokens: PushToken[] = [
        {
          ...baseToken,
          token: 'ExponentPushToken[device1]',
          platform: 'expo',
          is_active: true,
        },
        {
          ...baseToken,
          id: 2,
          token: 'ExpoPushToken[device2]',
          platform: 'expo',
          is_active: true,
        },
      ]

      const mockResponse: ExpoPushResponse = {
        data: [
          { status: 'ok', id: 'ticket-1' },
          { status: 'ok', id: 'ticket-2' },
        ],
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response)

      const result = await sendExpoPushNotifications(tokens, 'Test Title', 'Test Body', {
        key: 'value',
      })

      expect(result).toMatchObject({
        success: true,
        sent: 2,
        failed: 0,
        ticketIds: ['ticket-1', 'ticket-2'],
      })
      expect(result.ticketIdToTokenId).toEqual({
        'ticket-1': 1,
        'ticket-2': 2,
      })
      expect(mockFetch).toHaveBeenCalledTimes(1)
      expect(mockFetch).toHaveBeenCalledWith(
        'https://exp.host/--/api/v2/push/send',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      )

      // Verify the body contains correct messages
      const callBody = JSON.parse((mockFetch.mock.calls[0]?.[1] as RequestInit).body as string)
      expect(callBody).toHaveLength(2)
      expect(callBody[0]).toMatchObject({
        to: 'ExponentPushToken[device1]',
        title: 'Test Title',
        body: 'Test Body',
        data: { key: 'value' },
      })
    })

    it('should handle partial failures from API', async () => {
      const tokens: PushToken[] = [
        {
          ...baseToken,
          token: 'ExponentPushToken[device1]',
          platform: 'expo',
          is_active: true,
        },
        {
          ...baseToken,
          id: 2,
          token: 'ExpoPushToken[device2]',
          platform: 'expo',
          is_active: true,
        },
      ]

      const mockResponse: ExpoPushResponse = {
        data: [
          { status: 'ok', id: 'ticket-1' },
          {
            status: 'error',
            message: 'Device not registered',
            details: { error: 'DeviceNotRegistered' },
          },
        ],
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response)

      const result = await sendExpoPushNotifications(tokens, 'Test', 'Body')

      expect(result).toMatchObject({
        success: false,
        sent: 1,
        failed: 1,
        errors: ['Device not registered (DeviceNotRegistered)'],
        ticketIds: ['ticket-1'],
        tokenIdsToDeactivate: [2],
      })
      expect(result.ticketIdToTokenId).toEqual({
        'ticket-1': 1,
      })
    })

    it('should handle HTTP errors from API', async () => {
      const tokens: PushToken[] = [
        {
          ...baseToken,
          token: 'ExponentPushToken[device1]',
          platform: 'expo',
          is_active: true,
        },
      ]

      // The retry logic will retry up to MAX_RETRIES (3) times, so we need to mock all retries
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          text: () => Promise.resolve('Internal Server Error'),
        } as Response)
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          text: () => Promise.resolve('Internal Server Error'),
        } as Response)
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          text: () => Promise.resolve('Internal Server Error'),
        } as Response)
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          text: () => Promise.resolve('Internal Server Error'),
        } as Response)

      const result = await sendExpoPushNotifications(tokens, 'Test', 'Body')

      expect(result).toEqual({
        success: false,
        sent: 0,
        failed: 1,
        errors: ['Expo Push API returned 500: Internal Server Error'],
      })
    }, 60000) // Increase timeout for retry delays

    it('should chunk large batches of tokens', async () => {
      // Create 150 tokens (should be split into 2 chunks: 100 + 50)
      const tokens: PushToken[] = Array.from({ length: 150 }, (_, i) => ({
        ...baseToken,
        id: i + 1,
        token: `ExponentPushToken[device${i}]`,
        platform: 'expo' as const,
        is_active: true,
      }))

      const mockResponse: ExpoPushResponse = {
        data: tokens.slice(0, 100).map((_, i) => ({ status: 'ok' as const, id: `ticket-${i}` })),
      }
      const mockResponse2: ExpoPushResponse = {
        data: tokens.slice(100).map((_, i) => ({ status: 'ok' as const, id: `ticket-${100 + i}` })),
      }

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse2),
        } as Response)

      const result = await sendExpoPushNotifications(tokens, 'Test', 'Body')

      // Expect 150 ticket IDs from both chunks
      const expectedTicketIds = [
        ...tokens.slice(0, 100).map((_, i) => `ticket-${i}`),
        ...tokens.slice(100).map((_, i) => `ticket-${100 + i}`),
      ]
      expect(result).toMatchObject({
        success: true,
        sent: 150,
        failed: 0,
        ticketIds: expectedTicketIds,
      })
      expect(result.ticketIdToTokenId?.['ticket-0']).toBe(1)
      expect(result.ticketIdToTokenId?.['ticket-149']).toBe(150)
      expect(mockFetch).toHaveBeenCalledTimes(2)

      // Verify first chunk has 100 messages
      const firstCallBody = JSON.parse((mockFetch.mock.calls[0]?.[1] as RequestInit).body as string)
      expect(firstCallBody).toHaveLength(100)

      // Verify second chunk has 50 messages
      const secondCallBody = JSON.parse(
        (mockFetch.mock.calls[1]?.[1] as RequestInit).body as string
      )
      expect(secondCallBody).toHaveLength(50)
    })
  })
})
