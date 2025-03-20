import { describe, expect, it } from '@jest/globals'
import { assert } from 'app/utils/assert'
import { ReferralsDataSchema } from './ReferralsEventSchema'

describe('ReferralsDataSchema', () => {
  it('should parse a valid tag receipt data', () => {
    const cases = [
      {
        input: {
          tags: ['disconnect_whorl7351'],
        },
        expected: {
          tags: ['disconnect_whorl7351'],
        },
      },
      // tags are nullable and optional
      {
        input: {
          tags: null,
        },
        expected: {
          tags: null,
        },
      },
      {
        input: {
          tags: [],
        },
        expected: {
          tags: [],
        },
      },
      {
        input: {
          tags: undefined,
        },
        expected: {
          tags: null,
        },
      },
    ]
    for (const { input, expected } of cases) {
      const result = ReferralsDataSchema.safeParse(input)
      if (!result.success) {
        console.log('failed', result.error)
      }
      assert(result.success === true)
      expect(result.data).toEqual(expected)
    }
  })
})
