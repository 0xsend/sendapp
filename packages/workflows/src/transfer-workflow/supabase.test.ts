import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import type { PostgrestError, PostgrestSingleResponse } from '@supabase/supabase-js'
import { log } from '@temporalio/activity'
import { createSupabaseAdminClient } from 'app/utils/supabase/admin'
import {
  upsertTemporalSendAccountTransfer,
  updateTemporalSendAccountTransfer,
  type TemporalTransfer,
  type TemporalTransferInsert,
  type TemporalTransferUpdate,
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

import type { SupabaseClient } from '@supabase/supabase-js'

// --- Mock Setup ---
const mockedSupabaseAdmin = {
  schema: jest.fn(),
} as unknown as jest.Mocked<SupabaseClient>

jest.mock('app/utils/supabase/admin', () => ({
  createSupabaseAdminClient: jest.fn(() => mockedSupabaseAdmin),
}))

jest.mock('@temporalio/activity', () => ({
  log: {
    warn: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
}))

// Helper to create a mock PostgrestError
const createMockPostgrestError = (message: string): PostgrestError => ({
  message,
  details: 'Mock details',
  hint: 'Mock hint',
  code: 'MOCK',
  name: 'PostgrestError',
})

// Define reusable mock functions for the chain
const mockSingle = jest.fn<() => Promise<PostgrestSingleResponse<unknown>>>()
const mockEq = jest.fn().mockImplementation(() => ({
  single: mockSingle,
  select: mockSelect,
}))
const mockSelect = jest.fn().mockImplementation(() => ({
  eq: mockEq,
  single: mockSingle,
}))
const mockUpdate = jest.fn().mockImplementation(() => ({
  eq: mockEq,
}))
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
  ;(mockedSupabaseAdmin.schema as jest.Mock).mockImplementation(mockSchema)
  mockSchema.mockClear()
  mockFrom.mockClear()
  mockSelect.mockClear()
  mockEq.mockClear()
  mockUpdate.mockClear()
  mockUpsert.mockClear()
  mockSingle.mockClear()
})

describe('Transfer Workflow Supabase Helpers', () => {
  const mockWorkflowId = 'wf-transfer-123'

  // Helper to create a successful single response
  const createSuccessSingleResponse = <T>(data: T): PostgrestSingleResponse<T> => ({
    data,
    error: null,
    count: null,
    status: 200,
    statusText: 'OK',
  })

  describe('upsertTemporalSendAccountTransfer', () => {
    const inputData: TemporalTransferInsert = {
      workflow_id: mockWorkflowId,
      status: 'initialized',
      data: {
        sender: '\\x1234567890abcdef1234567890abcdef12345678',
      },
    }

    it('should successfully upsert with required fields', async () => {
      const expectedResult: TemporalTransfer = {
        id: 1,
        user_id: 'user-123',
        workflow_id: mockWorkflowId,
        status: 'initialized',
        data: {
          sender: '\\x1234567890abcdef1234567890abcdef12345678',
        },
        created_at_block_num: null,
        send_account_transfers_activity_event_id: null,
        send_account_transfers_activity_event_name: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        activity_id: null,
      }
      const mockResponse = createSuccessSingleResponse(expectedResult)
      mockSingle.mockResolvedValueOnce(mockResponse)

      await expect(upsertTemporalSendAccountTransfer(inputData)).resolves.toEqual(mockResponse)

      expect(mockSchema).toHaveBeenCalledWith('temporal')
      expect(mockFrom).toHaveBeenCalledWith('send_account_transfers')
      expect(mockUpsert).toHaveBeenCalledWith(
        { workflow_id: mockWorkflowId, status: 'initialized', data: inputData.data },
        {
          onConflict: 'workflow_id',
          ignoreDuplicates: false,
        }
      )
      expect(mockSelect).toHaveBeenCalledWith('*')
      expect(mockSingle).toHaveBeenCalledTimes(1)
    })

    it('should successfully upsert with token transfer data', async () => {
      const tokenData: TemporalTransferInsert = {
        workflow_id: mockWorkflowId,
        status: 'submitted',
        data: {
          f: '\\x1234567890abcdef1234567890abcdef12345678',
          t: '\\xabcdefabcdefabcdefabcdefabcdefabcdef1234',
          v: '1000000',
          log_addr: '\\x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
        },
      }
      const expectedResult: TemporalTransfer = {
        id: 2,
        user_id: 'user-123',
        // biome-ignore lint/style/noNonNullAssertion: test data is fully defined
        workflow_id: tokenData.workflow_id!,
        // biome-ignore lint/style/noNonNullAssertion: test data is fully defined
        status: tokenData.status!,
        // biome-ignore lint/style/noNonNullAssertion: test data is fully defined
        data: tokenData.data!,
        created_at_block_num: null,
        send_account_transfers_activity_event_id: null,
        send_account_transfers_activity_event_name: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        activity_id: null,
      }
      const mockResponse = createSuccessSingleResponse(expectedResult)
      mockSingle.mockResolvedValueOnce(mockResponse)

      await expect(upsertTemporalSendAccountTransfer(tokenData)).resolves.toEqual(mockResponse)
      expect(mockUpsert).toHaveBeenCalledWith(
        { workflow_id: mockWorkflowId, status: 'submitted', data: tokenData.data },
        expect.any(Object)
      )
    })
  })

  describe('updateTemporalSendAccountTransfer', () => {
    const baseUpdateData: Pick<TemporalTransferUpdate, 'workflow_id'> = {
      workflow_id: mockWorkflowId,
    }

    it('should successfully update status field', async () => {
      const updatePayload = { status: 'sent' as const }
      const updateData = { ...baseUpdateData, ...updatePayload }
      const expectedResult: TemporalTransfer = {
        id: 3,
        user_id: 'user-123',
        workflow_id: mockWorkflowId,
        status: 'sent',
        data: {},
        created_at_block_num: null,
        send_account_transfers_activity_event_id: null,
        send_account_transfers_activity_event_name: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        activity_id: null,
      }
      const mockResponse = createSuccessSingleResponse(expectedResult)
      mockSingle.mockResolvedValueOnce(mockResponse)

      await expect(updateTemporalSendAccountTransfer(updateData)).resolves.toEqual(mockResponse)

      expect(mockSchema).toHaveBeenCalledWith('temporal')
      expect(mockFrom).toHaveBeenCalledWith('send_account_transfers')
      expect(mockUpdate).toHaveBeenCalledWith(updatePayload)
      expect(mockEq).toHaveBeenCalledWith('workflow_id', mockWorkflowId)
      expect(mockSelect).toHaveBeenCalledWith('*')
      expect(mockSingle).toHaveBeenCalledTimes(1)
    })

    it('should successfully update data field', async () => {
      const updatePayload = {
        data: {
          user_op_hash: '\\xabcd1234',
          tx_hash: '\\xdcba4321',
        },
      }
      const updateData = { ...baseUpdateData, ...updatePayload }
      const expectedResult: TemporalTransfer = {
        id: 4,
        user_id: 'user-123',
        workflow_id: mockWorkflowId,
        status: 'confirmed',
        data: updatePayload.data,
        created_at_block_num: 123456,
        send_account_transfers_activity_event_id: 'event-123',
        send_account_transfers_activity_event_name: 'send_account_transfers',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        activity_id: null,
      }
      const mockResponse = createSuccessSingleResponse(expectedResult)
      mockSingle.mockResolvedValueOnce(mockResponse)

      await expect(updateTemporalSendAccountTransfer(updateData)).resolves.toEqual(mockResponse)
      expect(mockUpdate).toHaveBeenCalledWith(updatePayload)
      expect(mockEq).toHaveBeenCalledWith('workflow_id', mockWorkflowId)
    })

    it('should filter out null and undefined values from payload', async () => {
      const updateData = {
        workflow_id: mockWorkflowId,
        status: 'sent' as const,
        data: null,
        created_at_block_num: undefined,
      }
      const expectedPayload = { status: 'sent' }
      const expectedResult: TemporalTransfer = {
        id: 5,
        user_id: 'user-123',
        workflow_id: mockWorkflowId,
        status: 'sent',
        data: {},
        created_at_block_num: null,
        send_account_transfers_activity_event_id: null,
        send_account_transfers_activity_event_name: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        activity_id: null,
      }
      const mockResponse = createSuccessSingleResponse(expectedResult)
      mockSingle.mockResolvedValueOnce(mockResponse)

      await expect(updateTemporalSendAccountTransfer(updateData)).resolves.toEqual(mockResponse)
      expect(mockUpdate).toHaveBeenCalledWith(expectedPayload)
    })

    it('should throw error if workflow_id is missing', async () => {
      const invalidUpdateData = { status: 'failed' }
      await expect(
        // biome-ignore lint/suspicious/noExplicitAny: testing invalid input
        updateTemporalSendAccountTransfer(invalidUpdateData as any)
      ).rejects.toThrow('Workflow ID is required to update temporal transfer')
      expect(mockUpdate).not.toHaveBeenCalled()
    })

    it('should update with empty payload if only workflow_id provided', async () => {
      const updateData = { workflow_id: mockWorkflowId }
      const expectedResult: TemporalTransfer = {
        id: 6,
        user_id: 'user-123',
        workflow_id: mockWorkflowId,
        status: 'sent',
        data: {},
        created_at_block_num: null,
        send_account_transfers_activity_event_id: null,
        send_account_transfers_activity_event_name: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        activity_id: null,
      }
      const mockResponse = createSuccessSingleResponse(expectedResult)
      mockSingle.mockResolvedValueOnce(mockResponse)

      await expect(updateTemporalSendAccountTransfer(updateData)).resolves.toEqual(mockResponse)
      expect(mockUpdate).toHaveBeenCalledWith({})
      expect(mockEq).toHaveBeenCalledWith('workflow_id', mockWorkflowId)
      expect(mockSingle).toHaveBeenCalledTimes(1)
    })
  })
})
