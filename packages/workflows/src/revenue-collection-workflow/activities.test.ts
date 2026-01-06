import { beforeEach, describe, expect, it, vi, type MockedFunction } from 'vitest'
import { REVENUE_ADDRESSES } from './config'
import type { MerklRewardsResponse } from './types'

// Mock modules before other imports
vi.mock('@my/wagmi', () => ({
  baseMainnetClient: {
    getBlock: vi.fn().mockImplementation(() => Promise.resolve({ timestamp: 1700000000n })),
    waitForTransactionReceipt: vi.fn().mockImplementation(() =>
      Promise.resolve({
        status: 'success',
        transactionHash: '0xabc123',
        blockNumber: 12345n,
      })
    ),
    readContract: vi.fn().mockImplementation((args: unknown) => {
      const { functionName } = args as { functionName: string }
      if (functionName === 'collections') {
        return Promise.resolve('0x65049C4B8e970F5bcCDAE8E141AA06346833CeC4')
      }
      if (functionName === 'balanceOf') {
        return Promise.resolve(1000000000000000000n)
      }
      return Promise.resolve(0n)
    }),
  },
  merklDistributorAddress: {
    8453: '0x3Ef3D8bA38EBe18DB133cEc108f4D14CE00Dd9Ae',
  },
  sendEarnAbi: [],
  sendEarnRevenueSafeAddress: {
    8453: '0x65049C4B8e970F5bcCDAE8E141AA06346833CeC4',
  },
  erc20Abi: [],
}))
vi.mock('app/utils/supabase/admin')
vi.mock('@my/workflows/utils', () => ({
  bootstrap: vi.fn(),
  isRetryableDBError: vi.fn().mockReturnValue(false),
}))
vi.mock('@temporalio/activity', () => ({
  log: {
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
  sleep: vi.fn().mockImplementation(() => Promise.resolve()),
  ApplicationFailure: {
    retryable: vi.fn((msg: string, code: string, details: unknown) => {
      const error = new Error(msg) as Error & { code: string; details: unknown }
      error.code = code
      error.details = details
      return error
    }),
    nonRetryable: vi.fn((msg: string, code: string, details?: unknown) => {
      const error = new Error(msg) as Error & { code: string; details: unknown }
      error.code = code
      error.details = details
      return error
    }),
  },
}))
vi.mock('./supabase', () => ({
  getActiveVaults: vi.fn(),
  insertHarvestRecords: vi.fn(),
  insertSweepRecords: vi.fn(),
}))

// Mock fetch globally
const mockFetch = vi.fn<() => Promise<Response>>()
global.fetch = mockFetch as unknown as typeof fetch

import { createRevenueCollectionActivities } from './activities'
import { getActiveVaults, insertHarvestRecords, insertSweepRecords } from './supabase'

const mockedGetActiveVaults = getActiveVaults as MockedFunction<typeof getActiveVaults>
const mockedInsertHarvestRecords = insertHarvestRecords as MockedFunction<
  typeof insertHarvestRecords
>
const mockedInsertSweepRecords = insertSweepRecords as MockedFunction<typeof insertSweepRecords>

describe('revenue collection activities', () => {
  const testEnv = {
    REVENUE_COLLECTOR_PRIVATE_KEY:
      '0x0000000000000000000000000000000000000000000000000000000000000001',
    MIN_MORPHO_HARVEST: '1',
    MIN_WELL_HARVEST: '10',
    MERKL_API_DELAY_MS: '10', // Short delay for tests
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockReset()
  })

  describe('createRevenueCollectionActivities', () => {
    it('returns all activity functions', () => {
      const activities = createRevenueCollectionActivities(testEnv)

      expect(activities).toHaveProperty('getActiveVaultsActivity')
      expect(activities).toHaveProperty('fetchHarvestableRevenueActivity')
      expect(activities).toHaveProperty('getVaultBalancesActivity')
      expect(activities).toHaveProperty('harvestRevenueActivity')
      expect(activities).toHaveProperty('sweepToRevenueActivity')
      expect(activities).toHaveProperty('recordHarvestActivity')
      expect(activities).toHaveProperty('recordSweepActivity')
    })
  })

  describe('getActiveVaultsActivity', () => {
    it('returns vaults from database', async () => {
      const mockVaults: `0x${string}`[] = [
        '0x1234567890123456789012345678901234567890',
        '0xabcdef0123456789abcdef0123456789abcdef01',
      ]
      mockedGetActiveVaults.mockResolvedValue(mockVaults)

      const activities = createRevenueCollectionActivities(testEnv)
      const result = await activities.getActiveVaultsActivity()

      expect(result).toEqual(mockVaults)
      expect(mockedGetActiveVaults).toHaveBeenCalledTimes(1)
    })

    it('returns empty array when no vaults found', async () => {
      mockedGetActiveVaults.mockResolvedValue([])

      const activities = createRevenueCollectionActivities(testEnv)
      const result = await activities.getActiveVaultsActivity()

      expect(result).toEqual([])
    })
  })

  describe('fetchHarvestableRevenueActivity', () => {
    const vault1 = '0x1234567890123456789012345678901234567890' as `0x${string}`
    const vault2 = '0xabcdef0123456789abcdef0123456789abcdef01' as `0x${string}`

    it('fetches and filters revenue above threshold', async () => {
      const mockResponse: MerklRewardsResponse = {
        [REVENUE_ADDRESSES.MORPHO_TOKEN.toLowerCase()]: {
          amount: '2000000000000000000', // 2 MORPHO
          claimed: '0',
          pending: '0',
          proofs: ['0xproof1', '0xproof2'],
          breakdowns: [],
        },
        [REVENUE_ADDRESSES.WELL_TOKEN.toLowerCase()]: {
          amount: '15000000000000000000', // 15 WELL
          claimed: '0',
          pending: '0',
          proofs: ['0xproof3'],
          breakdowns: [],
        },
      }

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      } as Response)

      const activities = createRevenueCollectionActivities(testEnv)
      const result = await activities.fetchHarvestableRevenueActivity({ vaults: [vault1] })

      expect(result).toHaveLength(1)
      expect(result[0]?.vault).toBe(vault1)
      expect(result[0]?.morphoAmount).toBe(2000000000000000000n)
      expect(result[0]?.wellAmount).toBe(15000000000000000000n)
      expect(result[0]?.hasHarvestableRevenue).toBe(true)
    })

    it('filters out revenue below threshold', async () => {
      const mockResponse: MerklRewardsResponse = {
        [REVENUE_ADDRESSES.MORPHO_TOKEN.toLowerCase()]: {
          amount: '500000000000000000', // 0.5 MORPHO (below 1 threshold)
          claimed: '0',
          pending: '0',
          proofs: ['0xproof1'],
          breakdowns: [],
        },
        [REVENUE_ADDRESSES.WELL_TOKEN.toLowerCase()]: {
          amount: '5000000000000000000', // 5 WELL (below 10 threshold)
          claimed: '0',
          pending: '0',
          proofs: ['0xproof2'],
          breakdowns: [],
        },
      }

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      } as Response)

      const activities = createRevenueCollectionActivities(testEnv)
      const result = await activities.fetchHarvestableRevenueActivity({ vaults: [vault1] })

      expect(result).toHaveLength(1)
      expect(result[0]?.morphoAmount).toBe(0n)
      expect(result[0]?.wellAmount).toBe(0n)
      expect(result[0]?.hasHarvestableRevenue).toBe(false)
    })

    it('handles API errors gracefully', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
      } as Response)

      const activities = createRevenueCollectionActivities(testEnv)
      const result = await activities.fetchHarvestableRevenueActivity({ vaults: [vault1] })

      // Should return empty results for failed vault
      expect(result).toHaveLength(0)
    })

    it('handles empty API response', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({}),
      } as Response)

      const activities = createRevenueCollectionActivities(testEnv)
      const result = await activities.fetchHarvestableRevenueActivity({ vaults: [vault1] })

      expect(result).toHaveLength(1)
      expect(result[0]?.morphoAmount).toBe(0n)
      expect(result[0]?.wellAmount).toBe(0n)
      expect(result[0]?.hasHarvestableRevenue).toBe(false)
    })

    it('handles multiple vaults', async () => {
      const mockResponse1: MerklRewardsResponse = {
        [REVENUE_ADDRESSES.MORPHO_TOKEN.toLowerCase()]: {
          amount: '2000000000000000000',
          claimed: '0',
          pending: '0',
          proofs: ['0xproof1'],
          breakdowns: [],
        },
      }
      const mockResponse2: MerklRewardsResponse = {
        [REVENUE_ADDRESSES.WELL_TOKEN.toLowerCase()]: {
          amount: '20000000000000000000',
          claimed: '0',
          pending: '0',
          proofs: ['0xproof2'],
          breakdowns: [],
        },
      }

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve(mockResponse1),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve(mockResponse2),
        } as Response)

      const activities = createRevenueCollectionActivities(testEnv)
      const result = await activities.fetchHarvestableRevenueActivity({ vaults: [vault1, vault2] })

      expect(result).toHaveLength(2)
      expect(result[0]?.vault).toBe(vault1)
      expect(result[1]?.vault).toBe(vault2)
    })
  })

  describe('recordHarvestActivity', () => {
    it('inserts harvest records into database', async () => {
      mockedInsertHarvestRecords.mockResolvedValue(undefined)

      const records = [
        {
          vault: '0x1234567890123456789012345678901234567890' as `0x${string}`,
          token: REVENUE_ADDRESSES.MORPHO_TOKEN as `0x${string}`,
          amount: 1000000000000000000n,
          txHash: '0xabc123' as `0x${string}`,
          blockNum: 12345n,
          blockTime: 1700000000n,
        },
      ]

      const activities = createRevenueCollectionActivities(testEnv)
      await activities.recordHarvestActivity({ records })

      expect(mockedInsertHarvestRecords).toHaveBeenCalledWith(records)
    })

    it('handles empty records array', async () => {
      const activities = createRevenueCollectionActivities(testEnv)
      await activities.recordHarvestActivity({ records: [] })

      expect(mockedInsertHarvestRecords).not.toHaveBeenCalled()
    })
  })

  describe('recordSweepActivity', () => {
    it('inserts sweep records into database', async () => {
      mockedInsertSweepRecords.mockResolvedValue(undefined)

      const records = [
        {
          vault: '0x1234567890123456789012345678901234567890' as `0x${string}`,
          token: REVENUE_ADDRESSES.MORPHO_TOKEN as `0x${string}`,
          amount: 1000000000000000000n,
          destination: REVENUE_ADDRESSES.REVENUE_SAFE as `0x${string}`,
          txHash: '0xabc123' as `0x${string}`,
          blockNum: 12345n,
          blockTime: 1700000000n,
        },
      ]

      const activities = createRevenueCollectionActivities(testEnv)
      await activities.recordSweepActivity({ records })

      expect(mockedInsertSweepRecords).toHaveBeenCalledWith(records)
    })

    it('handles empty records array', async () => {
      const activities = createRevenueCollectionActivities(testEnv)
      await activities.recordSweepActivity({ records: [] })

      expect(mockedInsertSweepRecords).not.toHaveBeenCalled()
    })
  })
})
