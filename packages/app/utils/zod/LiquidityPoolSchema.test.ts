import { LiquidityPoolSchema } from 'app/utils/zod/LiquidityPoolSchema'

const validLiquidityPool = {
  created_at: '2024-03-21T12:00:00Z',
  pool_addr:
    '\\x307836396263316433353066653133663439396336616564656432633565613934373162326135393961',
  pool_name: 'Example Pool',
  pool_type: 'UniswapV2',
}

describe('LiquidityPoolSchema', () => {
  test('should parse a liquidity pool address', () => {
    const parsed = LiquidityPoolSchema.parse(validLiquidityPool)
    expect(parsed.created_at).toBeInstanceOf(Date)
    expect(parsed.pool_addr).toBe('0x69bc1d350fe13f499c6aeded2c5ea9471b2a599a')
    expect(parsed.pool_name).toBe(validLiquidityPool.pool_name)
    expect(parsed.pool_type).toBe(validLiquidityPool.pool_type)
  })
})
