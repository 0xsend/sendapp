import { toNiceError } from 'app/utils/toNiceError'
import { describe, it, expect } from '@jest/globals'
import { z } from 'zod'

describe('toNiceError', () => {
  it('should return the first part of the details property', () => {
    const error = {
      message: 'message',
      details: 'details. more details',
    }
    expect(toNiceError(error)).toBe('details')
  })

  it('should return full details if no period found', () => {
    const error = {
      message: 'message',
      details: 'details without period',
    }
    expect(toNiceError(error)).toBe('details without period')
  })

  it('should return the first part of the message property', () => {
    const error = {
      message: 'message. more message',
    }
    expect(toNiceError(error)).toBe('message')
  })

  it('should handle Error instances', () => {
    const error = new Error('custom error. with more details')
    expect(toNiceError(error)).toBe('custom error')
  })

  it('should handle string errors', () => {
    const error = 'string error. with more details'
    expect(toNiceError(error)).toBe('string error')
  })

  it('should handle string errors without periods', () => {
    const error = 'simple string error'
    expect(toNiceError(error)).toBe('simple string error')
  })

  it('should handle null/undefined errors', () => {
    expect(toNiceError(null)).toBe('Unknown error')
    expect(toNiceError(undefined)).toBe('Unknown error')
  })

  it('should handle unknown error types', () => {
    const originalConsoleError = console.error
    try {
      console.error = jest.fn()
      expect(toNiceError({})).toBe('Unknown error')
      expect(toNiceError(123)).toBe('Unknown error')
    } finally {
      console.error = originalConsoleError
    }
  })

  it('should handle Zod errors', () => {
    const schema = z.object({
      email: z.string().email(),
    })

    try {
      schema.parse({ email: 'invalid-email' })
    } catch (error) {
      expect(toNiceError(error)).toContain('email')
    }
  })
})
