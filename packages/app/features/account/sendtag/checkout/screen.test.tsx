import { test } from '@jest/globals'
import { CheckoutTagSchema } from './CheckoutTagSchema'
import { assert } from 'app/utils/assert'
// import debug from 'debug'

// const log = debug('test:CheckoutTagSchema')

type CheckoutTagSchemaTestCase = {
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
        token: '0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A',
        balance: 250000n,
      },
    ],
    totalPrice: 5000000n,
  }),
}))

// LENGTH(name) BETWEEN 1 AND 20
// AND name ~ '^[A-Za-z0-9_]+$'
test('CheckoutTagSchema', () => {
  const cases: CheckoutTagSchemaTestCase[] = [
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
    const result = CheckoutTagSchema.safeParse(input)
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
