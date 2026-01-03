import { describe, expect, it } from '@jest/globals'
import { parseUnits } from 'viem'
import { getRewardsConfig, REWARDS_ADDRESSES } from './config'

describe('rewards config', () => {
  describe('REWARDS_ADDRESSES', () => {
    it('has correct MORPHO token address', () => {
      expect(REWARDS_ADDRESSES.MORPHO_TOKEN).toBe('0xbaa5cc21fd487b8fcc2f632f3f4e8d37262a0842')
    })

    it('has correct WELL token address', () => {
      expect(REWARDS_ADDRESSES.WELL_TOKEN).toBe('0xA88594D404727625A9437C3f886C7643872296AE')
    })

    it('has correct Merkl Distributor address', () => {
      expect(REWARDS_ADDRESSES.MERKL_DISTRIBUTOR).toBe('0x3Ef3D8bA38EBe18DB133cEc108f4D14CE00Dd9Ae')
    })
  })

  describe('getRewardsConfig', () => {
    it('returns default values when env is empty', () => {
      const config = getRewardsConfig({})

      expect(config.claimerPrivateKey).toBeUndefined()
      expect(config.minMorphoClaim).toBe(parseUnits('1', 18))
      expect(config.minWellClaim).toBe(parseUnits('10', 18))
      expect(config.merklApiDelayMs).toBe(100)
      expect(config.merklApiBaseUrl).toBe('https://api.merkl.xyz/v4')
      expect(config.chainId).toBe(8453)
    })

    it('uses provided env values', () => {
      const config = getRewardsConfig({
        REWARDS_CLAIMER_PRIVATE_KEY: '0xabc123',
        MIN_MORPHO_CLAIM: '5',
        MIN_WELL_CLAIM: '50',
        MERKL_API_DELAY_MS: '200',
        MERKL_API_BASE_URL: 'https://custom-api.merkl.xyz',
        CHAIN_ID: '84531',
      })

      expect(config.claimerPrivateKey).toBe('0xabc123')
      expect(config.minMorphoClaim).toBe(parseUnits('5', 18))
      expect(config.minWellClaim).toBe(parseUnits('50', 18))
      expect(config.merklApiDelayMs).toBe(200)
      expect(config.merklApiBaseUrl).toBe('https://custom-api.merkl.xyz')
      expect(config.chainId).toBe(84531)
    })

    it('handles string to number conversion for delay', () => {
      const config = getRewardsConfig({
        MERKL_API_DELAY_MS: '500',
      })

      expect(config.merklApiDelayMs).toBe(500)
      expect(typeof config.merklApiDelayMs).toBe('number')
    })
  })
})
