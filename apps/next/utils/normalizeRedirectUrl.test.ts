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
    expect(normalizeRedirectUrl('/_next/data/abc123/index.json')).toBe('/')
  })

  it('should preserve query parameters', () => {
    expect(normalizeRedirectUrl('/_next/data/abc123/send.json?recipient=alice')).toBe(
      '/send?recipient=alice'
    )
    expect(normalizeRedirectUrl('/_next/data/build-id/profile/bigboss.json?tab=activity')).toBe(
      '/profile/bigboss?tab=activity'
    )
    expect(normalizeRedirectUrl('/send.json?idType=tag&recipient=alice')).toBe(
      '/send?idType=tag&recipient=alice'
    )
  })

  it('should handle complex query parameters with encoding', () => {
    expect(
      normalizeRedirectUrl(
        '/_next/data/development/index.json?redirectUri=%2Fsend%3Frecipient%3Dalice'
      )
    ).toBe('/?redirectUri=%2Fsend%3Frecipient%3Dalice')
  })

  it('should handle the problematic URL from the logs', () => {
    const problematicUrl =
      '/_next/data/development/index.json?redirectUri=%2F_next%2Fdata%2Fdevelopment%2Fsend.json%3FidType%3Dtag%26recipient%3Dalice'
    const expected =
      '/?redirectUri=%2F_next%2Fdata%2Fdevelopment%2Fsend.json%3FidType%3Dtag%26recipient%3Dalice'
    expect(normalizeRedirectUrl(problematicUrl)).toBe(expected)
  })
})
