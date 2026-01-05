import { sanitizePath, sanitizeUrl, sanitizeProperties } from './sanitizeUrl'

const CLAIM_CODE = 'X7VY-H2EW-F64Z-TFZB-DRFU-K2RS-WOHJ-B6FF-XGPN-CVLH-53Y5-TJP6-2CYQ'

describe('sanitizePath', () => {
  it('redacts claim check code from path', () => {
    const path = `/check/claim/${CLAIM_CODE}`
    expect(sanitizePath(path)).toBe('/check/claim/[REDACTED]')
  })

  it('redacts public check code from path', () => {
    const path = `/check/public/${CLAIM_CODE}`
    expect(sanitizePath(path)).toBe('/check/public/[REDACTED]')
  })

  it('handles path with trailing slash', () => {
    const path = `/check/claim/${CLAIM_CODE}/`
    expect(sanitizePath(path)).toBe('/check/claim/[REDACTED]/')
  })

  it('leaves non-check paths unchanged', () => {
    expect(sanitizePath('/home')).toBe('/home')
    expect(sanitizePath('/send/confirm')).toBe('/send/confirm')
  })
})

describe('sanitizeUrl', () => {
  it('redacts claim check code from full URL', () => {
    const url = `https://send.app/check/claim/${CLAIM_CODE}`
    expect(sanitizeUrl(url)).toBe('https://send.app/check/claim/[REDACTED]')
  })

  it('redacts public check code from full URL', () => {
    const url = `https://send.app/check/public/${CLAIM_CODE}`
    expect(sanitizeUrl(url)).toBe('https://send.app/check/public/[REDACTED]')
  })

  it('preserves query params and hash', () => {
    const url = `https://send.app/check/claim/${CLAIM_CODE}?ref=twitter#section`
    expect(sanitizeUrl(url)).toBe('https://send.app/check/claim/[REDACTED]?ref=twitter#section')
  })

  it('falls back to path sanitization for invalid URLs', () => {
    const path = `/check/claim/${CLAIM_CODE}`
    expect(sanitizeUrl(path)).toBe('/check/claim/[REDACTED]')
  })
})

describe('sanitizeProperties', () => {
  describe('flat objects', () => {
    it('sanitizes single property with check code', () => {
      const props = { url: `/check/claim/${CLAIM_CODE}` }
      expect(sanitizeProperties(props)).toEqual({ url: '/check/claim/[REDACTED]' })
    })

    it('sanitizes multiple properties with check codes', () => {
      const props = {
        claimUrl: `/check/claim/${CLAIM_CODE}`,
        publicUrl: `/check/public/${CLAIM_CODE}`,
        fullUrl: `https://send.app/check/claim/${CLAIM_CODE}`,
      }

      expect(sanitizeProperties(props)).toEqual({
        claimUrl: '/check/claim/[REDACTED]',
        publicUrl: '/check/public/[REDACTED]',
        fullUrl: 'https://send.app/check/claim/[REDACTED]',
      })
    })

    it('leaves safe properties unchanged', () => {
      const props = {
        name: 'John',
        amount: 100,
        isActive: true,
        path: '/home',
      }

      expect(sanitizeProperties(props)).toEqual({
        name: 'John',
        amount: 100,
        isActive: true,
        path: '/home',
      })
    })

    it('handles mixed safe and sensitive properties', () => {
      const props = {
        userId: '12345',
        checkUrl: `/check/claim/${CLAIM_CODE}`,
        amount: 50,
        referrer: '/home',
      }

      expect(sanitizeProperties(props)).toEqual({
        userId: '12345',
        checkUrl: '/check/claim/[REDACTED]',
        amount: 50,
        referrer: '/home',
      })
    })
  })

  describe('nested objects', () => {
    it('sanitizes single level nesting', () => {
      const props = {
        data: {
          url: `/check/claim/${CLAIM_CODE}`,
        },
      }

      expect(sanitizeProperties(props)).toEqual({
        data: {
          url: '/check/claim/[REDACTED]',
        },
      })
    })

    it('sanitizes multiple nested properties', () => {
      const props = {
        screen: {
          currentUrl: `https://send.app/check/claim/${CLAIM_CODE}`,
          previousUrl: `/check/public/${CLAIM_CODE}`,
        },
      }

      expect(sanitizeProperties(props)).toEqual({
        screen: {
          currentUrl: 'https://send.app/check/claim/[REDACTED]',
          previousUrl: '/check/public/[REDACTED]',
        },
      })
    })

    it('sanitizes deeply nested structures', () => {
      const props = {
        level1: {
          level2: {
            level3: {
              level4: {
                url: `/check/claim/${CLAIM_CODE}`,
              },
            },
          },
        },
      }

      expect(sanitizeProperties(props)).toEqual({
        level1: {
          level2: {
            level3: {
              level4: {
                url: '/check/claim/[REDACTED]',
              },
            },
          },
        },
      })
    })

    it('sanitizes sibling nested objects', () => {
      const props = {
        navigation: {
          current: `/check/claim/${CLAIM_CODE}`,
        },
        analytics: {
          pageUrl: `/check/public/${CLAIM_CODE}`,
        },
        user: {
          name: 'Alice',
        },
      }

      expect(sanitizeProperties(props)).toEqual({
        navigation: {
          current: '/check/claim/[REDACTED]',
        },
        analytics: {
          pageUrl: '/check/public/[REDACTED]',
        },
        user: {
          name: 'Alice',
        },
      })
    })
  })

  describe('arrays', () => {
    it('sanitizes flat array of strings', () => {
      const props = [`/check/claim/${CLAIM_CODE}`, `/check/public/${CLAIM_CODE}`]

      expect(sanitizeProperties(props)).toEqual([
        '/check/claim/[REDACTED]',
        '/check/public/[REDACTED]',
      ])
    })

    it('sanitizes array property in object', () => {
      const props = {
        urls: [`/check/claim/${CLAIM_CODE}`, `/check/public/${CLAIM_CODE}`],
      }

      expect(sanitizeProperties(props)).toEqual({
        urls: ['/check/claim/[REDACTED]', '/check/public/[REDACTED]'],
      })
    })

    it('sanitizes array of objects', () => {
      const props = {
        items: [
          { url: `/check/claim/${CLAIM_CODE}`, label: 'Claim' },
          { url: `/check/public/${CLAIM_CODE}`, label: 'Public' },
        ],
      }

      expect(sanitizeProperties(props)).toEqual({
        items: [
          { url: '/check/claim/[REDACTED]', label: 'Claim' },
          { url: '/check/public/[REDACTED]', label: 'Public' },
        ],
      })
    })

    it('handles mixed array contents', () => {
      const props = {
        mixed: [
          `/check/claim/${CLAIM_CODE}`,
          123,
          true,
          null,
          { nested: `/check/public/${CLAIM_CODE}` },
        ],
      }

      expect(sanitizeProperties(props)).toEqual({
        mixed: ['/check/claim/[REDACTED]', 123, true, null, { nested: '/check/public/[REDACTED]' }],
      })
    })

    it('handles nested arrays', () => {
      const props = {
        matrix: [[`/check/claim/${CLAIM_CODE}`], [`/check/public/${CLAIM_CODE}`, 'safe']],
      }

      expect(sanitizeProperties(props)).toEqual({
        matrix: [['/check/claim/[REDACTED]'], ['/check/public/[REDACTED]', 'safe']],
      })
    })
  })

  describe('edge cases', () => {
    it('handles null', () => {
      expect(sanitizeProperties(null)).toBeNull()
    })

    it('handles undefined', () => {
      expect(sanitizeProperties(undefined)).toBeUndefined()
    })

    it('handles empty object', () => {
      expect(sanitizeProperties({})).toEqual({})
    })

    it('handles empty array', () => {
      expect(sanitizeProperties([])).toEqual([])
    })

    it('passes through number primitives', () => {
      expect(sanitizeProperties(42)).toBe(42)
    })

    it('passes through boolean primitives', () => {
      expect(sanitizeProperties(true)).toBe(true)
      expect(sanitizeProperties(false)).toBe(false)
    })

    it('sanitizes standalone string', () => {
      expect(sanitizeProperties(`/check/claim/${CLAIM_CODE}`)).toBe('/check/claim/[REDACTED]')
    })

    it('handles object with null and undefined values', () => {
      const props = {
        url: `/check/claim/${CLAIM_CODE}`,
        nullValue: null,
        undefinedValue: undefined,
      }

      expect(sanitizeProperties(props)).toEqual({
        url: '/check/claim/[REDACTED]',
        nullValue: null,
        undefinedValue: undefined,
      })
    })
  })

  describe('realistic analytics payloads', () => {
    it('sanitizes PostHog-style screen event', () => {
      const props = {
        $screen_name: 'CheckClaimScreen',
        $current_url: `https://send.app/check/claim/${CLAIM_CODE}`,
        $referrer: '/home',
        user_id: 'user_123',
      }

      expect(sanitizeProperties(props)).toEqual({
        $screen_name: 'CheckClaimScreen',
        $current_url: 'https://send.app/check/claim/[REDACTED]',
        $referrer: '/home',
        user_id: 'user_123',
      })
    })

    it('sanitizes event with nested context', () => {
      const props = {
        event: 'check_viewed',
        properties: {
          path: `/check/public/${CLAIM_CODE}`,
          checkType: 'public',
        },
        context: {
          page: {
            url: `https://send.app/check/public/${CLAIM_CODE}`,
            path: `/check/public/${CLAIM_CODE}`,
            referrer: 'https://twitter.com',
          },
        },
      }

      expect(sanitizeProperties(props)).toEqual({
        event: 'check_viewed',
        properties: {
          path: '/check/public/[REDACTED]',
          checkType: 'public',
        },
        context: {
          page: {
            url: 'https://send.app/check/public/[REDACTED]',
            path: '/check/public/[REDACTED]',
            referrer: 'https://twitter.com',
          },
        },
      })
    })
  })
})
