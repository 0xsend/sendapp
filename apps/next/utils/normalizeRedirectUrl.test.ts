import { describe, it, expect } from '@jest/globals'
import { normalizeRedirectUrl } from './normalizeRedirectUrl'

describe('normalizeRedirectUrl', () => {
  it('should convert Next.js data URLs to regular paths', () => {
    expect(normalizeRedirectUrl('/_next/data/abc123/send.json')).toBe('/send')
    expect(normalizeRedirectUrl('/_next/data/build-id-123/profile/bigboss.json')).toBe(
      '/profile/bigboss'
    )
    expect(normalizeRedirectUrl('/_next/data/xyz789/send/confirm.json')).toBe('/send/confirm')
  })

  it('should handle regular .json URLs', () => {
    expect(normalizeRedirectUrl('/send.json')).toBe('/send')
    expect(normalizeRedirectUrl('/profile/bigboss.json')).toBe('/profile/bigboss')
  })

  it('should leave non-json URLs unchanged', () => {
    expect(normalizeRedirectUrl('/send')).toBe('/send')
    expect(normalizeRedirectUrl('/profile/bigboss')).toBe('/profile/bigboss')
    expect(normalizeRedirectUrl('/')).toBe('/')
  })

  it('should handle edge cases', () => {
    expect(normalizeRedirectUrl(undefined)).toBe(undefined)
    expect(normalizeRedirectUrl('')).toBe('')
    expect(normalizeRedirectUrl('/_next/data/')).toBe('/_next/data/')
    expect(normalizeRedirectUrl('/_next/data/build/notjson')).toBe('/_next/data/build/notjson')
  })

  it('should handle index routes correctly', () => {
    expect(normalizeRedirectUrl('/_next/data/abc123/index.json')).toBe('/index')
    // Note: You might want to handle index -> / conversion if needed
  })
})
