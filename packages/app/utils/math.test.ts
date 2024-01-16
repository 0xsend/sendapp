import { describe, expect, it } from '@jest/globals'

import { floor } from './math'

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
