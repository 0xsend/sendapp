import { SwapRouterSchema } from 'app/utils/zod/SwapRouterSchema'

const validSwapRouter = {
  created_at: '2024-03-21T12:00:00Z',
  router_addr:
    '\\x307836396263316433353066653133663439396336616564656432633565613934373162326135393961',
}

describe('SwapRouterSchema', () => {
  test('should parse a liquidity pool address', () => {
    const parsed = SwapRouterSchema.parse(validSwapRouter)
    expect(parsed.created_at).toBeInstanceOf(Date)
    expect(parsed.router_addr).toBe('0x69bc1d350fe13f499c6aeded2c5ea9471b2a599a')
  })
})
