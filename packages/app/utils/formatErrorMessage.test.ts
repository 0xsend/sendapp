import { describe, it, expect } from '@jest/globals'
import { formatErrorMessage } from './formatErrorMessage'

describe('formatErrorMessage', () => {
  it('should return "Passkey Authentication Failed"', () => {
    const error = new Error(
      'The operation either timed out or was not allowed due to security reasons'
    )
    const result = formatErrorMessage(error)
    expect(result).toBe('Passkey Authentication Failed')
  })

  it('should return the original error message', () => {
    const error = new Error('Some other error message')
    const result = formatErrorMessage(error)
    expect(result).toBe('Some other error message')
  })
})
