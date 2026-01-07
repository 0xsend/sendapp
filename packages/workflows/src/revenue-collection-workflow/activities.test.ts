import { beforeEach, describe, expect, it, vi, type MockedFunction } from 'vitest'
import type { VaultRevenue, VaultBalances, HarvestResult, SweepResult } from '@my/send-earn'

// Mock @my/send-earn library functions
vi.mock('@my/send-earn', async (importOriginal) => {
  const original = await importOriginal<typeof import('@my/send-earn')>()
  return {
    ...original,
    getActiveVaults: vi.fn(),
    fetchHarvestableRevenue: vi.fn(),
    getVaultBalances: vi.fn(),
    executeHarvest: vi.fn(),
    executeSweep: vi.fn(),
  }
})

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

import { createRevenueCollectionActivities } from './activities'
import { insertHarvestRecords, insertSweepRecords } from './supabase'
import {
  REVENUE_ADDRESSES,
  getActiveVaults,
  fetchHarvestableRevenue,
  getVaultBalances,
  executeHarvest,
  executeSweep,
} from '@my/send-earn'

const mockedInsertHarvestRecords = insertHarvestRecords as MockedFunction<
  typeof insertHarvestRecords
>
const mockedInsertSweepRecords = insertSweepRecords as MockedFunction<typeof insertSweepRecords>
const mockGetActiveVaults = getActiveVaults as MockedFunction<typeof getActiveVaults>
const mockFetchHarvestableRevenue = fetchHarvestableRevenue as MockedFunction<
  typeof fetchHarvestableRevenue
>
const mockGetVaultBalances = getVaultBalances as MockedFunction<typeof getVaultBalances>
const mockExecuteHarvest = executeHarvest as MockedFunction<typeof executeHarvest>
const mockExecuteSweep = executeSweep as MockedFunction<typeof executeSweep>

describe('revenue collection activities', () => {
  const testEnv = {
    SUPABASE_DB_URL: 'postgresql://test:test@localhost:5432/test',
    BASE_RPC_URL: 'https://mainnet.base.org',
    REVENUE_COLLECTOR_PRIVATE_KEY:
      '0x0000000000000000000000000000000000000000000000000000000000000001',
    MIN_MORPHO_HARVEST: '1',
    MIN_WELL_HARVEST: '10',
    MERKL_API_DELAY_MS: '10',
  }

  beforeEach(() => {
    vi.clearAllMocks()
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
    it('returns vaults from @my/send-earn getActiveVaults', async () => {
      const mockVaults: `0x${string}`[] = [
        '0x1234567890123456789012345678901234567890',
        '0xabcdef0123456789abcdef0123456789abcdef01',
      ]
      mockGetActiveVaults.mockResolvedValue(mockVaults)

      const activities = createRevenueCollectionActivities(testEnv)
      const result = await activities.getActiveVaultsActivity()

      expect(result).toEqual(mockVaults)
      expect(mockGetActiveVaults).toHaveBeenCalledWith(testEnv.SUPABASE_DB_URL)
    })

    it('returns empty array when no vaults found', async () => {
      mockGetActiveVaults.mockResolvedValue([])

      const activities = createRevenueCollectionActivities(testEnv)
      const result = await activities.getActiveVaultsActivity()

      expect(result).toEqual([])
    })
  })

  describe('fetchHarvestableRevenueActivity', () => {
    const vault1 = '0x1234567890123456789012345678901234567890' as `0x${string}`

    it('delegates to @my/send-earn fetchHarvestableRevenue', async () => {
      const mockRevenue: VaultRevenue[] = [
        {
          vault: vault1,
          morphoAmount: 2000000000000000000n,
          wellAmount: 15000000000000000000n,
          morphoProof: ['0xproof1' as `0x${string}`],
          wellProof: ['0xproof2' as `0x${string}`],
          hasHarvestableRevenue: true,
        },
      ]
      mockFetchHarvestableRevenue.mockResolvedValue(mockRevenue)

      const activities = createRevenueCollectionActivities(testEnv)
      const result = await activities.fetchHarvestableRevenueActivity({ vaults: [vault1] })

      expect(result).toEqual(mockRevenue)
      expect(mockFetchHarvestableRevenue).toHaveBeenCalledWith(
        expect.objectContaining({ dbUrl: testEnv.SUPABASE_DB_URL }),
        [vault1]
      )
    })
  })

  describe('getVaultBalancesActivity', () => {
    const vault1 = '0x1234567890123456789012345678901234567890' as `0x${string}`

    it('delegates to @my/send-earn getVaultBalances', async () => {
      const mockBalances: VaultBalances[] = [
        {
          vault: vault1,
          morphoBalance: 1000000000000000000n,
          wellBalance: 5000000000000000000n,
        },
      ]
      mockGetVaultBalances.mockResolvedValue(mockBalances)

      const activities = createRevenueCollectionActivities(testEnv)
      const result = await activities.getVaultBalancesActivity({ vaults: [vault1] })

      expect(result).toEqual(mockBalances)
      expect(mockGetVaultBalances).toHaveBeenCalledWith(
        expect.objectContaining({ dbUrl: testEnv.SUPABASE_DB_URL }),
        [vault1]
      )
    })
  })

  describe('harvestRevenueActivity', () => {
    const vault1 = '0x1234567890123456789012345678901234567890' as `0x${string}`

    it('delegates to @my/send-earn executeHarvest', async () => {
      const mockVaultRevenue: VaultRevenue[] = [
        {
          vault: vault1,
          morphoAmount: 2000000000000000000n,
          wellAmount: 0n,
          morphoProof: ['0xproof1' as `0x${string}`],
          wellProof: [],
          hasHarvestableRevenue: true,
        },
      ]
      const mockHarvestResult: HarvestResult = {
        harvested: { morpho: 2000000000000000000n, well: 0n },
        transactions: [
          {
            vault: vault1,
            token: REVENUE_ADDRESSES.MORPHO_TOKEN as `0x${string}`,
            amount: 2000000000000000000n,
            txHash: '0xabc123' as `0x${string}`,
            blockNum: 12345n,
            blockTime: 1700000000n,
          },
        ],
        errors: [],
      }
      mockExecuteHarvest.mockResolvedValue(mockHarvestResult)

      const activities = createRevenueCollectionActivities(testEnv)
      const result = await activities.harvestRevenueActivity({ vaultRevenue: mockVaultRevenue })

      expect(result.transactions).toContain('0xabc123')
      expect(result.totals.morpho).toBe(2000000000000000000n)
      expect(result.successful).toHaveLength(1)
      expect(mockExecuteHarvest).toHaveBeenCalledWith(
        expect.objectContaining({ collectorPrivateKey: testEnv.REVENUE_COLLECTOR_PRIVATE_KEY }),
        mockVaultRevenue
      )
    })

    it('returns empty result when no harvestable vaults', async () => {
      const mockVaultRevenue: VaultRevenue[] = [
        {
          vault: vault1,
          morphoAmount: 0n,
          wellAmount: 0n,
          morphoProof: [],
          wellProof: [],
          hasHarvestableRevenue: false,
        },
      ]

      const activities = createRevenueCollectionActivities(testEnv)
      const result = await activities.harvestRevenueActivity({ vaultRevenue: mockVaultRevenue })

      expect(result.transactions).toHaveLength(0)
      expect(result.totals.morpho).toBe(0n)
      expect(mockExecuteHarvest).not.toHaveBeenCalled()
    })
  })

  describe('sweepToRevenueActivity', () => {
    const vault1 = '0x1234567890123456789012345678901234567890' as `0x${string}`

    it('delegates to @my/send-earn executeSweep', async () => {
      const mockSweepResult: SweepResult = {
        swept: { morpho: 1000000000000000000n, well: 0n },
        transactions: [
          {
            vault: vault1,
            token: REVENUE_ADDRESSES.MORPHO_TOKEN as `0x${string}`,
            amount: 1000000000000000000n,
            txHash: '0xdef456' as `0x${string}`,
            blockNum: 12346n,
            blockTime: 1700000100n,
          },
        ],
        skipped: [],
        errors: [],
      }
      mockExecuteSweep.mockResolvedValue(mockSweepResult)

      const activities = createRevenueCollectionActivities(testEnv)
      const result = await activities.sweepToRevenueActivity({
        vaults: [vault1],
        tokens: [REVENUE_ADDRESSES.MORPHO_TOKEN as `0x${string}`],
      })

      expect(result.transactions).toContain('0xdef456')
      expect(result.totals.morpho).toBe(1000000000000000000n)
      expect(result.successful).toHaveLength(1)
      expect(mockExecuteSweep).toHaveBeenCalledWith(
        expect.objectContaining({ collectorPrivateKey: testEnv.REVENUE_COLLECTOR_PRIVATE_KEY }),
        [vault1]
      )
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
