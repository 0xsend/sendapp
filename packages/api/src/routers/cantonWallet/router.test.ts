import { describe, expect, it, jest, beforeEach, afterEach } from '@jest/globals'
import { TRPCError } from '@trpc/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { PublicClient } from 'viem'
import { cantonWalletRouter } from './router'
import type { GeneratePriorityTokenOutput } from './types'
import * as cantonConfig from '../../utils/canton-config'

/**
 * Test Suite for Canton Wallet tRPC Router
 *
 * This test suite follows strict TDD principles:
 * 1. Tests define the specification
 * 2. Each test must fail first for the right reason (RED)
 * 3. Implementation makes tests pass (GREEN)
 * 4. Refactor while keeping tests green
 */

// Mock modules
jest.mock('../../utils/canton-config')
jest.mock('../../services/canton/eligibility-service')
jest.mock('../../services/canton/api-client')

// Import mocked modules
import { CantonEligibilityService } from '../../services/canton/eligibility-service'
import { CantonAPIClient } from '../../services/canton/api-client'

describe('cantonWallet.generatePriorityToken', () => {
  let mockSupabase: jest.Mocked<SupabaseClient>
  let mockViemClient: jest.Mocked<PublicClient>
  let mockEligibilityService: jest.Mocked<CantonEligibilityService>
  let mockAPIClient: jest.Mocked<CantonAPIClient>

  // Create mock context
  const createMockContext = (userId?: string) =>
    ({
      session: userId
        ? {
            user: { id: userId },
            access_token: 'mock-token',
            refresh_token: 'mock-refresh',
            expires_in: 3600,
            token_type: 'bearer',
          }
        : null,
      supabase: mockSupabase,
      // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
      req: {} as any,
      // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
      res: {} as any,
      requestOrigin: 'http://localhost:3000',
      // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
    }) as any

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks()

    // Setup mock Supabase
    mockSupabase = {
      // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
      from: jest.fn<any>(),
    } as unknown as jest.Mocked<SupabaseClient>

    // Setup mock Viem client
    mockViemClient = {} as jest.Mocked<PublicClient>

    // Setup mock eligibility service
    mockEligibilityService = {
      // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
      checkEligibility: jest.fn<any>(),
    } as unknown as jest.Mocked<CantonEligibilityService>

    // Setup mock API client
    mockAPIClient = {
      // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
      ensurePriorityToken: jest.fn<any>(),
      // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
      ensurePriorityTokenWithStatus: jest.fn<any>(),
      // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
      buildDeepLink: jest.fn<any>(),
    } as unknown as jest.Mocked<CantonAPIClient>

    // Mock constructors to return our mocks
    ;(CantonEligibilityService as unknown as jest.Mock).mockImplementation(
      () => mockEligibilityService
    )
    ;(CantonAPIClient.getInstance as jest.Mock).mockReturnValue(mockAPIClient)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('Success Cases', () => {
    it('should generate new priority token for eligible user with main tag', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000'
      const sendtag = 'testuser'
      const token = 'priority-token-123'
      const deepLink =
        'https://cantonwallet.com/auth/create-account?priorityToken=priority-token-123'

      // Mock Canton enabled
      jest.spyOn(cantonConfig, 'isCantonIntegrationEnabled').mockReturnValue(true)

      // Mock send account lookup with tag JOIN
      // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
      mockSupabase.from = jest.fn<any>().mockImplementation((table: string) => {
        if (table === 'send_accounts') {
          return {
            // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
            select: jest.fn<any>().mockReturnValue({
              // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
              eq: jest.fn<any>().mockReturnValue({
                // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
                maybeSingle: jest.fn<any>().mockResolvedValue({
                  data: {
                    id: 1,
                    main_tag_id: 1,
                    tags: { name: sendtag },
                  },
                  error: null,
                }),
              }),
            }),
          }
        }
        if (table === 'distributions') {
          return {
            // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
            select: jest.fn<any>().mockReturnValue({
              // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
              lte: jest.fn<any>().mockReturnValue({
                // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
                gte: jest.fn<any>().mockReturnValue({
                  // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
                  order: jest.fn<any>().mockReturnValue({
                    // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
                    limit: jest.fn<any>().mockReturnValue({
                      // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
                      maybeSingle: jest.fn<any>().mockResolvedValue({
                        data: { chain_id: 8453 },
                        error: null,
                      }),
                    }),
                  }),
                }),
              }),
            }),
          }
        }
        return {
          // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
          select: jest.fn<any>().mockReturnValue({
            // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
            eq: jest.fn<any>().mockReturnValue({
              // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
              maybeSingle: jest.fn<any>().mockResolvedValue({ data: null, error: null }),
            }),
          }),
        }
      })

      // Mock eligibility check (eligible)
      mockEligibilityService.checkEligibility.mockResolvedValue({
        eligible: true,
        checkedAt: new Date().toISOString(),
        checks: {
          hasSendBalance: { eligible: true, reason: 'Meets minimum requirement' },
        },
      })

      // Mock API client
      mockAPIClient.ensurePriorityTokenWithStatus.mockResolvedValue({
        token,
        isNew: true,
      })
      mockAPIClient.buildDeepLink.mockReturnValue(deepLink)

      // Execute router procedure
      const caller = cantonWalletRouter.createCaller(createMockContext(userId))
      const result = await caller.generatePriorityToken({})

      // Verify result
      expect(result).toEqual({
        token,
        url: deepLink,
        isNew: true,
      } as GeneratePriorityTokenOutput)

      // Verify eligibility was checked
      expect(mockEligibilityService.checkEligibility).toHaveBeenCalledWith(userId)

      // Verify API client was called with correct label and metadata
      expect(mockAPIClient.ensurePriorityTokenWithStatus).toHaveBeenCalledWith(
        `sendapp:tag_${sendtag}`,
        {
          sendtag,
          userId,
          distributionId: 8453,
        }
      )
      expect(mockAPIClient.buildDeepLink).toHaveBeenCalledWith(token)
    })

    it('should return existing token when called multiple times (idempotency)', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000'
      const sendtag = 'testuser'
      const token = 'existing-token-456'
      const deepLink =
        'https://cantonwallet.com/auth/create-account?priorityToken=existing-token-456'

      // Mock Canton enabled
      jest.spyOn(cantonConfig, 'isCantonIntegrationEnabled').mockReturnValue(true)

      // Mock send account lookup with tag JOIN
      // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
      mockSupabase.from = jest.fn<any>().mockImplementation((table: string) => {
        if (table === 'send_accounts') {
          return {
            // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
            select: jest.fn<any>().mockReturnValue({
              // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
              eq: jest.fn<any>().mockReturnValue({
                // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
                maybeSingle: jest.fn<any>().mockResolvedValue({
                  data: {
                    id: 1,
                    main_tag_id: 1,
                    tags: { name: sendtag },
                  },
                  error: null,
                }),
              }),
            }),
          }
        }
        if (table === 'distributions') {
          return {
            // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
            select: jest.fn<any>().mockReturnValue({
              // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
              lte: jest.fn<any>().mockReturnValue({
                // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
                gte: jest.fn<any>().mockReturnValue({
                  // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
                  order: jest.fn<any>().mockReturnValue({
                    // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
                    limit: jest.fn<any>().mockReturnValue({
                      // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
                      maybeSingle: jest.fn<any>().mockResolvedValue({
                        data: { chain_id: 8453 },
                        error: null,
                      }),
                    }),
                  }),
                }),
              }),
            }),
          }
        }
        return {
          // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
          select: jest.fn<any>().mockReturnValue({
            // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
            eq: jest.fn<any>().mockReturnValue({
              // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
              maybeSingle: jest.fn<any>().mockResolvedValue({ data: null, error: null }),
            }),
          }),
        }
      })

      // Mock eligibility check (eligible)
      mockEligibilityService.checkEligibility.mockResolvedValue({
        eligible: true,
        checkedAt: new Date().toISOString(),
        checks: {
          hasSendBalance: { eligible: true, reason: 'Meets minimum requirement' },
        },
      })

      // Mock API client - ensurePriorityTokenWithStatus returns existing token
      mockAPIClient.ensurePriorityTokenWithStatus.mockResolvedValue({
        token,
        isNew: false,
      })
      mockAPIClient.buildDeepLink.mockReturnValue(deepLink)

      // Execute router procedure
      const caller = cantonWalletRouter.createCaller(createMockContext(userId))
      const result = await caller.generatePriorityToken({})

      // Verify result contains existing token
      expect(result.token).toBe(token)
      expect(result.url).toBe(deepLink)

      // Verify isNew is false since token already existed
      expect(result.isNew).toBe(false)
    })
  })

  describe('Error Cases - Canton Integration', () => {
    it('should throw PRECONDITION_FAILED when Canton integration is disabled', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000'

      // Mock Canton disabled
      jest.spyOn(cantonConfig, 'isCantonIntegrationEnabled').mockReturnValue(false)

      // Execute router procedure
      const caller = cantonWalletRouter.createCaller(createMockContext(userId))

      // Verify error
      await expect(caller.generatePriorityToken({})).rejects.toThrow(TRPCError)
      await expect(caller.generatePriorityToken({})).rejects.toMatchObject({
        code: 'PRECONDITION_FAILED',
        message: expect.stringContaining('Canton integration is not enabled'),
      })

      // Verify eligibility was NOT checked
      expect(mockEligibilityService.checkEligibility).not.toHaveBeenCalled()
    })
  })

  describe('Error Cases - Send Account', () => {
    it('should throw PRECONDITION_FAILED when user has no send account', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000'

      // Mock Canton enabled
      jest.spyOn(cantonConfig, 'isCantonIntegrationEnabled').mockReturnValue(true)

      // Mock send account NOT found
      // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
      mockSupabase.from = jest.fn<any>().mockImplementation((table: string) => {
        if (table === 'send_accounts') {
          return {
            // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
            select: jest.fn<any>().mockReturnValue({
              // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
              eq: jest.fn<any>().mockReturnValue({
                // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
                maybeSingle: jest.fn<any>().mockResolvedValue({
                  data: null,
                  error: null,
                }),
              }),
            }),
          }
        }
        return {
          // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
          select: jest.fn<any>().mockReturnValue({
            // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
            eq: jest.fn<any>().mockReturnValue({
              // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
              maybeSingle: jest.fn<any>().mockResolvedValue({ data: null, error: null }),
            }),
          }),
        }
      })

      // Execute router procedure
      const caller = cantonWalletRouter.createCaller(createMockContext(userId))

      // Verify error
      await expect(caller.generatePriorityToken({})).rejects.toThrow(TRPCError)
      await expect(caller.generatePriorityToken({})).rejects.toMatchObject({
        code: 'PRECONDITION_FAILED',
        message: expect.stringContaining('No send account found'),
      })
    })

    it('should throw INTERNAL_SERVER_ERROR when send account query fails', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000'

      // Mock Canton enabled
      jest.spyOn(cantonConfig, 'isCantonIntegrationEnabled').mockReturnValue(true)

      // Mock send account query error
      // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
      mockSupabase.from = jest.fn<any>().mockImplementation((table: string) => {
        if (table === 'send_accounts') {
          return {
            // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
            select: jest.fn<any>().mockReturnValue({
              // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
              eq: jest.fn<any>().mockReturnValue({
                // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
                maybeSingle: jest.fn<any>().mockResolvedValue({
                  data: null,
                  error: { message: 'Database error' },
                }),
              }),
            }),
          }
        }
        return {
          // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
          select: jest.fn<any>().mockReturnValue({
            // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
            eq: jest.fn<any>().mockReturnValue({
              // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
              maybeSingle: jest.fn<any>().mockResolvedValue({ data: null, error: null }),
            }),
          }),
        }
      })

      // Execute router procedure
      const caller = cantonWalletRouter.createCaller(createMockContext(userId))

      // Verify error
      await expect(caller.generatePriorityToken({})).rejects.toThrow(TRPCError)
      await expect(caller.generatePriorityToken({})).rejects.toMatchObject({
        code: 'INTERNAL_SERVER_ERROR',
      })
    })
  })

  describe('Error Cases - Main Tag', () => {
    it('should throw PRECONDITION_FAILED when user has no main tag', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000'

      // Mock Canton enabled
      jest.spyOn(cantonConfig, 'isCantonIntegrationEnabled').mockReturnValue(true)

      // Mock send account found but no main tag
      // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
      mockSupabase.from = jest.fn<any>().mockImplementation((table: string) => {
        if (table === 'send_accounts') {
          return {
            // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
            select: jest.fn<any>().mockReturnValue({
              // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
              eq: jest.fn<any>().mockReturnValue({
                // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
                maybeSingle: jest.fn<any>().mockResolvedValue({
                  data: { id: 1 },
                  error: null,
                }),
              }),
            }),
          }
        }
        if (table === 'tags') {
          return {
            // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
            select: jest.fn<any>().mockReturnValue({
              // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
              eq: jest.fn<any>().mockReturnValue({
                // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
                eq: jest.fn<any>().mockReturnValue({
                  // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
                  maybeSingle: jest.fn<any>().mockResolvedValue({
                    data: null,
                    error: null,
                  }),
                }),
              }),
            }),
          }
        }
        return {
          // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
          select: jest.fn<any>().mockReturnValue({
            // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
            eq: jest.fn<any>().mockReturnValue({
              // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
              maybeSingle: jest.fn<any>().mockResolvedValue({ data: null, error: null }),
            }),
          }),
        }
      })

      // Execute router procedure
      const caller = cantonWalletRouter.createCaller(createMockContext(userId))

      // Verify error
      await expect(caller.generatePriorityToken({})).rejects.toThrow(TRPCError)
      await expect(caller.generatePriorityToken({})).rejects.toMatchObject({
        code: 'PRECONDITION_FAILED',
        message: expect.stringContaining('No main SendTag found'),
      })
    })
  })

  describe('Error Cases - Eligibility', () => {
    it('should throw FORBIDDEN when user is not eligible', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000'
      const sendtag = 'testuser'

      // Mock Canton enabled
      jest.spyOn(cantonConfig, 'isCantonIntegrationEnabled').mockReturnValue(true)

      // Mock send account with tag JOIN and distributions
      // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
      mockSupabase.from = jest.fn<any>().mockImplementation((table: string) => {
        if (table === 'send_accounts') {
          return {
            // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
            select: jest.fn<any>().mockReturnValue({
              // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
              eq: jest.fn<any>().mockReturnValue({
                // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
                maybeSingle: jest.fn<any>().mockResolvedValue({
                  data: {
                    id: 1,
                    main_tag_id: 1,
                    tags: { name: sendtag },
                  },
                  error: null,
                }),
              }),
            }),
          }
        }
        if (table === 'distributions') {
          return {
            // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
            select: jest.fn<any>().mockReturnValue({
              // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
              lte: jest.fn<any>().mockReturnValue({
                // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
                gte: jest.fn<any>().mockReturnValue({
                  // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
                  order: jest.fn<any>().mockReturnValue({
                    // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
                    limit: jest.fn<any>().mockReturnValue({
                      // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
                      maybeSingle: jest.fn<any>().mockResolvedValue({
                        data: { chain_id: 8453 },
                        error: null,
                      }),
                    }),
                  }),
                }),
              }),
            }),
          }
        }
        return {
          // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
          select: jest.fn<any>().mockReturnValue({
            // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
            eq: jest.fn<any>().mockReturnValue({
              // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
              maybeSingle: jest.fn<any>().mockResolvedValue({ data: null, error: null }),
            }),
          }),
        }
      })

      // Mock eligibility check (NOT eligible)
      mockEligibilityService.checkEligibility.mockResolvedValue({
        eligible: false,
        checkedAt: new Date().toISOString(),
        checks: {
          hasSendBalance: { eligible: false, reason: 'Below minimum requirement' },
        },
      })

      // Execute router procedure
      const caller = cantonWalletRouter.createCaller(createMockContext(userId))

      // Verify error
      await expect(caller.generatePriorityToken({})).rejects.toThrow(TRPCError)
      await expect(caller.generatePriorityToken({})).rejects.toMatchObject({
        code: 'FORBIDDEN',
        message: expect.stringContaining('not eligible'),
      })

      // Verify eligibility was checked
      expect(mockEligibilityService.checkEligibility).toHaveBeenCalledWith(userId)

      // Verify API client was NOT called
      expect(mockAPIClient.ensurePriorityTokenWithStatus).not.toHaveBeenCalled()
    })
  })

  describe('Error Cases - Canton API', () => {
    it('should throw INTERNAL_SERVER_ERROR when Canton API fails', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000'
      const sendtag = 'testuser'

      // Mock Canton enabled
      jest.spyOn(cantonConfig, 'isCantonIntegrationEnabled').mockReturnValue(true)

      // Mock send account with tag JOIN and distributions
      // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
      mockSupabase.from = jest.fn<any>().mockImplementation((table: string) => {
        if (table === 'send_accounts') {
          return {
            // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
            select: jest.fn<any>().mockReturnValue({
              // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
              eq: jest.fn<any>().mockReturnValue({
                // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
                maybeSingle: jest.fn<any>().mockResolvedValue({
                  data: {
                    id: 1,
                    main_tag_id: 1,
                    tags: { name: sendtag },
                  },
                  error: null,
                }),
              }),
            }),
          }
        }
        if (table === 'distributions') {
          return {
            // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
            select: jest.fn<any>().mockReturnValue({
              // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
              lte: jest.fn<any>().mockReturnValue({
                // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
                gte: jest.fn<any>().mockReturnValue({
                  // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
                  order: jest.fn<any>().mockReturnValue({
                    // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
                    limit: jest.fn<any>().mockReturnValue({
                      // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
                      maybeSingle: jest.fn<any>().mockResolvedValue({
                        data: { chain_id: 8453 },
                        error: null,
                      }),
                    }),
                  }),
                }),
              }),
            }),
          }
        }
        return {
          // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
          select: jest.fn<any>().mockReturnValue({
            // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
            eq: jest.fn<any>().mockReturnValue({
              // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
              maybeSingle: jest.fn<any>().mockResolvedValue({ data: null, error: null }),
            }),
          }),
        }
      })

      // Mock eligibility check (eligible)
      mockEligibilityService.checkEligibility.mockResolvedValue({
        eligible: true,
        checkedAt: new Date().toISOString(),
        checks: {
          hasSendBalance: { eligible: true, reason: 'Meets minimum requirement' },
        },
      })

      // Mock API client error
      mockAPIClient.ensurePriorityTokenWithStatus.mockRejectedValue(new Error('Canton API error'))

      // Execute router procedure
      const caller = cantonWalletRouter.createCaller(createMockContext(userId))

      // Verify error
      await expect(caller.generatePriorityToken({})).rejects.toThrow(TRPCError)
      await expect(caller.generatePriorityToken({})).rejects.toMatchObject({
        code: 'INTERNAL_SERVER_ERROR',
        message: expect.stringContaining('Failed to generate priority token'),
      })
    })
  })

  describe('Error Cases - Generic', () => {
    it('should throw INTERNAL_SERVER_ERROR for unexpected errors', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000'

      // Mock Canton enabled
      jest.spyOn(cantonConfig, 'isCantonIntegrationEnabled').mockReturnValue(true)

      // Mock unexpected error in Supabase
      // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
      mockSupabase.from = jest.fn<any>().mockImplementation(() => {
        throw new Error('Unexpected database error')
      })

      // Execute router procedure
      const caller = cantonWalletRouter.createCaller(createMockContext(userId))

      // Verify error
      await expect(caller.generatePriorityToken({})).rejects.toThrow(TRPCError)
      await expect(caller.generatePriorityToken({})).rejects.toMatchObject({
        code: 'INTERNAL_SERVER_ERROR',
      })
    })
  })
})
