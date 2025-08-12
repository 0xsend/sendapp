import { describe, expect, it, beforeEach, afterEach, jest } from '@jest/globals'
import type { ApplicationFailure } from '@temporalio/activity'
import { createTransferActivities } from './activities'
import type { TemporalTransfer, TemporalTransferInsert, TemporalTransferUpdate } from './supabase'

// Mock dependencies
jest.mock('@my/workflows/utils')
jest.mock('app/utils/supabase/admin')
jest.mock('./supabase')
jest.mock('./wagmi')

// Mock the log function
const mockLog = {
  warn: jest.fn(),
  info: jest.fn(),
  error: jest.fn(),
}
jest.mock('@temporalio/activity', () => ({
  ApplicationFailure: {
    retryable: jest.fn((message: string, code: string, details?: any) => {
      const error = new Error(message) as any
      error.code = code
      error.details = details
      error.type = 'retryable'
      return error
    }),
    nonRetryable: jest.fn((message: string, code: string, details?: any) => {
      const error = new Error(message) as any
      error.code = code
      error.details = details
      error.type = 'nonRetryable'
      return error
    }),
  },
  log: mockLog,
}))

// Mock Supabase admin client
const mockSupabaseClient = {
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn(),
        eq: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
    })),
    delete: jest.fn(() => ({
      eq: jest.fn(() => ({
        eq: jest.fn(),
      })),
    })),
  })),
}

const mockCreateSupabaseAdminClient = jest.fn(() => mockSupabaseClient)

// Mock isRetryableDBError
const mockIsRetryableDBError = jest.fn()

describe('Transfer Workflow Activities', () => {
  let activities: ReturnType<typeof createTransferActivities>
  
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Setup mocks
    jest.doMock('app/utils/supabase/admin', () => ({
      createSupabaseAdminClient: mockCreateSupabaseAdminClient,
    }))
    
    jest.doMock('@my/workflows/utils', () => ({
      bootstrap: jest.fn(),
      isRetryableDBError: mockIsRetryableDBError,
    }))
    
    activities = createTransferActivities({})
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('cleanupTemporalActivityAfterConfirmation', () => {
    const validParams = {
      workflow_id: 'temporal/transfer/user-123/0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
      final_event_id: 'send_account_transfers/base_logs/12345/0/1',
      final_event_name: 'send_account_transfers',
    }

    describe('Parameter Validation Tests', () => {
      it('should return early if workflow_id is missing', async () => {
        await activities.cleanupTemporalActivityAfterConfirmation({
          ...validParams,
          workflow_id: '',
        })

        expect(mockLog.warn).toHaveBeenCalledWith('Invalid parameters for cleanup activity', {
          workflow_id: '',
          final_event_id: validParams.final_event_id,
          final_event_name: validParams.final_event_name,
        })
        expect(mockCreateSupabaseAdminClient).not.toHaveBeenCalled()
      })

      it('should return early if final_event_id is missing', async () => {
        await activities.cleanupTemporalActivityAfterConfirmation({
          ...validParams,
          final_event_id: '',
        })

        expect(mockLog.warn).toHaveBeenCalledWith('Invalid parameters for cleanup activity', {
          workflow_id: validParams.workflow_id,
          final_event_id: '',
          final_event_name: validParams.final_event_name,
        })
      })

      it('should return early if final_event_name is missing', async () => {
        await activities.cleanupTemporalActivityAfterConfirmation({
          ...validParams,
          final_event_name: '',
        })

        expect(mockLog.warn).toHaveBeenCalledWith('Invalid parameters for cleanup activity', {
          workflow_id: validParams.workflow_id,
          final_event_id: validParams.final_event_id,
          final_event_name: '',
        })
      })

      it('should reject invalid workflow_id format for security', async () => {
        const invalidWorkflowId = 'malicious-workflow-id'
        
        await activities.cleanupTemporalActivityAfterConfirmation({
          ...validParams,
          workflow_id: invalidWorkflowId,
        })

        expect(mockLog.warn).toHaveBeenCalledWith('Invalid workflow_id format, skipping cleanup for security', {
          workflow_id: invalidWorkflowId,
        })
        expect(mockCreateSupabaseAdminClient).not.toHaveBeenCalled()
      })

      it('should accept valid workflow_id format', async () => {
        const mockFrom = jest.fn(() => ({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              eq: jest.fn(() => ({
                single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
              })),
            })),
          })),
        }))
        
        mockSupabaseClient.from = mockFrom

        await activities.cleanupTemporalActivityAfterConfirmation(validParams)

        expect(mockLog.warn).not.toHaveBeenCalledWith(
          expect.stringContaining('Invalid workflow_id format')
        )
        expect(mockCreateSupabaseAdminClient).toHaveBeenCalled()
      })
    })

    describe('Final Activity Verification Tests', () => {
      beforeEach(() => {
        mockIsRetryableDBError.mockReturnValue(false)
      })

      it('should verify final blockchain activity exists before cleanup', async () => {
        const mockSingle = jest.fn().mockResolvedValue({
          data: { id: 'activity-123', created_at: new Date().toISOString() },
          error: null,
        })
        
        const mockEq2 = jest.fn(() => ({ single: mockSingle }))
        const mockEq1 = jest.fn(() => ({ eq: mockEq2 }))
        const mockSelect = jest.fn(() => ({ eq: mockEq1 }))
        mockSupabaseClient.from = jest.fn(() => ({ select: mockSelect }))

        // Also mock temporal activity check to return not found
        mockSingle
          .mockResolvedValueOnce({
            data: { id: 'activity-123', created_at: new Date().toISOString() },
            error: null,
          })
          .mockResolvedValueOnce({
            data: null,
            error: { code: 'PGRST116' }, // Not found
          })

        await activities.cleanupTemporalActivityAfterConfirmation(validParams)

        expect(mockSelect).toHaveBeenCalledWith('id, created_at')
        expect(mockEq1).toHaveBeenCalledWith('event_name', validParams.final_event_name)
        expect(mockEq2).toHaveBeenCalledWith('event_id', validParams.final_event_id)
      })

      it('should skip cleanup if final activity does not exist', async () => {
        const mockSingle = jest.fn().mockResolvedValue({
          data: null,
          error: null,
        })
        
        const mockEq2 = jest.fn(() => ({ single: mockSingle }))
        const mockEq1 = jest.fn(() => ({ eq: mockEq2 }))
        const mockSelect = jest.fn(() => ({ eq: mockEq1 }))
        mockSupabaseClient.from = jest.fn(() => ({ select: mockSelect }))

        await activities.cleanupTemporalActivityAfterConfirmation(validParams)

        expect(mockLog.warn).toHaveBeenCalledWith(
          'Final blockchain activity not found, skipping temporal cleanup',
          expect.objectContaining({
            workflow_id: validParams.workflow_id,
            final_event_id: validParams.final_event_id,
            final_event_name: validParams.final_event_name,
          })
        )
      })

      it('should handle retryable database errors during verification', async () => {
        const dbError = { code: 'CONNECTION_ERROR', message: 'Connection lost' }
        mockIsRetryableDBError.mockReturnValue(true)
        
        const mockSingle = jest.fn().mockResolvedValue({
          data: null,
          error: dbError,
        })
        
        const mockEq2 = jest.fn(() => ({ single: mockSingle }))
        const mockEq1 = jest.fn(() => ({ eq: mockEq2 }))
        const mockSelect = jest.fn(() => ({ eq: mockEq1 }))
        mockSupabaseClient.from = jest.fn(() => ({ select: mockSelect }))

        const { ApplicationFailure } = await import('@temporalio/activity')

        await expect(
          activities.cleanupTemporalActivityAfterConfirmation(validParams)
        ).rejects.toMatchObject({
          type: 'retryable',
          message: 'Database connection error during cleanup verification, retrying...',
        })

        expect(ApplicationFailure.retryable).toHaveBeenCalledWith(
          'Database connection error during cleanup verification, retrying...',
          'CONNECTION_ERROR',
          expect.objectContaining({
            error: dbError,
            workflow_id: validParams.workflow_id,
          })
        )
      })
    })

    describe('Timing Safety Tests', () => {
      it('should delay cleanup if minimum time has not passed', async () => {
        const recentTime = new Date(Date.now() - 500) // 500ms ago
        
        const mockSingle = jest.fn()
          .mockResolvedValueOnce({
            data: { id: 'activity-123', created_at: recentTime.toISOString() },
            error: null,
          })
          .mockResolvedValueOnce({
            data: null,
            error: { code: 'PGRST116' }, // Temporal activity not found
          })
        
        const mockEq2 = jest.fn(() => ({ single: mockSingle }))
        const mockEq1 = jest.fn(() => ({ eq: mockEq2 }))
        const mockSelect = jest.fn(() => ({ eq: mockEq1 }))
        mockSupabaseClient.from = jest.fn(() => ({ select: mockSelect }))

        // Mock setTimeout to track delay
        const originalSetTimeout = global.setTimeout
        let delayTime = 0
        global.setTimeout = jest.fn((callback, delay) => {
          delayTime = delay
          callback()
          return 1 as any
        })

        await activities.cleanupTemporalActivityAfterConfirmation(validParams)

        expect(mockLog.info).toHaveBeenCalledWith(
          'Delaying cleanup to ensure proper sequencing',
          expect.objectContaining({
            workflow_id: validParams.workflow_id,
            min_delay_ms: 1000,
          })
        )
        expect(delayTime).toBeGreaterThan(0)

        global.setTimeout = originalSetTimeout
      })

      it('should not delay if sufficient time has passed', async () => {
        const oldTime = new Date(Date.now() - 5000) // 5 seconds ago
        
        const mockSingle = jest.fn()
          .mockResolvedValueOnce({
            data: { id: 'activity-123', created_at: oldTime.toISOString() },
            error: null,
          })
          .mockResolvedValueOnce({
            data: null,
            error: { code: 'PGRST116' }, // Temporal activity not found
          })
        
        const mockEq2 = jest.fn(() => ({ single: mockSingle }))
        const mockEq1 = jest.fn(() => ({ eq: mockEq2 }))
        const mockSelect = jest.fn(() => ({ eq: mockEq1 }))
        mockSupabaseClient.from = jest.fn(() => ({ select: mockSelect }))

        // Mock setTimeout to ensure it's not called
        global.setTimeout = jest.fn()

        await activities.cleanupTemporalActivityAfterConfirmation(validParams)

        expect(mockLog.info).not.toHaveBeenCalledWith(
          expect.stringContaining('Delaying cleanup')
        )
        expect(global.setTimeout).not.toHaveBeenCalled()
      })
    })

    describe('Temporal Activity Existence Check Tests', () => {
      beforeEach(() => {
        // Setup default final activity verification to succeed
        const mockSingle = jest.fn()
          .mockResolvedValueOnce({
            data: { id: 'final-activity', created_at: new Date(Date.now() - 5000).toISOString() },
            error: null,
          })
        
        const mockEq2 = jest.fn(() => ({ single: mockSingle }))
        const mockEq1 = jest.fn(() => ({ eq: mockEq2 }))
        const mockSelect = jest.fn(() => ({ eq: mockEq1 }))
        mockSupabaseClient.from = jest.fn(() => ({ select: mockSelect }))
      })

      it('should return early if temporal activity already cleaned up', async () => {
        const mockSingle = jest.fn()
          .mockResolvedValueOnce({
            data: { id: 'final-activity', created_at: new Date(Date.now() - 5000).toISOString() },
            error: null,
          })
          .mockResolvedValueOnce({
            data: null,
            error: { code: 'PGRST116' }, // Temporal activity not found
          })

        const mockEq2 = jest.fn(() => ({ single: mockSingle }))
        const mockEq1 = jest.fn(() => ({ eq: mockEq2 }))
        const mockSelect = jest.fn(() => ({ eq: mockEq1 }))
        mockSupabaseClient.from = jest.fn(() => ({ select: mockSelect }))

        await activities.cleanupTemporalActivityAfterConfirmation(validParams)

        expect(mockLog.info).toHaveBeenCalledWith('Temporal activity already cleaned up', {
          workflow_id: validParams.workflow_id,
        })

        // Should not attempt delete operation
        expect(mockSupabaseClient.from).not.toHaveBeenCalledWith('activity')
      })

      it('should handle retryable errors during temporal activity check', async () => {
        const dbError = { code: 'TIMEOUT_ERROR', message: 'Query timeout' }
        mockIsRetryableDBError.mockReturnValue(true)

        const mockSingle = jest.fn()
          .mockResolvedValueOnce({
            data: { id: 'final-activity', created_at: new Date(Date.now() - 5000).toISOString() },
            error: null,
          })
          .mockResolvedValueOnce({
            data: null,
            error: dbError,
          })

        const mockEq2 = jest.fn(() => ({ single: mockSingle }))
        const mockEq1 = jest.fn(() => ({ eq: mockEq2 }))
        const mockSelect = jest.fn(() => ({ eq: mockEq1 }))
        mockSupabaseClient.from = jest.fn(() => ({ select: mockSelect }))

        const { ApplicationFailure } = await import('@temporalio/activity')

        await expect(
          activities.cleanupTemporalActivityAfterConfirmation(validParams)
        ).rejects.toMatchObject({
          type: 'retryable',
          message: 'Database connection error during temporal activity check, retrying...',
        })

        expect(ApplicationFailure.retryable).toHaveBeenCalledWith(
          'Database connection error during temporal activity check, retrying...',
          'TIMEOUT_ERROR',
          expect.objectContaining({
            error: dbError,
            workflow_id: validParams.workflow_id,
          })
        )
      })
    })

    describe('Cleanup Execution Tests', () => {
      beforeEach(() => {
        // Setup default mocks for successful verification path
        const mockSingle = jest.fn()
          .mockResolvedValueOnce({
            data: { id: 'final-activity', created_at: new Date(Date.now() - 5000).toISOString() },
            error: null,
          })
          .mockResolvedValueOnce({
            data: { id: 'temporal-activity' },
            error: null,
          })

        const mockEq2 = jest.fn(() => ({ single: mockSingle }))
        const mockEq1 = jest.fn(() => ({ eq: mockEq2 }))
        const mockSelect = jest.fn(() => ({ eq: mockEq1 }))
        mockSupabaseClient.from = jest.fn(() => ({ select: mockSelect }))
      })

      it('should successfully delete temporal activity', async () => {
        const mockDelete = jest.fn().mockResolvedValue({ error: null })
        const mockEqDelete2 = jest.fn(() => mockDelete)
        const mockEqDelete1 = jest.fn(() => ({ eq: mockEqDelete2 }))
        const mockDeleteChain = jest.fn(() => ({ eq: mockEqDelete1 }))

        // Mock the from method to return appropriate chains
        mockSupabaseClient.from = jest.fn((table) => {
          if (table === 'activity') {
            // For delete operations
            return { delete: mockDeleteChain }
          }
          // For select operations (verification)
          const mockSingle = jest.fn()
            .mockResolvedValueOnce({
              data: { id: 'final-activity', created_at: new Date(Date.now() - 5000).toISOString() },
              error: null,
            })
            .mockResolvedValueOnce({
              data: { id: 'temporal-activity' },
              error: null,
            })

          const mockEq2 = jest.fn(() => ({ single: mockSingle }))
          const mockEq1 = jest.fn(() => ({ eq: mockEq2 }))
          return { select: jest.fn(() => ({ eq: mockEq1 })) }
        })

        await activities.cleanupTemporalActivityAfterConfirmation(validParams)

        expect(mockDeleteChain).toHaveBeenCalled()
        expect(mockEqDelete1).toHaveBeenCalledWith('event_name', 'temporal_send_account_transfers')
        expect(mockEqDelete2).toHaveBeenCalledWith('event_id', validParams.workflow_id)
        expect(mockLog.info).toHaveBeenCalledWith(
          'Successfully cleaned up temporal activity',
          expect.objectContaining({
            workflow_id: validParams.workflow_id,
            final_event_id: validParams.final_event_id,
            final_event_name: validParams.final_event_name,
          })
        )
      })

      it('should handle retryable errors during cleanup gracefully (non-blocking)', async () => {
        const dbError = { code: 'LOCK_ERROR', message: 'Row locked' }
        mockIsRetryableDBError.mockReturnValue(true)

        const mockDelete = jest.fn().mockResolvedValue({ error: dbError })
        const mockEqDelete2 = jest.fn(() => mockDelete)
        const mockEqDelete1 = jest.fn(() => ({ eq: mockEqDelete2 }))
        const mockDeleteChain = jest.fn(() => ({ eq: mockEqDelete1 }))

        mockSupabaseClient.from = jest.fn((table) => {
          if (table === 'activity') {
            return { delete: mockDeleteChain }
          }
          // For select operations
          const mockSingle = jest.fn()
            .mockResolvedValueOnce({
              data: { id: 'final-activity', created_at: new Date(Date.now() - 5000).toISOString() },
              error: null,
            })
            .mockResolvedValueOnce({
              data: { id: 'temporal-activity' },
              error: null,
            })

          const mockEq2 = jest.fn(() => ({ single: mockSingle }))
          const mockEq1 = jest.fn(() => ({ eq: mockEq2 }))
          return { select: jest.fn(() => ({ eq: mockEq1 })) }
        })

        const { ApplicationFailure } = await import('@temporalio/activity')

        await expect(
          activities.cleanupTemporalActivityAfterConfirmation(validParams)
        ).rejects.toMatchObject({
          type: 'retryable',
          message: 'Database connection error during cleanup, retrying...',
        })

        expect(ApplicationFailure.retryable).toHaveBeenCalledWith(
          'Database connection error during cleanup, retrying...',
          'LOCK_ERROR',
          expect.objectContaining({
            error: dbError,
            workflow_id: validParams.workflow_id,
          })
        )
      })

      it('should log non-retryable errors but not fail workflow', async () => {
        const dbError = { code: 'PERMISSION_ERROR', message: 'Access denied' }
        mockIsRetryableDBError.mockReturnValue(false)

        const mockDelete = jest.fn().mockResolvedValue({ error: dbError })
        const mockEqDelete2 = jest.fn(() => mockDelete)
        const mockEqDelete1 = jest.fn(() => ({ eq: mockEqDelete2 }))
        const mockDeleteChain = jest.fn(() => ({ eq: mockEqDelete1 }))

        mockSupabaseClient.from = jest.fn((table) => {
          if (table === 'activity') {
            return { delete: mockDeleteChain }
          }
          // For select operations
          const mockSingle = jest.fn()
            .mockResolvedValueOnce({
              data: { id: 'final-activity', created_at: new Date(Date.now() - 5000).toISOString() },
              error: null,
            })
            .mockResolvedValueOnce({
              data: { id: 'temporal-activity' },
              error: null,
            })

          const mockEq2 = jest.fn(() => ({ single: mockSingle }))
          const mockEq1 = jest.fn(() => ({ eq: mockEq2 }))
          return { select: jest.fn(() => ({ eq: mockEq1 })) }
        })

        // Should not throw - cleanup failures are non-blocking
        await activities.cleanupTemporalActivityAfterConfirmation(validParams)

        expect(mockLog.warn).toHaveBeenCalledWith(
          'Failed to cleanup temporal activity (non-critical)',
          expect.objectContaining({
            error: dbError,
            workflow_id: validParams.workflow_id,
          })
        )
      })
    })

    describe('Edge Case Integration Tests', () => {
      it('should handle complete race condition scenario correctly', async () => {
        // Simulate the exact race condition timeline:
        // 1. Final activity exists
        // 2. Created very recently (requires delay)
        // 3. Temporal activity still exists
        // 4. Successful cleanup

        const recentTime = new Date(Date.now() - 500) // Recent activity
        let cleanupExecuted = false

        const mockSingle = jest.fn()
          .mockResolvedValueOnce({
            data: { id: 'final-activity', created_at: recentTime.toISOString() },
            error: null,
          })
          .mockResolvedValueOnce({
            data: { id: 'temporal-activity' },
            error: null,
          })

        const mockEq2 = jest.fn(() => ({ single: mockSingle }))
        const mockEq1 = jest.fn(() => ({ eq: mockEq2 }))
        const mockSelect = jest.fn(() => ({ eq: mockEq1 }))

        const mockDelete = jest.fn().mockImplementation(() => {
          cleanupExecuted = true
          return { error: null }
        })
        const mockEqDelete2 = jest.fn(() => mockDelete)
        const mockEqDelete1 = jest.fn(() => ({ eq: mockEqDelete2 }))
        const mockDeleteChain = jest.fn(() => ({ eq: mockEqDelete1 }))

        mockSupabaseClient.from = jest.fn((table) => {
          if (table === 'activity') {
            return { delete: mockDeleteChain }
          }
          return { select: mockSelect }
        })

        // Mock setTimeout to simulate delay
        const originalSetTimeout = global.setTimeout
        global.setTimeout = jest.fn((callback, delay) => {
          expect(delay).toBeGreaterThan(0)
          callback()
          return 1 as any
        })

        await activities.cleanupTemporalActivityAfterConfirmation(validParams)

        expect(mockLog.info).toHaveBeenCalledWith(
          expect.stringContaining('Delaying cleanup'),
          expect.any(Object)
        )
        expect(cleanupExecuted).toBe(true)
        expect(mockLog.info).toHaveBeenCalledWith(
          'Successfully cleaned up temporal activity',
          expect.any(Object)
        )

        global.setTimeout = originalSetTimeout
      })

      it('should handle workflow_id validation edge cases', async () => {
        const edgeCases = [
          'temporal/transfer/user/0xshort', // Too short hash
          'temporal/transfer/user/0xINVALIDCHARS!@#', // Invalid characters
          'temporal/transfer//0x1234567890123456789012345678901234567890123456789012345678901234', // Empty user part
          'not-temporal/transfer/user/0x1234567890123456789012345678901234567890123456789012345678901234', // Wrong prefix
        ]

        for (const invalidWorkflowId of edgeCases) {
          await activities.cleanupTemporalActivityAfterConfirmation({
            ...validParams,
            workflow_id: invalidWorkflowId,
          })

          expect(mockLog.warn).toHaveBeenCalledWith(
            'Invalid workflow_id format, skipping cleanup for security',
            { workflow_id: invalidWorkflowId }
          )
        }

        // Should have been called once for each invalid case
        expect(mockLog.warn).toHaveBeenCalledTimes(edgeCases.length)
        // Should never have attempted database operations
        expect(mockCreateSupabaseAdminClient).not.toHaveBeenCalled()
      })
    })

    describe('Performance and Resource Management Tests', () => {
      it('should properly clean up resources and not leak connections', async () => {
        // Mock successful cleanup path
        const mockSingle = jest.fn()
          .mockResolvedValueOnce({
            data: { id: 'final-activity', created_at: new Date(Date.now() - 5000).toISOString() },
            error: null,
          })
          .mockResolvedValueOnce({
            data: { id: 'temporal-activity' },
            error: null,
          })

        const mockEq2 = jest.fn(() => ({ single: mockSingle }))
        const mockEq1 = jest.fn(() => ({ eq: mockEq2 }))
        const mockSelect = jest.fn(() => ({ eq: mockEq1 }))

        const mockDelete = jest.fn().mockResolvedValue({ error: null })
        const mockEqDelete2 = jest.fn(() => mockDelete)
        const mockEqDelete1 = jest.fn(() => ({ eq: mockEqDelete2 }))
        const mockDeleteChain = jest.fn(() => ({ eq: mockEqDelete1 }))

        mockSupabaseClient.from = jest.fn((table) => {
          if (table === 'activity') {
            return { delete: mockDeleteChain }
          }
          return { select: mockSelect }
        })

        await activities.cleanupTemporalActivityAfterConfirmation(validParams)

        // Verify that supabase client was created exactly once
        expect(mockCreateSupabaseAdminClient).toHaveBeenCalledTimes(1)
        
        // Verify successful completion
        expect(mockLog.info).toHaveBeenCalledWith(
          'Successfully cleaned up temporal activity',
          expect.any(Object)
        )
      })

      it('should handle high-frequency cleanup requests efficiently', async () => {
        // Setup mocks for successful cleanup
        const mockSingle = jest.fn(() => 
          Promise.resolve({
            data: { id: 'final-activity', created_at: new Date(Date.now() - 5000).toISOString() },
            error: null,
          })
        ).mockImplementation(() =>
          Promise.resolve({
            data: null,
            error: { code: 'PGRST116' },
          })
        )

        const mockEq2 = jest.fn(() => ({ single: mockSingle }))
        const mockEq1 = jest.fn(() => ({ eq: mockEq2 }))
        const mockSelect = jest.fn(() => ({ eq: mockEq1 }))
        mockSupabaseClient.from = jest.fn(() => ({ select: mockSelect }))

        // Simulate multiple concurrent cleanup requests
        const cleanupPromises = Array.from({ length: 10 }, (_, i) => 
          activities.cleanupTemporalActivityAfterConfirmation({
            ...validParams,
            workflow_id: `temporal/transfer/user-${i}/0x${'a'.repeat(64)}`,
          })
        )

        await Promise.all(cleanupPromises)

        // All should complete successfully
        expect(mockLog.info).toHaveBeenCalledTimes(10)
        expect(mockLog.info).toHaveBeenCalledWith(
          'Temporal activity already cleaned up',
          expect.any(Object)
        )
      })
    })
  })
})
