import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import type {
  PostgrestError,
  PostgrestMaybeSingleResponse,
  PostgrestSingleResponse,
} from '@supabase/supabase-js'
import { log } from '@temporalio/activity'
import { supabaseAdmin } from 'app/utils/supabase/admin'
import type { Address } from 'viem'
import { bytesToHex, hexToBytes } from 'viem'
import {
  getUserIdFromAddress,
  updateTemporalSendEarnDeposit,
  upsertTemporalSendEarnDeposit,
  type TemporalDeposit,
  type TemporalDepositInsert,
  type TemporalDepositUpdate,
} from './supabase'

// Mock the modules FIRST
jest.mock('app/utils/supabase/admin')
jest.mock('@temporalio/activity', () => ({
  log: {
    warn: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
}))

// Helper type for Supabase bytea representation
type PgBytea = `\\x${string}`

// Helper function to convert Uint8Array to Supabase bytea format
function toPgBytea(bytes: Uint8Array): PgBytea {
  return `\\x${bytesToHex(bytes).substring(2)}`
}

import type { SupabaseClient } from '@supabase/supabase-js'

// Helper to create a mock PostgrestError
const createMockPostgrestError = (message: string): PostgrestError => ({
  message,
  details: 'Mock details',
  hint: 'Mock hint',
  code: 'MOCK',
})

// Type the mocked supabaseAdmin more specifically if possible, or use as jest.Mocked
const mockedSupabaseAdmin = supabaseAdmin as jest.Mocked<SupabaseClient>

// --- Mock Setup ---
// Define reusable mock functions for the chain
const mockMaybeSingle = jest.fn<() => Promise<PostgrestMaybeSingleResponse<unknown>>>()
const mockSingle = jest.fn<() => Promise<PostgrestSingleResponse<unknown>>>()
const mockEq = jest.fn().mockImplementation(() => ({
  single: mockSingle,
  maybeSingle: mockMaybeSingle,
  select: mockSelect, // Ensure select after eq leads to the select mock
}))
const mockSelect = jest.fn().mockImplementation(() => ({
  eq: mockEq,
  single: mockSingle,
  maybeSingle: mockMaybeSingle,
}))
const mockUpdate = jest.fn().mockImplementation(() => ({
  eq: mockEq,
}))
// Upsert should return an object that allows chaining .select()
const mockUpsert = jest.fn().mockImplementation(() => ({
  select: mockSelect,
}))
const mockFrom = jest.fn().mockImplementation(() => ({
  select: mockSelect,
  update: mockUpdate,
  upsert: mockUpsert,
}))
const mockSchema = jest.fn().mockImplementation(() => ({
  from: mockFrom,
}))

beforeEach(() => {
  jest.clearAllMocks()
  // Assign the mock implementation to the mocked client
  ;(mockedSupabaseAdmin.schema as jest.Mock).mockImplementation(mockSchema)
})
// --- End Mock Setup ---

describe('Deposit Workflow Supabase Helpers', () => {
  const mockWorkflowId = 'wf-123'
  const mockOwnerAddress = '0x1234567890abcdef1234567890abcdef12345678' as Address
  const mockVaultAddress = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' as Address
  const mockVaultBytes = hexToBytes(mockVaultAddress)
  const mockOwnerBytea = toPgBytea(hexToBytes(mockOwnerAddress))
  const mockAssets = 10_000_000n
  const mockVaultBytea = toPgBytea(mockVaultBytes)

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

  // Helper to create a successful maybeSingle response (not found)
  const createNotFoundMaybeSingleResponse = <T>(): PostgrestMaybeSingleResponse<T> => ({
    data: null,
    error: null,
    count: null,
    status: 200,
    statusText: 'OK',
  })

  describe('upsertTemporalSendEarnDeposit', () => {
    // Define input data matching the new function signature
    const inputDataWithVault: TemporalDepositInsert = {
      workflow_id: mockWorkflowId,
      status: 'initialized',
      owner: mockOwnerBytea,
      assets: mockAssets,
      vault: mockVaultBytea,
      // Other fields are optional or set by DB defaults
      created_at: '', // Mocked below
      updated_at: '', // Mocked below
      error_message: null,
      tx_hash: null,
      user_op_hash: null,
    }

    const inputDataWithoutVault: TemporalDepositInsert = {
      ...inputDataWithVault,
      vault: null,
    }

    it('should successfully upsert with all fields including vault', async () => {
      const expectedResult: TemporalDepositInsert = {
        ...inputDataWithVault, // Use the full input data
        created_at: new Date().toISOString(), // Mock timestamps
        updated_at: new Date().toISOString(),
      }
      const mockResponse = createSuccessSingleResponse(expectedResult)
      mockSingle.mockResolvedValueOnce(mockResponse)

      // Call with the single object argument
      await expect(upsertTemporalSendEarnDeposit(inputDataWithVault)).resolves.toEqual(mockResponse)

      // Assertions using the mocked structure
      expect(mockSchema).toHaveBeenCalledWith('temporal')
      expect(mockFrom).toHaveBeenCalledWith('send_earn_deposits')
      // Check the upsert call with the exact input object
      expect(mockUpsert).toHaveBeenCalledWith(inputDataWithVault, {
        onConflict: 'workflow_id',
        ignoreDuplicates: false,
      })
      expect(mockSelect).toHaveBeenCalledWith('*')
      expect(mockSingle).toHaveBeenCalledTimes(1) // Ensure it was called
    })

    it('should successfully upsert with vault as null', async () => {
      const expectedResult: TemporalDepositInsert = {
        ...inputDataWithoutVault, // Use input with null vault
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      const mockResponse = createSuccessSingleResponse(expectedResult)
      mockSingle.mockResolvedValueOnce(mockResponse)

      // Call with the object containing null vault
      await expect(upsertTemporalSendEarnDeposit(inputDataWithoutVault)).resolves.toEqual(
        mockResponse
      )
      // Check the upsert call with the exact input object
      expect(mockUpsert).toHaveBeenCalledWith(inputDataWithoutVault, expect.any(Object))
      expect(mockSingle).toHaveBeenCalledTimes(1) // Reset by beforeEach
    })

    // This test case is no longer relevant as the function signature requires vault (even if null)
    // it('should successfully upsert with vault undefined (treated as null)', async () => { ... })

    it('should throw error if required fields (excluding vault) are missing', async () => {
      // Test with missing 'owner' for example
      const incompleteData = {
        workflow_id: mockWorkflowId,
        status: 'initialized',
        assets: mockAssets,
        vault: mockVaultBytea,
      }
      await expect(
        // biome-ignore lint/suspicious/noExplicitAny: testing invalid input
        upsertTemporalSendEarnDeposit(incompleteData as any)
      ).rejects.toThrow('workflow_id, status, owner, and assets are required for initial upsert.')
      expect(mockUpsert).not.toHaveBeenCalled()
    })

    // Test case for missing 'assets'
    it('should throw error if assets field is missing', async () => {
      const incompleteData = {
        workflow_id: mockWorkflowId,
        status: 'initialized',
        owner: mockOwnerBytea,
        vault: mockVaultBytea,
      }
      await expect(
        // biome-ignore lint/suspicious/noExplicitAny: testing invalid input
        upsertTemporalSendEarnDeposit(incompleteData as any)
      ).rejects.toThrow('workflow_id, status, owner, and assets are required for initial upsert.')
      expect(mockUpsert).not.toHaveBeenCalled()
    })
  })

  // This is the start of the next describe block, the duplicated content above will be removed.
  describe('updateTemporalSendEarnDeposit', () => {
    const baseUpdateData: Pick<TemporalDepositUpdate, 'workflow_id'> = {
      workflow_id: mockWorkflowId,
    }

    it('should successfully update specified fields', async () => {
      const mockTxHashBytea = toPgBytea(hexToBytes('0xabc'))
      const updatePayload = { status: 'submitted' as const, tx_hash: mockTxHashBytea }
      const updateData = { ...baseUpdateData, ...updatePayload }
      const expectedResult: TemporalDeposit = {
        workflow_id: mockWorkflowId,
        status: 'submitted',
        owner: mockOwnerBytea,
        assets: mockAssets,
        vault: null,
        tx_hash: mockTxHashBytea,
        user_op_hash: null,
        error_message: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        activity_id: null,
      }
      const mockResponse = createSuccessSingleResponse(expectedResult)
      mockSingle.mockResolvedValueOnce(mockResponse)

      await expect(updateTemporalSendEarnDeposit(updateData)).resolves.toEqual(mockResponse)

      expect(mockSchema).toHaveBeenCalledWith('temporal')
      expect(mockFrom).toHaveBeenCalledWith('send_earn_deposits')
      expect(mockUpdate).toHaveBeenCalledWith(updatePayload)
      expect(mockEq).toHaveBeenCalledWith('workflow_id', mockWorkflowId) // Called after update
      expect(mockSelect).toHaveBeenCalledWith('*') // Called for the final select
      expect(mockEq).toHaveBeenCalledWith('workflow_id', mockWorkflowId) // Called after select
      expect(mockSingle).toHaveBeenCalledTimes(1) // Ensure the final select call happened
    })

    it('should successfully update the vault field', async () => {
      const updatePayload = { vault: mockVaultBytea }
      const updateData = { ...baseUpdateData, ...updatePayload }
      const expectedResult: TemporalDeposit = {
        workflow_id: mockWorkflowId,
        status: 'sent', // Assuming previous status
        owner: mockOwnerBytea,
        assets: mockAssets,
        vault: mockVaultBytea,
        tx_hash: toPgBytea(hexToBytes('0xabc')), // Assuming previous tx_hash
        user_op_hash: null,
        error_message: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        activity_id: null,
      }
      const mockResponse = createSuccessSingleResponse(expectedResult)
      mockSingle.mockResolvedValueOnce(mockResponse)

      await expect(updateTemporalSendEarnDeposit(updateData)).resolves.toEqual(mockResponse)
      expect(mockUpdate).toHaveBeenCalledWith(updatePayload)
      expect(mockEq).toHaveBeenCalledWith('workflow_id', mockWorkflowId) // After update
      expect(mockSingle).toHaveBeenCalledTimes(1) // Reset by beforeEach
    })

    it('should throw error if workflow_id is missing', async () => {
      const invalidUpdateData = { status: 'failed' }
      await expect(
        // biome-ignore lint/suspicious/noExplicitAny: testing invalid input
        updateTemporalSendEarnDeposit(invalidUpdateData as any)
      ).rejects.toThrow('Workflow ID is required to update temporal deposit record.')
      expect(mockUpdate).not.toHaveBeenCalled()
    })

    it('should fetch current record if payload is empty (only workflow_id provided)', async () => {
      const updateData = { workflow_id: mockWorkflowId } // No fields to update
      const currentRecord: TemporalDeposit = {
        workflow_id: mockWorkflowId,
        status: 'sent',
        owner: mockOwnerBytea,
        assets: mockAssets,
        vault: mockVaultBytea,
        tx_hash: toPgBytea(hexToBytes('0xabc')),
        user_op_hash: null,
        error_message: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        activity_id: null,
      }
      const mockResponse = createSuccessSingleResponse(currentRecord)
      mockSingle.mockResolvedValueOnce(mockResponse)
      // No need to spy on console.warn anymore, we check the mock log.warn

      // When no update happens, it should still return the fetched record wrapped in the response structure
      await expect(updateTemporalSendEarnDeposit(updateData)).resolves.toEqual(mockResponse)

      expect(mockUpdate).not.toHaveBeenCalled() // Update should not be called
      expect(mockSelect).toHaveBeenCalledWith('*')
      expect(mockEq).toHaveBeenCalledWith('workflow_id', mockWorkflowId)
      expect(mockSingle).toHaveBeenCalledTimes(1)
      // Check the mocked log.warn (it receives a single interpolated string)
      expect(log.warn).toHaveBeenCalledWith(`No fields to update for workflow ${mockWorkflowId}`)
    })
  })

  describe('getUserIdFromAddress', () => {
    const mockAddress = '0x1111111111111111111111111111111111111111' as Address
    const mockUserId = 'user-uuid-12345'

    it('should return user_id when found', async () => {
      // Use the pre-defined mock function
      mockMaybeSingle.mockResolvedValueOnce(
        createSuccessMaybeSingleResponse({ user_id: mockUserId })
      )

      await expect(getUserIdFromAddress(mockAddress)).resolves.toBe(mockUserId)
      expect(mockSchema).toHaveBeenCalledWith('public')
      expect(mockFrom).toHaveBeenCalledWith('send_accounts')
      expect(mockSelect).toHaveBeenCalledWith('user_id')
      expect(mockEq).toHaveBeenCalledWith('address', mockAddress)
      expect(mockMaybeSingle).toHaveBeenCalledTimes(1)
    })

    it('should return null when address is not found', async () => {
      // Use the pre-defined mock function
      mockMaybeSingle.mockResolvedValueOnce(
        createNotFoundMaybeSingleResponse<{ user_id: string }>()
      )
      // No need to spy on console.warn

      await expect(getUserIdFromAddress(mockAddress)).resolves.toBeNull()
      expect(mockMaybeSingle).toHaveBeenCalledTimes(1)
      // Check the mocked log.warn
      expect(log.warn).toHaveBeenCalledWith(`No user_id found for address ${mockAddress}`)
    })

    it('should return null when address is empty', async () => {
      // No need to spy on console.warn
      await expect(getUserIdFromAddress('' as Address)).resolves.toBeNull()
      // Ensure no DB call was made
      expect(mockSchema).not.toHaveBeenCalled()
      // Check the mocked log.warn
      expect(log.warn).toHaveBeenCalledWith('Received empty address')
    })

    // Add more tests for error handling (e.g., database errors) if needed
  })
}) // Closing brace for the top-level describe
