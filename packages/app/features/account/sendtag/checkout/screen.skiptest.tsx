import { test, jest, expect } from '@jest/globals'
import { SendtagSchema } from 'app/utils/zod/sendtag'
import { assert } from 'app/utils/assert'
// import debug from 'debug'

// const log = debug('test:SendtagSchema')

type SendtagSchemaTestCase = {
  input: {
    // biome-ignore lint/suspicious/noExplicitAny: this is for testing
    name: any
  }
  output:
    | {
        name: string
        success: true
      }
    | {
        success: false
      }
}

jest.mock('app/provider/coins', () => ({
  useCoins: jest.fn().mockReturnValue({
    coins: [
      {
        label: 'USDC',
        token: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
        balance: 250000n,
      },
      {
        label: 'SEND',
        token: '0xEab49138BA2Ea6dd776220fE26b7b8E446638956',
        balance: 250000n,
      },
    ],
    totalPrice: 5000000n,
  }),
}))

// LENGTH(name) BETWEEN 1 AND 20
// AND name ~ '^[A-Za-z0-9_]+$'
test('SendtagSchema', () => {
  const cases: SendtagSchemaTestCase[] = [
    {
      input: {
        name: 'test',
      },
      output: {
        name: 'test',
        success: true,
      },
    },
    {
      input: {
        name: 'test123',
      },
      output: {
        name: 'test123',
        success: true,
      },
    },
    {
      input: {
        name: 'invalid$',
      },
      output: {
        success: false,
      },
    },
    {
      input: { name: '' },
      output: {
        success: false,
      },
    },
    {
      input: { name: ['', '1234', 'asdfasdf'] },
      output: {
        success: false,
      },
    },
    {
      input: { name: undefined },
      output: {
        success: false,
      },
    },
  ]

  for (const { input, output } of cases) {
    const success = output.success
    const result = SendtagSchema.safeParse(input)
    expect(result.success).toBe(success)
    if (success) {
      assert(result.success)
      expect(result.data).toEqual({ name: output.name })
    } else {
      assert(!result.success)
      expect(result.error).toBeDefined()
      // log(result.error)
    }
  }
})
