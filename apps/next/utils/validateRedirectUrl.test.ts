import { validateRedirectUrl } from './validateRedirectUrl'
import { jest, describe, it, expect, beforeEach, afterAll } from '@jest/globals'

describe('validateRedirectUrl', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.resetModules()
    process.env = { ...originalEnv }
  })

  afterAll(() => {
    process.env = originalEnv
  })

  describe('with default environment', () => {
    it('returns "/" for undefined input', () => {
      expect(validateRedirectUrl(undefined)).toBe('/')
    })

    it('returns "/" for empty string', () => {
      expect(validateRedirectUrl('')).toBe('/')
    })

    it('returns "/" for non-string input', () => {
      // @ts-expect-error Testing invalid input
      expect(validateRedirectUrl(123)).toBe('/')
      // @ts-expect-error Testing invalid input
      expect(validateRedirectUrl(null)).toBe('/')
    })

    it('allows valid relative paths', () => {
      expect(validateRedirectUrl('/dashboard')).toBe('/dashboard')
      expect(validateRedirectUrl('/auth/login')).toBe('/auth/login')
      expect(validateRedirectUrl('/profile/123')).toBe('/profile/123')
    })

    it('preserves query parameters and hash', () => {
      expect(validateRedirectUrl('/search?q=test&page=1')).toBe('/search?q=test&page=1')
      expect(validateRedirectUrl('/docs#section-1')).toBe('/docs#section-1')
      expect(validateRedirectUrl('/app?tab=settings#preferences')).toBe(
        '/app?tab=settings#preferences'
      )
    })

    it('handles URL encoding properly', () => {
      expect(validateRedirectUrl('/search?q=hello%20world')).toBe('/search?q=hello%20world')
      expect(validateRedirectUrl('%2Fdashboard')).toBe('/dashboard')
    })

    it('rejects protocol-relative URLs', () => {
      expect(validateRedirectUrl('//evil.com')).toBe('/')
      expect(validateRedirectUrl('//evil.com/path')).toBe('/')
    })

    it('rejects absolute URLs to external domains', () => {
      expect(validateRedirectUrl('https://evil.com')).toBe('/')
      expect(validateRedirectUrl('http://malicious.site/phishing')).toBe('/')
      expect(validateRedirectUrl('https://example.com/callback')).toBe('/')
    })

    it('rejects javascript: protocol', () => {
      expect(validateRedirectUrl('javascript:alert(1)')).toBe('/')
      expect(validateRedirectUrl('javascript:void(0)')).toBe('/')
    })

    it('rejects data: protocol', () => {
      expect(validateRedirectUrl('data:text/html,<script>alert(1)</script>')).toBe('/')
    })

    it('handles malformed URLs gracefully', () => {
      expect(validateRedirectUrl('///')).toBe('/')
      expect(validateRedirectUrl('http://@')).toBe('/')
      expect(validateRedirectUrl('ht!tp://test')).toBe('/')
    })

    it('rejects URLs with credentials', () => {
      expect(validateRedirectUrl('http://user:pass@evil.com')).toBe('/')
    })
  })

  describe('with custom NEXT_PUBLIC_URL', () => {
    beforeEach(() => {
      // Need to clear the module cache and set env before importing
      jest.resetModules()
      process.env.NEXT_PUBLIC_URL = 'https://app.example.com'
    })

    it('validates against the configured domain', async () => {
      // Re-import to get new instance with updated env
      const { validateRedirectUrl: validate } = await import('./validateRedirectUrl')

      expect(validate('/dashboard')).toBe('/dashboard')
      expect(validate('https://app.example.com/profile')).toBe('/')
      expect(validate('https://other.com/malicious')).toBe('/')
    })
  })

  describe('edge cases', () => {
    it('handles very long paths', () => {
      const longPath = `/test${'a'.repeat(1000)}`
      expect(validateRedirectUrl(longPath)).toBe(longPath)
    })

    it('handles special characters in paths', () => {
      expect(validateRedirectUrl('/profile/user-123')).toBe('/profile/user-123')
      expect(validateRedirectUrl('/path_with_underscore')).toBe('/path_with_underscore')
      expect(validateRedirectUrl('/path.with.dots')).toBe('/path.with.dots')
    })

    it('handles unicode in paths', () => {
      // URLs normalize unicode characters to percent-encoded form
      expect(validateRedirectUrl('/profile/用户')).toBe('/profile/%E7%94%A8%E6%88%B7')
      expect(validateRedirectUrl('/café/menu')).toBe('/caf%C3%A9/menu')
    })
  })
})
