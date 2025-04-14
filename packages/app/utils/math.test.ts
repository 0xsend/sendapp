import { describe, expect, it } from '@jest/globals'

import { floor, mulDivDown, WAD, wMulDown } from './math'

describe('floor', () => {
  it('should floor to 1 digit', () => {
    expect(floor(1.23456)).toBe(1)
  })

  it('should floor to 2 digits', () => {
    expect(floor(1.23456, 2)).toBe(1.23)
  })

  it('should floor to 3 digits', () => {
    expect(floor(1.23456, 3)).toBe(1.234)
  })

  it('should floor to 4 digits', () => {
    expect(floor(1.23456, 4)).toBe(1.2345)
  })

  it('should floor to 5 digits', () => {
    expect(floor(1.23456, 5)).toBe(1.23456)
  })

  it('should floor to 6 digits', () => {
    expect(floor(1.23456, 6)).toBe(1.23456)
  })
  it('should floor to -2 digits', () => {
    expect(floor(10936149, -2)).toBe(10936100)
  })
})

describe('mulDivDown', () => {
  it('should multiply and divide correctly', () => {
    expect(mulDivDown(10n, 20n, 5n)).toBe(40n)
    expect(mulDivDown(100n, 200n, 50n)).toBe(400n)
    expect(mulDivDown(BigInt(1e18), BigInt(2e18), BigInt(1e18))).toBe(BigInt(2e18))
  })

  it('should round down', () => {
    expect(mulDivDown(10n, 20n, 3n)).toBe(66n) // (10 * 20) / 3 = 66.666...
  })
})

describe('wMulDown', () => {
  it('should multiply with WAD precision', () => {
    const oneWad = WAD // 1e18
    const twoWad = 2n * WAD // 2e18

    expect(wMulDown(oneWad, oneWad)).toBe(oneWad)
    expect(wMulDown(twoWad, oneWad)).toBe(twoWad)
    expect(wMulDown(twoWad, twoWad)).toBe(4n * WAD)
  })

  it('should round down WAD calculations', () => {
    const oneThird = WAD / 3n
    expect(wMulDown(WAD, oneThird)).toBeLessThan(WAD)
  })
})
