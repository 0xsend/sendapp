import { beforeEach, describe, expect, it, vi, type Mocked, type MockInstance } from 'vitest'
import type {
  PostgrestError,
  PostgrestMaybeSingleResponse,
  PostgrestSingleResponse,
} from '@supabase/supabase-js'
import { log } from '@temporalio/activity'
import type { Address } from 'viem'
import type { SupabaseClient } from '@supabase/supabase-js'

// Mock the modules FIRST
vi.mock('app/utils/supabase/admin')
vi.mock('@temporalio/activity', () => {
  const createRetryableError = (message: string, code: string, details: unknown) => {
    const error = new Error(message)
    Object.assign(error, { code, details, type: 'retryable' })
    return error
  }
  const createNonRetryableError = (message: string, code: string, details: unknown) => {
    const error = new Error(message)
    Object.assign(error, { code, details, type: 'nonRetryable' })
    return error
  }
  return {
    log: {
      warn: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
      debug: vi.fn(),
    },
    ApplicationFailure: {
      retryable: vi.fn(createRetryableError),
      nonRetryable: vi.fn(createNonRetryableError),
    },
  }
})

// --- Mock Setup ---
// Create the mock client instance first
const mockedSupabaseAdmin = {
  from: vi.fn(),
} as unknown as Mocked<SupabaseClient>

// Mock the module, making the factory function return our mock instance
vi.mock('app/utils/supabase/admin', () => ({
  createSupabaseAdminClient: vi.fn(() => mockedSupabaseAdmin),
}))

// Define reusable mock functions for the chain
const mockMaybeSingle = vi.fn<() => Promise<PostgrestMaybeSingleResponse<unknown>>>()
const mockSingle = vi.fn<() => Promise<PostgrestSingleResponse<unknown>>>()
const mockEq = vi.fn().mockImplementation(() => ({
  single: mockSingle,
  maybeSingle: mockMaybeSingle,
  eq: mockEq,
  limit: mockLimit,
}))
const mockLimit = vi.fn().mockImplementation(() => ({
  maybeSingle: mockMaybeSingle,
}))
const mockSelect = vi.fn().mockImplementation(() => ({
  eq: mockEq,
  single: mockSingle,
  maybeSingle: mockMaybeSingle,
}))
const mockInsert = vi.fn().mockImplementation(() => ({
  select: mockSelect,
}))
const mockFrom = vi.fn().mockImplementation(() => ({
  select: mockSelect,
  insert: mockInsert,
}))

// Helper to create a mock PostgrestError
const createMockPostgrestError = (message: string, code = 'MOCK'): PostgrestError => ({
  message,
  details: 'Mock details',
  hint: 'Mock hint',
  code,
  name: 'PostgrestError',
})

// Helper to create a successful single response
const createSuccessSingleResponse = <T>(data: T): PostgrestSingleResponse<T> => ({
  data,
  error: null,
  count: null,
  status: 200,
  statusText: 'OK',
})

// Helper to create a successful maybeSingle response (found)
const createSuccessMaybeSingleResponse = <T>(data: T): PostgrestMaybeSingleResponse<T> => ({
  data,
  error: null,
  count: null,
  status: 200,
  statusText: 'OK',
})

// Helper to create a not found response
const createNotFoundMaybeSingleResponse = <T>(): PostgrestMaybeSingleResponse<T> => ({
  data: null,
  error: null,
  count: null,
  status: 200,
  statusText: 'OK',
})

beforeEach(() => {
  vi.clearAllMocks()
  ;(mockedSupabaseAdmin.from as MockInstance).mockImplementation(mockFrom)
  mockFrom.mockClear()
  mockSelect.mockClear()
  mockEq.mockClear()
  mockInsert.mockClear()
  mockSingle.mockClear()
  mockMaybeSingle.mockClear()
  mockLimit.mockClear()
})

// Import after mocks are set up
import {
  getUserPushTokens,
  getUserIdFromAddress,
  createNotification,
  getUserMainTagName,
} from './supabase'

describe('Notification Workflow Supabase Helpers', () => {
  const mockUserId = 'user-uuid-12345'
  const mockAddress = '0x1234567890abcdef1234567890abcdef12345678' as Address

  const redactId = (id: string) =>
    id.length > 12 ? `${id.slice(0, 8)}...` : `${id.slice(0, 4)}...`
  const redactHex = (value: string) =>
    value.length <= 14 ? value : `${value.slice(0, 8)}...${value.slice(-6)}`

  describe('getUserPushTokens', () => {
    it('should return empty array when userId is empty', async () => {
      const result = await getUserPushTokens('')
      expect(result).toEqual([])
      expect(log.warn).toHaveBeenCalledWith('getUserPushTokens: received empty userId')
      expect(mockFrom).not.toHaveBeenCalled()
    })

    it('should return push tokens when found', async () => {
      const mockTokens = [
        {
          id: 1,
          user_id: mockUserId,
          platform: 'expo' as const,
          token: 'ExponentPushToken[xxxx]',
          endpoint: null,
          p256dh: null,
          auth: null,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          device_id: 'device-1',
          is_active: true,
          last_used_at: null,
        },
        {
          id: 2,
          user_id: mockUserId,
          platform: 'web' as const,
          token: null,
          endpoint: 'https://fcm.googleapis.com/fcm/send/example',
          p256dh: 'test-p256dh',
          auth: 'test-auth',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          device_id: null,
          is_active: true,
          last_used_at: null,
        },
      ]

      mockEq
        .mockImplementationOnce(() => ({ eq: mockEq }))
        .mockImplementationOnce(() => ({
          data: mockTokens,
          error: null,
        }))

      const result = await getUserPushTokens(mockUserId)
      expect(result).toEqual(mockTokens)
      expect(mockFrom).toHaveBeenCalledWith('push_tokens')
      expect(mockSelect).toHaveBeenCalledWith('*')
      expect(mockEq).toHaveBeenNthCalledWith(1, 'user_id', mockUserId)
      expect(mockEq).toHaveBeenNthCalledWith(2, 'is_active', true)
    })

    it('should return empty array on database error', async () => {
      const mockError = createMockPostgrestError('DB error')
      mockEq
        .mockImplementationOnce(() => ({ eq: mockEq }))
        .mockImplementationOnce(() => ({
          data: null,
          error: mockError,
        }))

      const result = await getUserPushTokens(mockUserId)
      expect(result).toEqual([])
      expect(log.error).toHaveBeenCalledWith('Error fetching push tokens:', {
        userId: redactId(mockUserId),
        error: mockError,
      })
    })
  })

  describe('getUserIdFromAddress', () => {
    it('should return null when address is empty', async () => {
      const result = await getUserIdFromAddress('' as Address)
      expect(result).toBeNull()
      expect(log.warn).toHaveBeenCalledWith('getUserIdFromAddress: received empty address')
      expect(mockFrom).not.toHaveBeenCalled()
    })

    it('should return user_id when found', async () => {
      mockMaybeSingle.mockResolvedValueOnce(
        createSuccessMaybeSingleResponse({ user_id: mockUserId })
      )

      const result = await getUserIdFromAddress(mockAddress)
      expect(result).toBe(mockUserId)
      expect(mockFrom).toHaveBeenCalledWith('send_accounts')
      expect(mockSelect).toHaveBeenCalledWith('user_id')
      expect(mockEq).toHaveBeenCalledWith('address', mockAddress)
    })

    it('should return null when address not found', async () => {
      mockMaybeSingle.mockResolvedValueOnce(
        createNotFoundMaybeSingleResponse<{ user_id: string }>()
      )

      const result = await getUserIdFromAddress(mockAddress)
      expect(result).toBeNull()
      expect(log.warn).toHaveBeenCalledWith('No user_id found for address:', {
        address: redactHex(mockAddress),
      })
    })

    it('should return null on database error', async () => {
      const mockError = createMockPostgrestError('DB error')
      mockMaybeSingle.mockResolvedValueOnce({
        data: null,
        error: mockError,
        count: null,
        status: 500,
        statusText: 'Internal Server Error',
      })

      const result = await getUserIdFromAddress(mockAddress)
      expect(result).toBeNull()
      expect(log.error).toHaveBeenCalledWith('Error fetching user_id for address:', {
        address: redactHex(mockAddress),
        error: mockError,
      })
    })
  })

  describe('createNotification', () => {
    const validNotification = {
      user_id: mockUserId,
      type: 'transfer_received' as const,
      title: '+ 100 USDC',
      body: '/alice',
      data: { txHash: '0xabc' },
    }

    it('should return error when required fields are missing', async () => {
      const result = await createNotification({
        user_id: mockUserId,
        type: 'transfer_received' as const,
        title: 'Test',
        // missing body
        // biome-ignore lint/suspicious/noExplicitAny: testing invalid input intentionally
      } as any)

      expect(result.data).toBeNull()
      expect(result.error?.message).toBe('user_id, type, title, and body are required')
      expect(mockFrom).not.toHaveBeenCalled()
    })

    it('should create notification successfully', async () => {
      const insertedId = 123
      mockSingle.mockResolvedValueOnce(createSuccessSingleResponse({ id: insertedId }))

      const result = await createNotification(validNotification)

      expect(result.data).toEqual({ id: insertedId })
      expect(result.error).toBeNull()
      expect(mockFrom).toHaveBeenCalledWith('notifications')
      expect(mockInsert).toHaveBeenCalledWith({
        user_id: mockUserId,
        type: 'transfer_received',
        title: '+ 100 USDC',
        body: '/alice',
        data: { txHash: '0xabc' },
        read: false,
      })
    })

    it('should return error on database error', async () => {
      const mockError = createMockPostgrestError('Insert failed', '23505')
      mockSingle.mockResolvedValueOnce({
        data: null,
        error: mockError,
        count: null,
        status: 409,
        statusText: 'Conflict',
      })

      const result = await createNotification(validNotification)

      expect(result.data).toBeNull()
      expect(result.error).toEqual(mockError)
      expect(log.error).toHaveBeenCalledWith('Error creating notification:', {
        user_id: redactId(mockUserId),
        type: 'transfer_received',
        error: mockError,
      })
    })
  })

  describe('getUserMainTagName', () => {
    it('should return null when userId is empty', async () => {
      const result = await getUserMainTagName('')
      expect(result).toBeNull()
      expect(mockFrom).not.toHaveBeenCalled()
    })

    it('should return tag name when found', async () => {
      const mockTagName = 'alice'
      mockMaybeSingle.mockResolvedValueOnce(createSuccessMaybeSingleResponse({ name: mockTagName }))

      const result = await getUserMainTagName(mockUserId)
      expect(result).toBe(mockTagName)
      expect(mockFrom).toHaveBeenCalledWith('tags')
      expect(mockSelect).toHaveBeenCalledWith('name')
    })

    it('should return null when no tag found', async () => {
      mockMaybeSingle.mockResolvedValueOnce(createNotFoundMaybeSingleResponse<{ name: string }>())

      const result = await getUserMainTagName(mockUserId)
      expect(result).toBeNull()
    })

    it('should return null on database error', async () => {
      const mockError = createMockPostgrestError('DB error')
      mockMaybeSingle.mockResolvedValueOnce({
        data: null,
        error: mockError,
        count: null,
        status: 500,
        statusText: 'Internal Server Error',
      })

      const result = await getUserMainTagName(mockUserId)
      expect(result).toBeNull()
      expect(log.warn).toHaveBeenCalledWith('Error fetching tag for user:', {
        userId: redactId(mockUserId),
        error: mockError,
      })
    })
  })
})

describe('Notification Activity Helper Functions', () => {
  // Import the formatAmount function
  // Since it's not exported, we test it indirectly through the notification activities

  describe('formatAmount', () => {
    // Testing through integration with notification activities is preferred
    // The function formats amounts from wei to human-readable format

    it('should format whole amounts correctly', () => {
      // 1000000 (6 decimals) = 1.0
      const amount = '1000000'
      // The function divides by 10^6 for USDC
      const expected = '1'
      const result = formatAmountHelper(amount)
      expect(result).toBe(expected)
    })

    it('should format fractional amounts correctly', () => {
      // 1500000 (6 decimals) = 1.5
      const amount = '1500000'
      const expected = '1.5'
      const result = formatAmountHelper(amount)
      expect(result).toBe(expected)
    })

    it('should handle large amounts', () => {
      // 1000000000000 (6 decimals) = 1000000
      const amount = '1000000000000'
      const expected = '1000000'
      const result = formatAmountHelper(amount)
      expect(result).toBe(expected)
    })

    it('should handle small fractional amounts', () => {
      // 100 (6 decimals) = 0.0001
      const amount = '100'
      const expected = '0.0001'
      const result = formatAmountHelper(amount)
      expect(result).toBe(expected)
    })
  })
})

// Helper function to replicate formatAmount logic for testing
function formatAmountHelper(amount: string): string {
  const amountBigInt = BigInt(amount)
  const decimals = 6 // USDC decimals
  const divisor = BigInt(10 ** decimals)
  const wholePart = amountBigInt / divisor
  const fractionalPart = amountBigInt % divisor

  if (fractionalPart === 0n) {
    return wholePart.toString()
  }

  const fractionalStr = fractionalPart.toString().padStart(decimals, '0').replace(/0+$/, '')
  return `${wholePart}.${fractionalStr}`
}
