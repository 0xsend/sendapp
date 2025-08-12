import { describe, expect, it, beforeEach, afterEach, jest } from '@jest/globals'
import { TRPCError } from '@trpc/server'
import type { UserOperation } from 'permissionless'
import { createCallerFactory } from '@trpc/server'

// Mock dependencies
jest.mock('app/utils/supabase/admin')
jest.mock('@my/workflows/temporal')
jest.mock('@my/wagmi', () => ({
  entryPointAddress: {
    8453: '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789',
  },
  baseMainnetClient: {
    chain: { id: 8453 },
    call: jest.fn(),
  },
}))

// Mock temporal client functions
const mockStartWorkflow = jest.fn()
const mockGetTemporalClient = jest.fn()

jest.mock('@my/workflows/temporal', () => ({
  getTemporalClient: mockGetTemporalClient,
  startWorkflow: mockStartWorkflow,
}))

// Mock validation
jest.mock('app/utils/zod', () => ({
  formFields: {
    note: {
      safeParse: jest.fn(() => ({ error: null })),
    },
  },
}))

// Mock crypto functions
jest.mock('permissionless', () => ({
  getUserOperationHash: jest.fn(() => '0xtest-user-op-hash'),
}))

describe('Temporal Router - Race Condition Fix Tests', () => {
  let temporalRouter: any
  let mockSession: any

  beforeEach(() => {
    jest.clearAllMocks()
    
    mockSession = {
      user: {
        id: 'test-user-123',
      },
    }

    // Setup default mocks
    mockGetTemporalClient.mockResolvedValue({})
    mockStartWorkflow.mockResolvedValue({
      workflowId: 'temporal/transfer/test-user-123/0xtest-user-op-hash'
    })

    // Mock baseMainnetClient.call to succeed
    const { baseMainnetClient } = require('@my/wagmi')
    baseMainnetClient.call.mockResolvedValue({ success: true })

    // Import and setup router after mocks are in place
    const { temporalRouter: router } = require('./temporal')
    temporalRouter = router
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('transfer mutation - Bug 3: Immediate API Response', () => {
    const validUserOp: UserOperation<'v0.7'> = {
      sender: '0x1234567890ABCDEF1234567890ABCDEF12345678',
      nonce: '0x0',
      factory: '0x1234567890ABCDEF1234567890ABCDEF12345678',
      factoryData: '0x',
      callData: '0xb61d27f60000000000000000000000001234567890abcdef1234567890abcdef12345678',
      callGasLimit: '0x5208',
      verificationGasLimit: '0x5208', 
      preVerificationGas: '0x5208',
      maxFeePerGas: '0x3b9aca00',
      maxPriorityFeePerGas: '0x3b9aca00',
      paymaster: '0x1234567890ABCDEF1234567890ABCDEF12345678',
      paymasterVerificationGasLimit: '0x5208',
      paymasterPostOpGasLimit: '0x5208',
      paymasterData: '0x',
      signature: '0x123456789abcdef',
    }

    it('should return immediately after starting workflow without waiting for activity creation', async () => {
      const startTime = Date.now()
      
      const caller = createCallerFactory(temporalRouter)({
        session: mockSession,
      })

      const result = await caller.transfer({
        userOp: validUserOp,
        note: 'test note',
      })

      const endTime = Date.now()
      const executionTime = endTime - startTime

      // Verify response is immediate (less than 1 second)
      expect(executionTime).toBeLessThan(1000)
      
      // Verify correct workflow ID is returned
      expect(result).toEqual({
        workflowId: 'temporal/transfer/test-user-123/0xtest-user-op-hash'
      })

      // Verify workflow was started with correct parameters
      expect(mockStartWorkflow).toHaveBeenCalledWith({
        client: {},
        workflow: 'transfer',
        ids: ['test-user-123', '0xtest-user-op-hash'],
        args: [validUserOp, 'test note'],
      })
    })

    it('should not contain any retry logic or activity waiting', async () => {
      // This test verifies that the API doesn't wait for activity creation
      // by checking that no additional async operations occur after workflow start
      
      let asyncOperationCount = 0
      const originalSetTimeout = global.setTimeout
      const originalPromiseAny = Promise.any
      const originalPromiseAll = Promise.all

      global.setTimeout = jest.fn((...args) => {
        asyncOperationCount++
        return originalSetTimeout(...args)
      })

      Promise.any = jest.fn((...args) => {
        asyncOperationCount++
        return originalPromiseAny(...args)
      }) as any

      Promise.all = jest.fn((...args) => {
        asyncOperationCount++
        return originalPromiseAll(...args)
      }) as any

      const caller = createCallerFactory(temporalRouter)({
        session: mockSession,
      })

      await caller.transfer({
        userOp: validUserOp,
        note: 'test note',
      })

      // Should not have any retry mechanisms or promise orchestration
      expect(asyncOperationCount).toBe(0)
      expect(global.setTimeout).not.toHaveBeenCalled()

      // Restore original functions
      global.setTimeout = originalSetTimeout
      Promise.any = originalPromiseAny
      Promise.all = originalPromiseAll
    })

    it('should handle workflow start errors properly without retry loops', async () => {
      const workflowError = new Error('Workflow failed to start')
      mockStartWorkflow.mockRejectedValue(workflowError)

      const caller = createCallerFactory(temporalRouter)({
        session: mockSession,
      })

      await expect(
        caller.transfer({
          userOp: validUserOp,
          note: 'test note',
        })
      ).rejects.toThrow(TRPCError)

      // Should not have attempted any retries
      expect(mockStartWorkflow).toHaveBeenCalledTimes(1)
    })

    it('should handle "Workflow already exists" error correctly', async () => {
      const workflowExistsError = new Error('Workflow already exists')
      mockStartWorkflow.mockRejectedValue(workflowExistsError)

      const caller = createCallerFactory(temporalRouter)({
        session: mockSession,
      })

      await expect(
        caller.transfer({
          userOp: validUserOp,
          note: 'test note',
        })
      ).rejects.toMatchObject({
        code: 'PRECONDITION_FAILED',
        message: 'Workflow already exists',
      })
    })

    it('should validate note parameter properly', async () => {
      const { formFields } = require('app/utils/zod')
      const mockSafeParse = formFields.note.safeParse as jest.Mock

      // Test with valid note
      mockSafeParse.mockReturnValue({ error: null })
      
      const caller = createCallerFactory(temporalRouter)({
        session: mockSession,
      })

      await caller.transfer({
        userOp: validUserOp,
        note: encodeURIComponent('valid note'),
      })

      expect(mockSafeParse).toHaveBeenCalledWith('valid note')

      // Test with invalid note
      mockSafeParse.mockReturnValue({ 
        error: { message: 'Note too long' }
      })

      await expect(
        caller.transfer({
          userOp: validUserOp,
          note: encodeURIComponent('invalid note'),
        })
      ).rejects.toThrow('Note failed to match validation constraints')
    })

    it('should validate user operation before starting workflow', async () => {
      const { baseMainnetClient } = require('@my/wagmi')
      const callError = new Error('Invalid user operation')
      baseMainnetClient.call.mockRejectedValue(callError)

      const caller = createCallerFactory(temporalRouter)({
        session: mockSession,
      })

      await expect(
        caller.transfer({
          userOp: validUserOp,
          note: 'test note',
        })
      ).rejects.toMatchObject({
        code: 'PRECONDITION_FAILED',
        message: callError.message,
      })

      // Should not have started workflow due to validation failure
      expect(mockStartWorkflow).not.toHaveBeenCalled()
    })

    it('should handle temporal client connection errors', async () => {
      const clientError = new Error('Failed to connect to temporal')
      mockGetTemporalClient.mockRejectedValue(clientError)

      const caller = createCallerFactory(temporalRouter)({
        session: mockSession,
      })

      await expect(
        caller.transfer({
          userOp: validUserOp,
          note: 'test note',
        })
      ).rejects.toMatchObject({
        code: 'INTERNAL_SERVER_ERROR',
        message: clientError.message,
      })
    })

    it('should generate correct workflow IDs consistently', async () => {
      const { getUserOperationHash } = require('permissionless')
      
      // Mock consistent hash generation
      getUserOperationHash.mockReturnValue('0xconsistent-hash')
      mockStartWorkflow.mockResolvedValue({
        workflowId: 'temporal/transfer/test-user-123/0xconsistent-hash'
      })

      const caller = createCallerFactory(temporalRouter)({
        session: mockSession,
      })

      const result = await caller.transfer({
        userOp: validUserOp,
        note: 'test note',
      })

      expect(result.workflowId).toBe('temporal/transfer/test-user-123/0xconsistent-hash')
      expect(getUserOperationHash).toHaveBeenCalledWith({
        userOperation: validUserOp,
        entryPoint: '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789',
        chainId: 8453,
      })
    })
  })

  describe('Performance and Reliability Tests', () => {
    it('should maintain consistent response times under load', async () => {
      const caller = createCallerFactory(temporalRouter)({
        session: mockSession,
      })

      const concurrentRequests = 10
      const startTime = Date.now()

      // Mock unique workflow IDs for each request
      let requestCount = 0
      mockStartWorkflow.mockImplementation(() => {
        requestCount++
        return Promise.resolve({
          workflowId: `temporal/transfer/test-user-123/0xhash-${requestCount}`
        })
      })

      const requests = Array.from({ length: concurrentRequests }, (_, i) => 
        caller.transfer({
          userOp: {
            ...validUserOp,
            nonce: `0x${i}`, // Make each request unique
          },
          note: `test note ${i}`,
        })
      )

      const results = await Promise.all(requests)
      const endTime = Date.now()
      const totalTime = endTime - startTime

      // All requests should complete quickly (less than 5 seconds total)
      expect(totalTime).toBeLessThan(5000)
      
      // All requests should succeed
      expect(results).toHaveLength(concurrentRequests)
      results.forEach((result, i) => {
        expect(result.workflowId).toBe(`temporal/transfer/test-user-123/0xhash-${i + 1}`)
      })

      // Should have started exactly the expected number of workflows
      expect(mockStartWorkflow).toHaveBeenCalledTimes(concurrentRequests)
    })

    it('should not have memory leaks or hanging promises', async () => {
      const caller = createCallerFactory(temporalRouter)({
        session: mockSession,
      })

      // Track promise creation
      let promiseCount = 0
      const originalPromise = Promise
      
      // Override Promise constructor to count instances
      global.Promise = class extends originalPromise<any> {
        constructor(executor: any) {
          super(executor)
          promiseCount++
        }
      } as any

      await caller.transfer({
        userOp: validUserOp,
        note: 'test note',
      })

      // Restore original Promise
      global.Promise = originalPromise

      // Should have minimal promise creation (basic operation only)
      expect(promiseCount).toBeLessThan(5)
    })

    it('should handle rapid successive calls without conflicts', async () => {
      const caller = createCallerFactory(temporalRouter)({
        session: mockSession,
      })

      let workflowIdCounter = 0
      mockStartWorkflow.mockImplementation(() => {
        workflowIdCounter++
        return Promise.resolve({
          workflowId: `temporal/transfer/test-user-123/0xsequential-${workflowIdCounter}`
        })
      })

      // Make rapid successive calls
      const results = []
      for (let i = 0; i < 5; i++) {
        const result = await caller.transfer({
          userOp: {
            ...validUserOp,
            nonce: `0x${i}`,
          },
          note: `rapid test ${i}`,
        })
        results.push(result)
      }

      // Each should get a unique workflow ID
      const workflowIds = results.map(r => r.workflowId)
      const uniqueIds = new Set(workflowIds)
      expect(uniqueIds.size).toBe(5)

      // Should be in sequence
      workflowIds.forEach((id, i) => {
        expect(id).toBe(`temporal/transfer/test-user-123/0xsequential-${i + 1}`)
      })
    })
  })

  describe('Error Handling and Edge Cases', () => {
    it('should handle missing session gracefully', async () => {
      const caller = createCallerFactory(temporalRouter)({
        session: null,
      })

      // This should fail at the authentication level, not during race condition handling
      await expect(
        caller.transfer({
          userOp: validUserOp,
          note: 'test note',
        })
      ).rejects.toThrow()
    })

    it('should handle malformed user operations', async () => {
      const invalidUserOp = {
        ...validUserOp,
        sender: 'invalid-address', // Invalid format
      }

      const caller = createCallerFactory(temporalRouter)({
        session: mockSession,
      })

      // Should fail during validation, before workflow starts
      await expect(
        caller.transfer({
          userOp: invalidUserOp as any,
          note: 'test note',
        })
      ).rejects.toThrow()

      // Should not have attempted to start workflow
      expect(mockStartWorkflow).not.toHaveBeenCalled()
    })

    it('should handle network timeouts gracefully', async () => {
      const timeoutError = new Error('Network timeout')
      timeoutError.name = 'TimeoutError'
      mockGetTemporalClient.mockRejectedValue(timeoutError)

      const caller = createCallerFactory(temporalRouter)({
        session: mockSession,
      })

      await expect(
        caller.transfer({
          userOp: validUserOp,
          note: 'test note',
        })
      ).rejects.toMatchObject({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Network timeout',
      })
    })

    it('should properly encode and decode note parameters', async () => {
      const specialNote = 'Special chars: !@#$%^&*()_+-=[]{}|;:,.<>?'
      const encodedNote = encodeURIComponent(specialNote)

      const { formFields } = require('app/utils/zod')
      formFields.note.safeParse.mockReturnValue({ error: null })

      const caller = createCallerFactory(temporalRouter)({
        session: mockSession,
      })

      await caller.transfer({
        userOp: validUserOp,
        note: encodedNote,
      })

      // Should have decoded the note properly for validation
      expect(formFields.note.safeParse).toHaveBeenCalledWith(specialNote)
      
      // Should have passed the original encoded note to workflow
      expect(mockStartWorkflow).toHaveBeenCalledWith(
        expect.objectContaining({
          args: [validUserOp, encodedNote],
        })
      )
    })
  })

  describe('Integration with Existing Race Condition Fixes', () => {
    it('should work correctly with fallback note lookup mechanism', async () => {
      // This test ensures the API change doesn't break the note lookup fixes
      const caller = createCallerFactory(temporalRouter)({
        session: mockSession,
      })

      const noteText = 'Integration test note'
      const result = await caller.transfer({
        userOp: validUserOp,
        note: encodeURIComponent(noteText),
      })

      // Workflow should be started with the note that will be used by fallback lookup
      expect(mockStartWorkflow).toHaveBeenCalledWith({
        client: {},
        workflow: 'transfer',
        ids: ['test-user-123', '0xtest-user-op-hash'],
        args: [validUserOp, encodeURIComponent(noteText)],
      })

      expect(result.workflowId).toContain('0xtest-user-op-hash')
    })

    it('should generate workflow IDs compatible with cleanup mechanisms', async () => {
      const caller = createCallerFactory(temporalRouter)({
        session: mockSession,
      })

      const result = await caller.transfer({
        userOp: validUserOp,
      })

      // Workflow ID should follow the expected pattern for cleanup
      expect(result.workflowId).toMatch(/^temporal\/transfer\/[^\/]+\/0x[a-fA-F0-9]{64}$/)
    })

    it('should ensure workflow parameters support duplicate prevention', async () => {
      const caller = createCallerFactory(temporalRouter)({
        session: mockSession,
      })

      await caller.transfer({
        userOp: validUserOp,
        note: 'duplicate prevention test',
      })

      // The workflow should be started with IDs that enable proper duplicate detection
      expect(mockStartWorkflow).toHaveBeenCalledWith(
        expect.objectContaining({
          ids: expect.arrayContaining([
            'test-user-123',
            '0xtest-user-op-hash'
          ]),
        })
      )
    })
  })

  describe('Backward Compatibility', () => {
    it('should maintain the same API interface', async () => {
      const caller = createCallerFactory(temporalRouter)({
        session: mockSession,
      })

      // Test with note
      const resultWithNote = await caller.transfer({
        userOp: validUserOp,
        note: 'test note',
      })

      expect(resultWithNote).toEqual({
        workflowId: expect.stringMatching(/^temporal\/transfer\//)
      })

      // Test without note
      const resultWithoutNote = await caller.transfer({
        userOp: validUserOp,
      })

      expect(resultWithoutNote).toEqual({
        workflowId: expect.stringMatching(/^temporal\/transfer\//)
      })
    })

    it('should handle optional note parameter correctly', async () => {
      const caller = createCallerFactory(temporalRouter)({
        session: mockSession,
      })

      // Test with undefined note
      await caller.transfer({
        userOp: validUserOp,
        note: undefined,
      })

      expect(mockStartWorkflow).toHaveBeenCalledWith(
        expect.objectContaining({
          args: [validUserOp, undefined],
        })
      )
    })
  })
})
