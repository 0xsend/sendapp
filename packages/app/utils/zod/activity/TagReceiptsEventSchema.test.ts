import { describe, expect, it } from '@jest/globals'
import { assert } from 'app/utils/assert'
import { TagReceiptsDataSchema } from './TagReceiptsEventSchema'

describe('TagReceiptsDataSchema', () => {
  it('should parse a valid tag receipt data', () => {
    const cases = [
      {
        input: {
          tags: ['hurl_handholding2408'],
          value: 10000000000000000,
          tx_hash: '\\xf1443b5abd14e6212dda2d9f5ff1d1d691599de3e8fa019ccc19b909d9bb46a4',
        },
        expected: {
          tags: ['hurl_handholding2408'],
          value: 10000000000000000n,
          tx_hash: '0xf1443b5abd14e6212dda2d9f5ff1d1d691599de3e8fa019ccc19b909d9bb46a4',
        },
      },
    ]
    for (const { input, expected } of cases) {
      const result = TagReceiptsDataSchema.safeParse(input)
      if (!result.success) {
        console.log('failed', result.error)
      }
      assert(result.success === true)
      expect(result.data).toEqual(expected)
    }
  })
  it('should handle invalid tag receipt data', () => {
    const cases = [
      {
        tags: ['hurl_handholding2408'],
        // value: '10000000000000000',
        tx_hash: '\\xf1443b5abd14e6212dda2d9f5ff1d1d691599de3e8fa019ccc19b909d9bb46a4',
      },
      {
        tags: ['hurl_handholding2408'],
        value: 10000000000000000,
        tx_hash: '0xf1443b5abd14e6212dda2d9f5ff1d1d691599de3e8fa019ccc19b909d9bb46a4',
      },
      {
        // tags: ['hurl_handholding2408'],
        value: 10000000000000000,
        tx_hash: '\\xf1443b5abd14e6212dda2d9f5ff1d1d691599de3e8fa019ccc19b909d9bb46a4',
      },
      {
        tags: ['hurl_handholding2408'],
        value: 10000000000000000,
        // tx_hash: '\\xf1443b5abd14e6212dda2d9f5ff1d1d691599de3e8fa019ccc19b909d9bb46a4',
      },
      {},
    ]
    for (const input of cases) {
      const result = TagReceiptsDataSchema.safeParse(input)
      if (result.success) {
        console.log('success', result)
      }
      assert(result.success === false)
    }
  })
})
