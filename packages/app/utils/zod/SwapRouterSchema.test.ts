import { SwapRouterSchema } from 'app/utils/zod/SwapRouterSchema'

const validSwapRouter = {
  created_at: '2024-03-21T12:00:00Z',
  router_addr: '\\x69bc1d350fe13f499c6aeded2c5ea9471b2a599a',
}

describe('SwapRouterSchema', () => {
  test('should parse a liquidity pool address', () => {
    const parsed = SwapRouterSchema.parse(validSwapRouter)
    expect(parsed.created_at).toBeInstanceOf(Date)
    expect(parsed.router_addr).toBe('0x69bc1d350fE13F499c6AedEd2C5eA9471b2a599A')
  })
})
