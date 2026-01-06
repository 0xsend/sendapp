import { describe, expect, it } from '@jest/globals'
import { parseUnits } from 'viem'
import { getRevenueConfig, REVENUE_ADDRESSES } from './config'

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
    it('returns default values when env is empty', () => {
      const config = getRevenueConfig({})

      expect(config.collectorPrivateKey).toBeUndefined()
      expect(config.minMorphoHarvest).toBe(parseUnits('1', 18))
      expect(config.minWellHarvest).toBe(parseUnits('10', 18))
      expect(config.merklApiDelayMs).toBe(100)
      expect(config.merklApiBaseUrl).toBe('https://api.merkl.xyz/v4')
      expect(config.chainId).toBe(8453)
    })

    it('uses provided env values', () => {
      const config = getRevenueConfig({
        REVENUE_COLLECTOR_PRIVATE_KEY: '0xabc123',
        MIN_MORPHO_HARVEST: '5',
        MIN_WELL_HARVEST: '50',
        MERKL_API_DELAY_MS: '200',
        MERKL_API_BASE_URL: 'https://custom-api.merkl.xyz',
        CHAIN_ID: '84531',
      })

      expect(config.collectorPrivateKey).toBe('0xabc123')
      expect(config.minMorphoHarvest).toBe(parseUnits('5', 18))
      expect(config.minWellHarvest).toBe(parseUnits('50', 18))
      expect(config.merklApiDelayMs).toBe(200)
      expect(config.merklApiBaseUrl).toBe('https://custom-api.merkl.xyz')
      expect(config.chainId).toBe(84531)
    })

    it('handles string to number conversion for delay', () => {
      const config = getRevenueConfig({
        MERKL_API_DELAY_MS: '500',
      })

      expect(config.merklApiDelayMs).toBe(500)
      expect(typeof config.merklApiDelayMs).toBe('number')
    })
  })
})
