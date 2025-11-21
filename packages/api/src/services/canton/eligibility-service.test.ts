import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { PublicClient } from 'viem'
import { CantonEligibilityService } from './eligibility-service'
import { CANTON_SNAPSHOT_CONFIG } from './types'

describe('CantonEligibilityService', () => {
  let mockSupabase: jest.Mocked<SupabaseClient>
  let mockViemClient: jest.Mocked<PublicClient>
  let service: CantonEligibilityService

  const userId = '123e4567-e89b-12d3-a456-426614174000'
  const distributionRecord = {
    id: 1,
    number: 10,
    name: 'Test Distribution',
    snapshot_block_num: '22524265',
    chain_id: 8453,
    token_addr: '\\x3f14920c99BEB920Afa163031c4e47a3e03B3e4A' as `\\x${string}`,
  }

  beforeEach(() => {
    mockSupabase = {
      // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
      from: jest.fn<any>(),
    } as unknown as jest.Mocked<SupabaseClient>

    mockViemClient = {
      // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
      readContract: jest.fn<any>(),
      // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
      getBlockNumber: jest.fn<any>(),
    } as unknown as jest.Mocked<PublicClient>

    service = new CantonEligibilityService(mockSupabase, mockViemClient)
  })

  function mockDistributionQuery(
    record: typeof distributionRecord | null = distributionRecord,
    sendAccount?: string | null
  ) {
    // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
    mockSupabase.from = jest.fn<any>().mockImplementation((table: string) => {
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
                      data: record,
                      error: null,
                    }),
                  }),
                }),
              }),
            }),
          }),
        }
      }
      if (table === 'send_accounts') {
        return {
          // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
          select: jest.fn<any>().mockReturnValue({
            // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
            eq: jest.fn<any>().mockReturnValue({
              // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
              maybeSingle: jest.fn<any>().mockResolvedValue({
                data:
                  sendAccount === null
                    ? null
                    : { address: sendAccount ?? '0x1234567890123456789012345678901234567890' },
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
  }

  it('validates constructor dependencies', () => {
    expect(service).toBeInstanceOf(CantonEligibilityService)
    expect(
      () => new CantonEligibilityService(null as unknown as SupabaseClient, mockViemClient)
    ).toThrow('Supabase client is required')
    expect(
      () => new CantonEligibilityService(mockSupabase, null as unknown as PublicClient)
    ).toThrow('Viem client is required')
  })

  it('returns eligible when SEND balance is at or above threshold', async () => {
    mockDistributionQuery()
    mockViemClient.readContract.mockResolvedValue(CANTON_SNAPSHOT_CONFIG.MIN_SEND_BALANCE)
    const result = await service.checkEligibility(userId)
    expect(result.eligible).toBe(true)
    expect(result.checks.hasSendBalance.eligible).toBe(true)
    expect(result.checks.hasSendBalance.reason).toContain('meets')
    expect(result.distribution?.id).toBe(1)
  })

  it('returns ineligible when SEND balance is below threshold', async () => {
    mockDistributionQuery()
    mockViemClient.readContract.mockResolvedValue(CANTON_SNAPSHOT_CONFIG.MIN_SEND_BALANCE - 1n)
    const result = await service.checkEligibility(userId)
    expect(result.eligible).toBe(false)
    expect(result.checks.hasSendBalance.eligible).toBe(false)
    expect(result.checks.hasSendBalance.reason).toContain('below')
  })

  it('throws when distribution is missing', async () => {
    mockDistributionQuery(null)
    await expect(service.checkEligibility(userId)).rejects.toThrow('No active distribution found')
  })

  it('uses current block when snapshot number is absent', async () => {
    mockDistributionQuery({
      ...distributionRecord,
      snapshot_block_num: null as unknown as string,
    })
    mockViemClient.getBlockNumber.mockResolvedValue(1234n)
    mockViemClient.readContract.mockResolvedValue(CANTON_SNAPSHOT_CONFIG.MIN_SEND_BALANCE)
    const result = await service.checkEligibility(userId)
    expect(mockViemClient.getBlockNumber).toHaveBeenCalled()
    expect(result.distribution?.snapshot_block_num).toBe('1234')
  })

  it('returns ineligible when no send account exists', async () => {
    mockDistributionQuery(distributionRecord, null)
    const result = await service.checkEligibility(userId)
    expect(result.eligible).toBe(false)
    expect(result.checks.hasSendBalance.reason).toContain('No Send account')
  })

  it('throws on invalid user id', async () => {
    await expect(service.checkEligibility('not-a-uuid')).rejects.toThrow('Invalid user ID format')
  })
})
