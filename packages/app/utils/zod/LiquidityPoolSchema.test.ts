import { LiquidityPoolSchema } from 'app/utils/zod/LiquidityPoolSchema'

const validLiquidityPool = {
  created_at: '2024-03-21T12:00:00Z',
  pool_addr: '\\x69bc1d350fe13f499c6aeded2c5ea9471b2a599a',
  pool_name: 'Example Pool',
  pool_type: 'UniswapV2',
}

describe('LiquidityPoolSchema', () => {
  test('should parse a liquidity pool address', () => {
    const parsed = LiquidityPoolSchema.parse(validLiquidityPool)
    expect(parsed.created_at).toBeInstanceOf(Date)
    expect(parsed.pool_addr).toBe('0x69bc1d350fE13F499c6AedEd2C5eA9471b2a599A')
    expect(parsed.pool_name).toBe(validLiquidityPool.pool_name)
    expect(parsed.pool_type).toBe(validLiquidityPool.pool_type)
  })
})
