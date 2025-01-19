import { describe, it } from '@jest/globals'
import { shorten, squish } from './strings'
describe('test app', () => {
  it('test shorten', () => {
    // Testing with default parameters
    expect(shorten('Hello, World!')).toBe('Hello,...ld!')

    // Testing edge cases
    expect(shorten('abc')).toBe('abc') // shorter than default start + end
    expect(shorten('abc', 0, 0)).toBe('abc') // start and end are 0
    expect(shorten('abc', 1, 1)).toBe('a...c') // normal case
    expect(shorten('abc', 2, 1)).toBe('abc') // sum of start and end equals string length
    expect(shorten('abc', 3, 0)).toBe('abc') // only start slicing
    expect(shorten('abc', 0, 3)).toBe('abc') // only end slicing

    // Test case with larger string
    expect(shorten('abcdefghijklmnopqrstuvwxyz', 5, 5)).toBe('abcde...vwxyz')

    // Testing with null or empty string
    expect(shorten('')).toBe('') // empty string
  })
})

describe('squish', () => {
  it('should remove duplicate spaces', () => {
    expect(squish('a b c')).toBe('a b c')
    expect(squish('a  b  c')).toBe('a b c')
    expect(squish(' a  b  c ')).toBe('a b c')
    expect(squish(' a b c ')).toBe('a b c')
  })
})
