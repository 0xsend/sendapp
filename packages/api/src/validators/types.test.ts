import { describe, expect, test } from '@jest/globals'

describe('Validator types', () => {
  test('ValidationResult type exists', () => {
    type ValidationResult<T> = { ok: true; context: T } | { ok: false; reason: string }

    const success: ValidationResult<{ amount: bigint }> = { ok: true, context: { amount: 100n } }
    const failure: ValidationResult<never> = { ok: false, reason: 'Invalid operation' }

    expect(success.ok).toBe(true)
    expect(failure.ok).toBe(false)
  })

  test('Validator interface shape', () => {
    interface Validator<TContext = unknown> {
      id: string
      validate(params: {
        userop: { callData: string }
        sendAccountCalls?: Array<{ dest: string; value: bigint; data: string }>
        chainId: number
        sendAccount: { address: string }
      }): { ok: true; context: TContext } | { ok: false; reason: string }
    }

    const mockValidator: Validator = {
      id: 'test-validator',
      validate: () => ({ ok: true, context: {} }),
    }

    expect(mockValidator.id).toBe('test-validator')
    expect(
      mockValidator.validate({
        userop: { callData: '0x' },
        chainId: 1,
        sendAccount: { address: '0x' },
      }).ok
    ).toBe(true)
  })
})
