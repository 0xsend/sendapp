import { describe, it, assert } from 'vitest'
import { shorten } from './strings'
describe('test app', function () {
  it('test shorten', function () {
    // Testing with default parameters
    assert.equal(shorten('Hello, World!'), 'Hello,...ld!')

    // Testing edge cases
    assert.equal(shorten('abc'), 'abc') // shorter than default start + end
    assert.equal(shorten('abc', 0, 0), 'abc') // start and end are 0
    assert.equal(shorten('abc', 1, 1), 'a...c') // normal case
    assert.equal(shorten('abc', 2, 1), 'abc') // sum of start and end equals string length
    assert.equal(shorten('abc', 3, 0), 'abc') // only start slicing
    assert.equal(shorten('abc', 0, 3), 'abc') // only end slicing

    // Test case with larger string
    assert.equal(shorten('abcdefghijklmnopqrstuvwxyz', 5, 5), 'abcde...vwxyz')

    // Testing with null or empty string
    assert.equal(shorten(''), '') // empty string
  })
})
