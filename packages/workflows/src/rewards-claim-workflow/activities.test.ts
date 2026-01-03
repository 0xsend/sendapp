import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { REWARDS_ADDRESSES } from './config'
import type { MerklRewardsResponse } from './types'

// Mock modules before other imports
jest.mock('@my/wagmi', () => ({
  baseMainnetClient: {
    getBlock: jest.fn().mockImplementation(() => Promise.resolve({ timestamp: 1700000000n })),
    waitForTransactionReceipt: jest.fn().mockImplementation(() =>
      Promise.resolve({
        status: 'success',
        transactionHash: '0xabc123',
        blockNumber: 12345n,
      })
    ),
  },
  merklDistributorAddress: {
    8453: '0x3Ef3D8bA38EBe18DB133cEc108f4D14CE00Dd9Ae',
  },
}))
jest.mock('app/utils/supabase/admin')
jest.mock('@my/workflows/utils', () => ({
  bootstrap: jest.fn(),
  isRetryableDBError: jest.fn().mockReturnValue(false),
}))
jest.mock('@temporalio/activity', () => ({
  log: {
    warn: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
  sleep: jest.fn().mockImplementation(() => Promise.resolve()),
  ApplicationFailure: {
    retryable: jest.fn((msg: string, code: string, details: unknown) => {
      const error = new Error(msg) as Error & { code: string; details: unknown }
      error.code = code
      error.details = details
      return error
    }),
    nonRetryable: jest.fn((msg: string, code: string, details?: unknown) => {
      const error = new Error(msg) as Error & { code: string; details: unknown }
      error.code = code
      error.details = details
      return error
    }),
  },
}))
jest.mock('./supabase', () => ({
  getActiveVaults: jest.fn(),
  insertRewardClaims: jest.fn(),
}))

// Mock fetch globally
const mockFetch = jest.fn<() => Promise<Response>>()
global.fetch = mockFetch as unknown as typeof fetch

import { createRewardsClaimActivities } from './activities'
import { getActiveVaults, insertRewardClaims } from './supabase'

const mockedGetActiveVaults = getActiveVaults as jest.MockedFunction<typeof getActiveVaults>
const mockedInsertRewardClaims = insertRewardClaims as jest.MockedFunction<
  typeof insertRewardClaims
>

describe('rewards claim activities', () => {
  const testEnv = {
    REWARDS_CLAIMER_PRIVATE_KEY:
      '0x0000000000000000000000000000000000000000000000000000000000000001',
    MIN_MORPHO_CLAIM: '1',
    MIN_WELL_CLAIM: '10',
    MERKL_API_DELAY_MS: '10', // Short delay for tests
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockFetch.mockReset()
  })

  describe('createRewardsClaimActivities', () => {
    it('returns all activity functions', () => {
      const activities = createRewardsClaimActivities(testEnv)

      expect(activities).toHaveProperty('getActiveVaultsActivity')
      expect(activities).toHaveProperty('fetchClaimableRewardsActivity')
      expect(activities).toHaveProperty('executeClaimActivity')
      expect(activities).toHaveProperty('recordClaimsActivity')
    })
  })

  describe('getActiveVaultsActivity', () => {
    it('returns vaults from database', async () => {
      const mockVaults: `0x${string}`[] = [
        '0x1234567890123456789012345678901234567890',
        '0xabcdef0123456789abcdef0123456789abcdef01',
      ]
      mockedGetActiveVaults.mockResolvedValue(mockVaults)

      const activities = createRewardsClaimActivities(testEnv)
      const result = await activities.getActiveVaultsActivity()

      expect(result).toEqual(mockVaults)
      expect(mockedGetActiveVaults).toHaveBeenCalledTimes(1)
    })

    it('returns empty array when no vaults found', async () => {
      mockedGetActiveVaults.mockResolvedValue([])

      const activities = createRewardsClaimActivities(testEnv)
      const result = await activities.getActiveVaultsActivity()

      expect(result).toEqual([])
    })
  })

  describe('fetchClaimableRewardsActivity', () => {
    const vault1 = '0x1234567890123456789012345678901234567890' as `0x${string}`
    const vault2 = '0xabcdef0123456789abcdef0123456789abcdef01' as `0x${string}`

    it('fetches and filters rewards above threshold', async () => {
      const mockResponse: MerklRewardsResponse = {
        [REWARDS_ADDRESSES.MORPHO_TOKEN.toLowerCase()]: {
          amount: '2000000000000000000', // 2 MORPHO
          claimed: '0',
          pending: '0',
          proofs: ['0xproof1', '0xproof2'],
          breakdowns: [],
        },
        [REWARDS_ADDRESSES.WELL_TOKEN.toLowerCase()]: {
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

      const activities = createRewardsClaimActivities(testEnv)
      const result = await activities.fetchClaimableRewardsActivity({ vaults: [vault1] })

      expect(result).toHaveLength(1)
      expect(result[0]?.vault).toBe(vault1)
      expect(result[0]?.morphoAmount).toBe(2000000000000000000n)
      expect(result[0]?.wellAmount).toBe(15000000000000000000n)
      expect(result[0]?.hasClaimableRewards).toBe(true)
    })

    it('filters out rewards below threshold', async () => {
      const mockResponse: MerklRewardsResponse = {
        [REWARDS_ADDRESSES.MORPHO_TOKEN.toLowerCase()]: {
          amount: '500000000000000000', // 0.5 MORPHO (below 1 threshold)
          claimed: '0',
          pending: '0',
          proofs: ['0xproof1'],
          breakdowns: [],
        },
        [REWARDS_ADDRESSES.WELL_TOKEN.toLowerCase()]: {
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

      const activities = createRewardsClaimActivities(testEnv)
      const result = await activities.fetchClaimableRewardsActivity({ vaults: [vault1] })

      expect(result).toHaveLength(1)
      expect(result[0]?.morphoAmount).toBe(0n)
      expect(result[0]?.wellAmount).toBe(0n)
      expect(result[0]?.hasClaimableRewards).toBe(false)
    })

    it('handles API errors gracefully', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
      } as Response)

      const activities = createRewardsClaimActivities(testEnv)
      const result = await activities.fetchClaimableRewardsActivity({ vaults: [vault1] })

      // Should return empty results for failed vault
      expect(result).toHaveLength(0)
    })

    it('handles empty API response', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({}),
      } as Response)

      const activities = createRewardsClaimActivities(testEnv)
      const result = await activities.fetchClaimableRewardsActivity({ vaults: [vault1] })

      expect(result).toHaveLength(1)
      expect(result[0]?.morphoAmount).toBe(0n)
      expect(result[0]?.wellAmount).toBe(0n)
      expect(result[0]?.hasClaimableRewards).toBe(false)
    })

    it('handles multiple vaults', async () => {
      const mockResponse1: MerklRewardsResponse = {
        [REWARDS_ADDRESSES.MORPHO_TOKEN.toLowerCase()]: {
          amount: '2000000000000000000',
          claimed: '0',
          pending: '0',
          proofs: ['0xproof1'],
          breakdowns: [],
        },
      }
      const mockResponse2: MerklRewardsResponse = {
        [REWARDS_ADDRESSES.WELL_TOKEN.toLowerCase()]: {
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

      const activities = createRewardsClaimActivities(testEnv)
      const result = await activities.fetchClaimableRewardsActivity({ vaults: [vault1, vault2] })

      expect(result).toHaveLength(2)
      expect(result[0]?.vault).toBe(vault1)
      expect(result[1]?.vault).toBe(vault2)
    })
  })

  describe('recordClaimsActivity', () => {
    it('inserts claims into database', async () => {
      mockedInsertRewardClaims.mockResolvedValue(undefined)

      const claims = [
        {
          vault: '0x1234567890123456789012345678901234567890' as `0x${string}`,
          token: REWARDS_ADDRESSES.MORPHO_TOKEN as `0x${string}`,
          amount: 1000000000000000000n,
          txHash: '0xabc123' as `0x${string}`,
          blockNum: 12345n,
          blockTime: 1700000000n,
        },
      ]

      const activities = createRewardsClaimActivities(testEnv)
      await activities.recordClaimsActivity({ claims })

      expect(mockedInsertRewardClaims).toHaveBeenCalledWith(claims)
    })

    it('handles empty claims array', async () => {
      const activities = createRewardsClaimActivities(testEnv)
      await activities.recordClaimsActivity({ claims: [] })

      // Should not call insert for empty claims
      expect(mockedInsertRewardClaims).not.toHaveBeenCalled()
    })
  })
})
