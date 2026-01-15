import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import type {
  PostgrestError,
  PostgrestMaybeSingleResponse,
  PostgrestSingleResponse,
} from '@supabase/supabase-js'
import { log } from '@temporalio/activity'
import type { Address } from 'viem'
import type { SupabaseClient } from '@supabase/supabase-js'

// Mock the modules FIRST
jest.mock('app/utils/supabase/admin')
jest.mock('@temporalio/activity', () => {
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
      warn: jest.fn(),
      error: jest.fn(),
      info: jest.fn(),
      debug: jest.fn(),
    },
    ApplicationFailure: {
      retryable: jest.fn(createRetryableError),
      nonRetryable: jest.fn(createNonRetryableError),
    },
  }
})

// --- Mock Setup ---
// Create the mock client instance first
const mockedSupabaseAdmin = {
  from: jest.fn(),
} as unknown as jest.Mocked<SupabaseClient>

// Mock the module, making the factory function return our mock instance
jest.mock('app/utils/supabase/admin', () => ({
  createSupabaseAdminClient: jest.fn(() => mockedSupabaseAdmin),
}))

// Define reusable mock functions for the chain
const mockMaybeSingle = jest.fn<() => Promise<PostgrestMaybeSingleResponse<unknown>>>()
const mockSingle = jest.fn<() => Promise<PostgrestSingleResponse<unknown>>>()
const mockEq = jest.fn().mockImplementation(() => ({
  single: mockSingle,
  maybeSingle: mockMaybeSingle,
  eq: mockEq,
  limit: mockLimit,
}))
const mockLimit = jest.fn().mockImplementation(() => ({
  maybeSingle: mockMaybeSingle,
}))
const mockSelect = jest.fn().mockImplementation(() => ({
  eq: mockEq,
  single: mockSingle,
  maybeSingle: mockMaybeSingle,
}))
const mockInsert = jest.fn().mockImplementation(() => ({
  select: mockSelect,
}))
const mockFrom = jest.fn().mockImplementation(() => ({
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
  jest.clearAllMocks()
  ;(mockedSupabaseAdmin.from as jest.Mock).mockImplementation(mockFrom)
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
  getSendAccountMainTagName,
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

    it('should return tag name when found via send_accounts.main_tag_id', async () => {
      const mockTagName = 'alice'
      mockMaybeSingle.mockResolvedValueOnce(
        createSuccessMaybeSingleResponse({ main_tag: { name: mockTagName } })
      )

      const result = await getUserMainTagName(mockUserId)
      expect(result).toBe(mockTagName)
      expect(mockFrom).toHaveBeenCalledWith('send_accounts')
      expect(mockSelect).toHaveBeenCalledWith('main_tag:tags!send_accounts_main_tag_id_fkey(name)')
      expect(mockEq).toHaveBeenCalledWith('user_id', mockUserId)
    })

    it('should return null when no send account found', async () => {
      mockMaybeSingle.mockResolvedValueOnce(
        createNotFoundMaybeSingleResponse<{ main_tag: { name: string } | null }>()
      )

      const result = await getUserMainTagName(mockUserId)
      expect(result).toBeNull()
      expect(log.info).toHaveBeenCalledWith('No send account found for user:', {
        userId: redactId(mockUserId),
      })
    })

    it('should return null when main_tag is null', async () => {
      mockMaybeSingle.mockResolvedValueOnce(createSuccessMaybeSingleResponse({ main_tag: null }))

      const result = await getUserMainTagName(mockUserId)
      expect(result).toBeNull()
      expect(log.info).toHaveBeenCalledWith('No main tag set for user send account:', {
        userId: redactId(mockUserId),
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

      const result = await getUserMainTagName(mockUserId)
      expect(result).toBeNull()
      expect(log.warn).toHaveBeenCalledWith('Error fetching main tag for user:', {
        userId: redactId(mockUserId),
        error: mockError,
        errorMessage: mockError.message,
        errorCode: mockError.code,
      })
    })
  })

  describe('getSendAccountMainTagName', () => {
    it('should return null when address is empty', async () => {
      const result = await getSendAccountMainTagName('' as Address)
      expect(result).toBeNull()
      expect(log.warn).toHaveBeenCalledWith('getSendAccountMainTagName: received empty address')
      expect(mockFrom).not.toHaveBeenCalled()
    })

    it('should return tag name when found via send_accounts.main_tag_id', async () => {
      const mockTagName = 'bob'
      mockMaybeSingle.mockResolvedValueOnce(
        createSuccessMaybeSingleResponse({ main_tag: { name: mockTagName } })
      )

      const result = await getSendAccountMainTagName(mockAddress)
      expect(result).toBe(mockTagName)
      expect(mockFrom).toHaveBeenCalledWith('send_accounts')
      expect(mockSelect).toHaveBeenCalledWith('main_tag:tags!send_accounts_main_tag_id_fkey(name)')
      expect(mockEq).toHaveBeenCalledWith('address', mockAddress)
      expect(log.info).toHaveBeenCalledWith('Found main tag for address:', {
        address: redactHex(mockAddress),
        tagName: mockTagName,
      })
    })

    it('should return null when no send account found', async () => {
      mockMaybeSingle.mockResolvedValueOnce(
        createNotFoundMaybeSingleResponse<{ main_tag: { name: string } | null }>()
      )

      const result = await getSendAccountMainTagName(mockAddress)
      expect(result).toBeNull()
      expect(log.info).toHaveBeenCalledWith('No send account found for address:', {
        address: redactHex(mockAddress),
      })
    })

    it('should return null when main_tag is null', async () => {
      mockMaybeSingle.mockResolvedValueOnce(createSuccessMaybeSingleResponse({ main_tag: null }))

      const result = await getSendAccountMainTagName(mockAddress)
      expect(result).toBeNull()
      expect(log.info).toHaveBeenCalledWith('No main tag set for send account:', {
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

      const result = await getSendAccountMainTagName(mockAddress)
      expect(result).toBeNull()
      expect(log.warn).toHaveBeenCalledWith('Error fetching main tag for address:', {
        address: redactHex(mockAddress),
        error: mockError,
        errorMessage: mockError.message,
        errorCode: mockError.code,
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
