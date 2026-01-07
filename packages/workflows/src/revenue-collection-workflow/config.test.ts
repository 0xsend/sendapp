import { describe, expect, it } from 'vitest'
import { REVENUE_ADDRESSES, getRevenueConfig } from './config'

// Test env with required values
const baseEnv = {
  SUPABASE_DB_URL: 'postgresql://test:test@localhost:5432/test',
  BASE_RPC_URL: 'https://mainnet.base.org',
}

describe('revenue config', () => {
  describe('REVENUE_ADDRESSES', () => {
    it('has correct MORPHO token address', () => {
      expect(REVENUE_ADDRESSES.MORPHO_TOKEN).toBe('0xbaa5cc21fd487b8fcc2f632f3f4e8d37262a0842')
    })

    it('has correct WELL token address', () => {
      expect(REVENUE_ADDRESSES.WELL_TOKEN).toBe('0xA88594D404727625A9437C3f886C7643872296AE')
    })

    it('has correct Merkl Distributor address', () => {
      expect(REVENUE_ADDRESSES.MERKL_DISTRIBUTOR).toBe('0x3Ef3D8bA38EBe18DB133cEc108f4D14CE00Dd9Ae')
    })

    it('has correct Revenue Safe address', () => {
      expect(REVENUE_ADDRESSES.REVENUE_SAFE).toBe('0x65049C4B8e970F5bcCDAE8E141AA06346833CeC4')
    })
  })

  describe('getRevenueConfig', () => {
    it('throws when SUPABASE_DB_URL is missing', () => {
      expect(() => getRevenueConfig({})).toThrow('SUPABASE_DB_URL environment variable is required')
    })

    it('returns config with required values and defaults', () => {
      const config = getRevenueConfig(baseEnv)

      expect(config.dbUrl).toBe(baseEnv.SUPABASE_DB_URL)
      expect(config.rpcUrl).toBe(baseEnv.BASE_RPC_URL)
      expect(config.collectorPrivateKey).toBeUndefined()
      expect(config.minMorphoHarvest).toBe(1000000000000000000n) // 1e18
      expect(config.minWellHarvest).toBe(10000000000000000000n) // 10e18
      expect(config.merklApiDelayMs).toBe(100)
      expect(config.merklApiBaseUrl).toBe('https://api.merkl.xyz/v4')
      expect(config.chainId).toBe(8453)
    })

    it('uses provided env values', () => {
      const config = getRevenueConfig({
        ...baseEnv,
        REVENUE_COLLECTOR_PRIVATE_KEY: '0xabc123',
        MIN_MORPHO_HARVEST: '5',
        MIN_WELL_HARVEST: '50',
        MERKL_API_DELAY_MS: '200',
        MERKL_API_BASE_URL: 'https://custom-api.merkl.xyz',
        CHAIN_ID: '84531',
      })

      expect(config.collectorPrivateKey).toBe('0xabc123')
      expect(config.minMorphoHarvest).toBe(5000000000000000000n) // 5e18
      expect(config.minWellHarvest).toBe(50000000000000000000n) // 50e18
      expect(config.merklApiDelayMs).toBe(200)
      expect(config.merklApiBaseUrl).toBe('https://custom-api.merkl.xyz')
      expect(config.chainId).toBe(84531)
    })

    it('handles string to number conversion for delay', () => {
      const config = getRevenueConfig({
        ...baseEnv,
        MERKL_API_DELAY_MS: '500',
      })

      expect(config.merklApiDelayMs).toBe(500)
      expect(typeof config.merklApiDelayMs).toBe('number')
    })
  })
})
