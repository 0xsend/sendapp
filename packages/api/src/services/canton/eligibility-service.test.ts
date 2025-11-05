import { describe, expect, it, jest, beforeEach } from '@jest/globals'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { PublicClient } from 'viem'
import { CantonEligibilityService } from './eligibility-service'
import { CANTON_SNAPSHOT_CONFIG } from './types'

/**
 * Helper to create mock Supabase query chain
 */
// biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
function createMockSupabaseFrom(mockData: Record<string, any>) {
  // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
  return jest.fn<any>((table: string) => {
    const tableData = mockData[table]
    if (!tableData) {
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
    }
    return tableData
  })
}

describe('CantonEligibilityService', () => {
  let mockSupabase: jest.Mocked<SupabaseClient>
  let mockViemClient: jest.Mocked<PublicClient>
  let service: CantonEligibilityService

  beforeEach(() => {
    mockSupabase = {
      // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
      from: jest.fn<any>(),
    } as unknown as jest.Mocked<SupabaseClient>

    mockViemClient = {
      // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
      readContract: jest.fn<any>(),
    } as unknown as jest.Mocked<PublicClient>

    service = new CantonEligibilityService(mockSupabase, mockViemClient)
  })

  describe('Constructor', () => {
    it('should create instance with valid dependencies', () => {
      expect(service).toBeInstanceOf(CantonEligibilityService)
    })

    it('should throw error if supabase client is null', () => {
      expect(
        () => new CantonEligibilityService(null as unknown as SupabaseClient, mockViemClient)
      ).toThrow('Supabase client is required')
    })

    it('should throw error if viem client is null', () => {
      expect(
        () => new CantonEligibilityService(mockSupabase, null as unknown as PublicClient)
      ).toThrow('Viem client is required')
    })
  })

  describe('checkEligibility - All Checks Pass', () => {
    it('should return eligible when user meets all criteria', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000'

      const mockData = {
        distributions: {
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
                      data: {
                        id: 1,
                        number: 10,
                        name: 'Test Distribution',
                        snapshot_block_num: '22524265',
                        chain_id: 8453,
                        token_addr: '\\x3f14920c99BEB920Afa163031c4e47a3e03B3e4A' as `\\x${string}`,
                      },
                      error: null,
                    }),
                  }),
                }),
              }),
            }),
          }),
        },
        distribution_verifications: {
          // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
          select: jest.fn<any>().mockReturnValue({
            // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
            eq: jest.fn<any>().mockReturnValue({
              // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
              eq: jest.fn<any>().mockReturnValue({
                // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
                eq: jest.fn<any>().mockReturnValue({
                  // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
                  gt: jest.fn<any>().mockReturnValue({
                    // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
                    maybeSingle: jest.fn<any>().mockResolvedValue({
                      data: { weight: '1' },
                      error: null,
                    }),
                  }),
                }),
              }),
            }),
          }),
        },
        send_accounts: {
          // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
          select: jest.fn<any>().mockReturnValue({
            // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
            eq: jest.fn<any>().mockReturnValue({
              // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
              maybeSingle: jest.fn<any>().mockResolvedValue({
                data: { address: '0x1234567890123456789012345678901234567890' },
                error: null,
              }),
            }),
          }),
        },
        send_earn_balances_timeline: {
          // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
          select: jest.fn<any>().mockReturnValue({
            // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
            eq: jest.fn<any>().mockReturnValue({
              // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
              lte: jest.fn<any>().mockReturnValue({
                // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
                order: jest.fn<any>().mockResolvedValue({
                  data: [{ log_addr: '\\xVAULT1', assets: '10000000' }], // $10 USDC (above dev threshold of $5)
                  error: null,
                }),
              }),
            }),
          }),
        },
      }

      mockSupabase.from = createMockSupabaseFrom(mockData)
      mockViemClient.readContract = // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
        jest.fn<any>().mockResolvedValue(200n * 10n ** 18n) // 200 SEND (above dev threshold of 100)

      const result = await service.checkEligibility(userId)

      expect(result.eligible).toBe(true)
      expect(result.checks.hasTag.eligible).toBe(true)
      expect(result.checks.hasEarnBalance.eligible).toBe(true)
      expect(result.checks.hasSendBalance.eligible).toBe(true)
      expect(result.distribution).toBeDefined()
      expect(result.distribution?.id).toBe(1)
    })
  })

  describe('checkEligibility - Individual Check Failures', () => {
    it('should return ineligible when user has no SendTag', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000'

      const mockData = {
        distributions: {
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
                      data: {
                        id: 1,
                        number: 10,
                        name: 'Test Distribution',
                        snapshot_block_num: '22524265',
                        chain_id: 8453,
                        token_addr: '\\x3f14920c99BEB920Afa163031c4e47a3e03B3e4A' as `\\x${string}`,
                      },
                      error: null,
                    }),
                  }),
                }),
              }),
            }),
          }),
        },
        distribution_verifications: {
          // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
          select: jest.fn<any>().mockReturnValue({
            // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
            eq: jest.fn<any>().mockReturnValue({
              // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
              eq: jest.fn<any>().mockReturnValue({
                // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
                eq: jest.fn<any>().mockReturnValue({
                  // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
                  gt: jest.fn<any>().mockReturnValue({
                    // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
                    maybeSingle: jest.fn<any>().mockResolvedValue({
                      data: null, // No tag
                      error: null,
                    }),
                  }),
                }),
              }),
            }),
          }),
        },
        send_accounts: {
          // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
          select: jest.fn<any>().mockReturnValue({
            // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
            eq: jest.fn<any>().mockReturnValue({
              // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
              maybeSingle: jest.fn<any>().mockResolvedValue({
                data: { address: '0x1234567890123456789012345678901234567890' },
                error: null,
              }),
            }),
          }),
        },
        send_earn_balances_timeline: {
          // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
          select: jest.fn<any>().mockReturnValue({
            // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
            eq: jest.fn<any>().mockReturnValue({
              // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
              lte: jest.fn<any>().mockReturnValue({
                // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
                order: jest.fn<any>().mockResolvedValue({
                  data: [{ log_addr: '\\xVAULT1', assets: '10000000' }], // $10 USDC (above dev threshold of $5)
                  error: null,
                }),
              }),
            }),
          }),
        },
      }

      mockSupabase.from = createMockSupabaseFrom(mockData)
      mockViemClient.readContract = // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
        jest.fn<any>().mockResolvedValue(200n * 10n ** 18n) // 200 SEND (above dev threshold of 100)

      const result = await service.checkEligibility(userId)

      expect(result.eligible).toBe(false)
      expect(result.checks.hasTag.eligible).toBe(false)
      expect(result.checks.hasTag.reason).toContain('No SendTag')
    })

    it('should return ineligible when Send Earn balance is below threshold', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000'

      const mockData = {
        distributions: {
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
                      data: {
                        id: 1,
                        number: 10,
                        name: 'Test Distribution',
                        snapshot_block_num: '22524265',
                        chain_id: 8453,
                        token_addr: '\\x3f14920c99BEB920Afa163031c4e47a3e03B3e4A' as `\\x${string}`,
                      },
                      error: null,
                    }),
                  }),
                }),
              }),
            }),
          }),
        },
        distribution_verifications: {
          // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
          select: jest.fn<any>().mockReturnValue({
            // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
            eq: jest.fn<any>().mockReturnValue({
              // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
              eq: jest.fn<any>().mockReturnValue({
                // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
                eq: jest.fn<any>().mockReturnValue({
                  // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
                  gt: jest.fn<any>().mockReturnValue({
                    // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
                    maybeSingle: jest.fn<any>().mockResolvedValue({
                      data: { weight: '1' },
                      error: null,
                    }),
                  }),
                }),
              }),
            }),
          }),
        },
        send_accounts: {
          // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
          select: jest.fn<any>().mockReturnValue({
            // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
            eq: jest.fn<any>().mockReturnValue({
              // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
              maybeSingle: jest.fn<any>().mockResolvedValue({
                data: { address: '0x1234567890123456789012345678901234567890' },
                error: null,
              }),
            }),
          }),
        },
        send_earn_balances_timeline: {
          // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
          select: jest.fn<any>().mockReturnValue({
            // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
            eq: jest.fn<any>().mockReturnValue({
              // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
              lte: jest.fn<any>().mockReturnValue({
                // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
                order: jest.fn<any>().mockResolvedValue({
                  data: [{ log_addr: '\\xVAULT1', assets: '1000000' }], // Only $1 USDC (below $5 dev threshold)
                  error: null,
                }),
              }),
            }),
          }),
        },
      }

      mockSupabase.from = createMockSupabaseFrom(mockData)
      mockViemClient.readContract = // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
        jest.fn<any>().mockResolvedValue(200n * 10n ** 18n) // 200 SEND (above dev threshold)

      const result = await service.checkEligibility(userId)

      expect(result.eligible).toBe(false)
      expect(result.checks.hasEarnBalance.eligible).toBe(false)
      expect(result.checks.hasEarnBalance.reason).toContain('below minimum')
    })

    it('should return ineligible when SEND token balance is below threshold', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000'

      const mockData = {
        distributions: {
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
                      data: {
                        id: 1,
                        number: 10,
                        name: 'Test Distribution',
                        snapshot_block_num: '22524265',
                        chain_id: 8453,
                        token_addr: '\\x3f14920c99BEB920Afa163031c4e47a3e03B3e4A' as `\\x${string}`,
                      },
                      error: null,
                    }),
                  }),
                }),
              }),
            }),
          }),
        },
        distribution_verifications: {
          // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
          select: jest.fn<any>().mockReturnValue({
            // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
            eq: jest.fn<any>().mockReturnValue({
              // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
              eq: jest.fn<any>().mockReturnValue({
                // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
                eq: jest.fn<any>().mockReturnValue({
                  // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
                  gt: jest.fn<any>().mockReturnValue({
                    // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
                    maybeSingle: jest.fn<any>().mockResolvedValue({
                      data: { weight: '1' },
                      error: null,
                    }),
                  }),
                }),
              }),
            }),
          }),
        },
        send_accounts: {
          // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
          select: jest.fn<any>().mockReturnValue({
            // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
            eq: jest.fn<any>().mockReturnValue({
              // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
              maybeSingle: jest.fn<any>().mockResolvedValue({
                data: { address: '0x1234567890123456789012345678901234567890' },
                error: null,
              }),
            }),
          }),
        },
        send_earn_balances_timeline: {
          // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
          select: jest.fn<any>().mockReturnValue({
            // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
            eq: jest.fn<any>().mockReturnValue({
              // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
              lte: jest.fn<any>().mockReturnValue({
                // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
                order: jest.fn<any>().mockResolvedValue({
                  data: [{ log_addr: '\\xVAULT1', assets: '10000000' }], // $10 USDC (above dev threshold)
                  error: null,
                }),
              }),
            }),
          }),
        },
      }

      mockSupabase.from = createMockSupabaseFrom(mockData)
      mockViemClient.readContract = // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
        jest.fn<any>().mockResolvedValue(50n * 10n ** 18n) // Only 50 SEND (below dev threshold of 100)

      const result = await service.checkEligibility(userId)

      expect(result.eligible).toBe(false)
      expect(result.checks.hasSendBalance.eligible).toBe(false)
      expect(result.checks.hasSendBalance.reason).toContain('below minimum')
    })
  })

  describe('checkEligibility - Error Handling', () => {
    it('should throw error when no active distribution found', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000'

      const mockData = {
        distributions: {
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
                      data: null,
                      error: null,
                    }),
                  }),
                }),
              }),
            }),
          }),
        },
      }

      mockSupabase.from = createMockSupabaseFrom(mockData)

      await expect(service.checkEligibility(userId)).rejects.toThrow('No active distribution found')
    })

    it('should throw error when distribution query fails', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000'

      const mockData = {
        distributions: {
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
                      data: null,
                      error: { message: 'Database error', code: 'DB_ERROR' },
                    }),
                  }),
                }),
              }),
            }),
          }),
        },
      }

      mockSupabase.from = createMockSupabaseFrom(mockData)

      await expect(service.checkEligibility(userId)).rejects.toThrow('Database error')
    })

    it('should throw error when userId is empty', async () => {
      await expect(service.checkEligibility('')).rejects.toThrow('User ID is required')
    })

    it('should throw error when userId is invalid UUID format', async () => {
      await expect(service.checkEligibility('not-a-uuid')).rejects.toThrow('Invalid user ID format')
    })
  })

  describe('Cache Behavior', () => {
    it('should cache results and return cached value on subsequent calls', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000'

      const mockData = {
        distributions: {
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
                      data: {
                        id: 1,
                        number: 10,
                        name: 'Test Distribution',
                        snapshot_block_num: '22524265',
                        chain_id: 8453,
                        token_addr: '\\x3f14920c99BEB920Afa163031c4e47a3e03B3e4A' as `\\x${string}`,
                      },
                      error: null,
                    }),
                  }),
                }),
              }),
            }),
          }),
        },
        distribution_verifications: {
          // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
          select: jest.fn<any>().mockReturnValue({
            // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
            eq: jest.fn<any>().mockReturnValue({
              // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
              eq: jest.fn<any>().mockReturnValue({
                // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
                eq: jest.fn<any>().mockReturnValue({
                  // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
                  gt: jest.fn<any>().mockReturnValue({
                    // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
                    maybeSingle: jest.fn<any>().mockResolvedValue({
                      data: { weight: '1' },
                      error: null,
                    }),
                  }),
                }),
              }),
            }),
          }),
        },
        send_accounts: {
          // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
          select: jest.fn<any>().mockReturnValue({
            // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
            eq: jest.fn<any>().mockReturnValue({
              // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
              maybeSingle: jest.fn<any>().mockResolvedValue({
                data: { address: '0x1234567890123456789012345678901234567890' },
                error: null,
              }),
            }),
          }),
        },
        send_earn_balances_timeline: {
          // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
          select: jest.fn<any>().mockReturnValue({
            // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
            eq: jest.fn<any>().mockReturnValue({
              // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
              lte: jest.fn<any>().mockReturnValue({
                // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
                order: jest.fn<any>().mockResolvedValue({
                  data: [{ log_addr: '\\xVAULT1', assets: '10000000' }], // $10 USDC (above dev threshold of $5)
                  error: null,
                }),
              }),
            }),
          }),
        },
      }

      mockSupabase.from = createMockSupabaseFrom(mockData)
      const mockReadContract = // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
        jest.fn<any>().mockResolvedValue(200n * 10n ** 18n) // 200 SEND (above dev threshold of 100)
      mockViemClient.readContract = mockReadContract

      // First call
      const result1 = await service.checkEligibility(userId)
      const firstCheckedAt = result1.checkedAt

      // Second call - should use cache
      const result2 = await service.checkEligibility(userId)

      expect(result1.eligible).toBe(result2.eligible)
      expect(result1.checkedAt).toBe(result2.checkedAt)
      // Verify only called once due to cache
      expect(mockReadContract).toHaveBeenCalledTimes(1)
    })

    it('should provide method to clear cache', () => {
      expect(typeof service.clearCache).toBe('function')
      expect(() => service.clearCache()).not.toThrow()
    })
  })
})
