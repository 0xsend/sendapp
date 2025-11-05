import { describe, expect, it, beforeEach, afterEach, jest } from '@jest/globals'
import { CantonTokenManager } from './token-manager'
import type { OAuth2TokenResponse } from './types'

describe('CantonTokenManager', () => {
  const originalEnv = process.env
  const mockKeycloakUrl = 'http://localhost:8880'
  const mockRealm = 'localnet'
  const mockClientId = 'sendapp-api'
  const mockClientSecret = 'sendapp-api-secret'
  const mockBufferSeconds = 300

  beforeEach(() => {
    process.env = { ...originalEnv }
    process.env.ENABLE_CANTON_WALLET_INTEGRATION = 'true'
    process.env.CANTON_KEYCLOAK_URL = mockKeycloakUrl
    process.env.CANTON_KEYCLOAK_REALM = mockRealm
    process.env.CANTON_SERVICE_ACCOUNT_CLIENT_ID = mockClientId
    process.env.CANTON_SERVICE_ACCOUNT_CLIENT_SECRET = mockClientSecret
    process.env.CANTON_API_URL = 'http://localhost:8787/api'
    process.env.CANTON_TOKEN_REFRESH_BUFFER_SECONDS = mockBufferSeconds.toString()

    // Reset singleton instance
    CantonTokenManager.resetForTesting()

    // Clear all mocks
    jest.restoreAllMocks()
  })

  afterEach(() => {
    process.env = originalEnv
    // Restore original fetch
    if (originalEnv.fetch) {
      // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
      global.fetch = originalEnv.fetch as any
    }
  })

  describe('Suite 1: Initialization and Singleton', () => {
    it('returns the same instance on multiple getInstance calls', () => {
      const instance1 = CantonTokenManager.getInstance()
      const instance2 = CantonTokenManager.getInstance()
      expect(instance1).toBe(instance2)
    })

    it('throws error when Canton integration is not enabled', () => {
      process.env.ENABLE_CANTON_WALLET_INTEGRATION = 'false'
      expect(() => CantonTokenManager.getInstance()).toThrow('Canton integration is not enabled')
    })

    it('constructs with config from environment', () => {
      const instance = CantonTokenManager.getInstance()
      expect(instance).toBeDefined()
    })
  })

  describe('Suite 2: Token Fetching', () => {
    it('fetches new token from Keycloak on first call', async () => {
      const mockResponse: OAuth2TokenResponse = {
        access_token: 'mock-jwt-token',
        expires_in: 3600,
        refresh_expires_in: 7200,
        token_type: 'Bearer',
        'not-before-policy': 0,
        scope: 'profile email',
      }

      const mockFetch = jest.fn<typeof fetch>().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      } as Response)
      // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
      global.fetch = mockFetch as any

      const manager = CantonTokenManager.getInstance()
      const token = await manager.getToken()

      expect(token).toBe('mock-jwt-token')
      expect(mockFetch).toHaveBeenCalledTimes(1)
      expect(mockFetch).toHaveBeenCalledWith(
        `${mockKeycloakUrl}/realms/${mockRealm}/protocol/openid-connect/token`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: expect.any(String),
        }
      )

      // Verify request body contains correct OAuth2 params
      const callArgs = (mockFetch.mock.calls[0] as [string, RequestInit])[1]
      const bodyParams = new URLSearchParams(callArgs.body as string)
      expect(bodyParams.get('grant_type')).toBe('client_credentials')
      expect(bodyParams.get('client_id')).toBe(mockClientId)
      expect(bodyParams.get('client_secret')).toBe(mockClientSecret)
    })

    it('returns cached token when still valid', async () => {
      const mockResponse: OAuth2TokenResponse = {
        access_token: 'mock-jwt-token',
        expires_in: 3600,
        refresh_expires_in: 7200,
        token_type: 'Bearer',
        'not-before-policy': 0,
        scope: 'profile email',
      }

      const mockFetch = jest.fn<typeof fetch>().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      } as Response)
      // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
      global.fetch = mockFetch as any

      const manager = CantonTokenManager.getInstance()

      // First call - should fetch
      const token1 = await manager.getToken()
      expect(token1).toBe('mock-jwt-token')
      expect(mockFetch).toHaveBeenCalledTimes(1)

      // Second call - should use cache
      const token2 = await manager.getToken()
      expect(token2).toBe('mock-jwt-token')
      expect(mockFetch).toHaveBeenCalledTimes(1) // Still only 1 call
    })

    it('refreshes token when expired', async () => {
      const mockResponse1: OAuth2TokenResponse = {
        access_token: 'old-token',
        expires_in: 1, // 1 second, will expire immediately
        refresh_expires_in: 7200,
        token_type: 'Bearer',
        'not-before-policy': 0,
        scope: 'profile email',
      }

      const mockResponse2: OAuth2TokenResponse = {
        access_token: 'new-token',
        expires_in: 3600,
        refresh_expires_in: 7200,
        token_type: 'Bearer',
        'not-before-policy': 0,
        scope: 'profile email',
      }

      let callCount = 0
      const mockFetch = jest.fn<typeof fetch>().mockImplementation(async () => {
        callCount++
        return {
          ok: true,
          status: 200,
          json: async () => (callCount === 1 ? mockResponse1 : mockResponse2),
        } as Response
      })
      // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
      global.fetch = mockFetch as any

      const manager = CantonTokenManager.getInstance()

      // First call
      const token1 = await manager.getToken()
      expect(token1).toBe('old-token')

      // Wait for token to expire (1 second + buffer)
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Second call - should fetch new token
      const token2 = await manager.getToken()
      expect(token2).toBe('new-token')
      expect(mockFetch).toHaveBeenCalledTimes(2)
    })

    it('applies token refresh buffer correctly', async () => {
      // Set buffer to 100 seconds
      process.env.CANTON_TOKEN_REFRESH_BUFFER_SECONDS = '100'
      CantonTokenManager.resetForTesting()

      const mockResponse: OAuth2TokenResponse = {
        access_token: 'mock-token',
        expires_in: 200, // 200 seconds
        refresh_expires_in: 7200,
        token_type: 'Bearer',
        'not-before-policy': 0,
        scope: 'profile email',
      }

      const mockFetch = jest.fn<typeof fetch>().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      } as Response)
      // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
      global.fetch = mockFetch as any

      const manager = CantonTokenManager.getInstance()
      await manager.getToken()

      // Check that token expiry is set to now + 200s - 100s = now + 100s
      const cachedToken = manager.getCachedTokenForTesting()
      expect(cachedToken).not.toBeNull()

      const expectedExpiry = Date.now() + (200 - 100) * 1000
      const actualExpiry = cachedToken?.expiresAt || 0

      // Allow 1 second tolerance for test execution time
      expect(Math.abs(actualExpiry - expectedExpiry)).toBeLessThan(1000)
    })

    it('throws error on HTTP error response', async () => {
      const mockFetch = jest.fn<typeof fetch>().mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      } as Response)
      // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
      global.fetch = mockFetch as any

      const manager = CantonTokenManager.getInstance()
      await expect(manager.getToken()).rejects.toThrow(
        'Failed to fetch Canton token: 401 Unauthorized'
      )
    })

    it('throws error on network failure', async () => {
      const mockFetch = jest.fn<typeof fetch>().mockRejectedValue(new Error('Network error'))
      // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
      global.fetch = mockFetch as any

      const manager = CantonTokenManager.getInstance()
      await expect(manager.getToken()).rejects.toThrow('Network error')
    })

    it('throws error when response missing access_token', async () => {
      const mockFetch = jest.fn<typeof fetch>().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ expires_in: 3600 }), // Missing access_token
      } as Response)
      // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
      global.fetch = mockFetch as any

      const manager = CantonTokenManager.getInstance()
      await expect(manager.getToken()).rejects.toThrow('Invalid token response')
    })

    it('throws error when response missing expires_in', async () => {
      const mockFetch = jest.fn<typeof fetch>().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ access_token: 'token' }), // Missing expires_in
      } as Response)
      // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
      global.fetch = mockFetch as any

      const manager = CantonTokenManager.getInstance()
      await expect(manager.getToken()).rejects.toThrow('Invalid token response')
    })
  })

  describe('Suite 3: Concurrent Request Deduplication', () => {
    it('deduplicates concurrent getToken calls', async () => {
      const mockResponse: OAuth2TokenResponse = {
        access_token: 'mock-token',
        expires_in: 3600,
        refresh_expires_in: 7200,
        token_type: 'Bearer',
        'not-before-policy': 0,
        scope: 'profile email',
      }

      let fetchCount = 0
      const mockFetch = jest.fn<typeof fetch>().mockImplementation(async () => {
        fetchCount++
        // Simulate slow network
        await new Promise((resolve) => setTimeout(resolve, 100))
        return {
          ok: true,
          status: 200,
          json: async () => mockResponse,
        } as Response
      })
      // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
      global.fetch = mockFetch as any

      const manager = CantonTokenManager.getInstance()

      // Make 5 concurrent calls
      const promises = Array.from({ length: 5 }, () => manager.getToken())
      const tokens = await Promise.all(promises)

      // All should return the same token
      expect(tokens).toEqual(['mock-token', 'mock-token', 'mock-token', 'mock-token', 'mock-token'])

      // But only 1 fetch should occur
      expect(fetchCount).toBe(1)
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    it('allows new fetch after previous completes', async () => {
      const mockResponse1: OAuth2TokenResponse = {
        access_token: 'token-1',
        expires_in: 1,
        refresh_expires_in: 7200,
        token_type: 'Bearer',
        'not-before-policy': 0,
        scope: 'profile email',
      }

      const mockResponse2: OAuth2TokenResponse = {
        access_token: 'token-2',
        expires_in: 3600,
        refresh_expires_in: 7200,
        token_type: 'Bearer',
        'not-before-policy': 0,
        scope: 'profile email',
      }

      let callCount = 0
      const mockFetch = jest.fn<typeof fetch>().mockImplementation(async () => {
        callCount++
        return {
          ok: true,
          status: 200,
          json: async () => (callCount === 1 ? mockResponse1 : mockResponse2),
        } as Response
      })
      // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
      global.fetch = mockFetch as any

      const manager = CantonTokenManager.getInstance()

      // First batch of concurrent calls
      const batch1 = await Promise.all([manager.getToken(), manager.getToken()])
      expect(batch1).toEqual(['token-1', 'token-1'])
      expect(mockFetch).toHaveBeenCalledTimes(1)

      // Wait for token to expire
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Second batch of concurrent calls - should trigger new fetch
      const batch2 = await Promise.all([manager.getToken(), manager.getToken()])
      expect(batch2).toEqual(['token-2', 'token-2'])
      expect(mockFetch).toHaveBeenCalledTimes(2)
    })

    it('handles concurrent calls when one fails', async () => {
      let callCount = 0
      const mockFetch = jest.fn<typeof fetch>().mockImplementation(async () => {
        callCount++
        if (callCount === 1) {
          throw new Error('Network error')
        }
        return {
          ok: true,
          status: 200,
          json: async () => ({
            access_token: 'token',
            expires_in: 3600,
            refresh_expires_in: 7200,
            token_type: 'Bearer',
            'not-before-policy': 0,
            scope: 'profile email',
          }),
        } as Response
      })
      // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
      global.fetch = mockFetch as any

      const manager = CantonTokenManager.getInstance()

      // First call should fail
      await expect(manager.getToken()).rejects.toThrow('Network error')

      // Second call should succeed (promise deduplication cleared after failure)
      const token = await manager.getToken()
      expect(token).toBe('token')
    })
  })

  describe('Suite 4: Force Refresh', () => {
    it('forces token refresh even when cached token is valid', async () => {
      const mockResponse1: OAuth2TokenResponse = {
        access_token: 'old-token',
        expires_in: 3600,
        refresh_expires_in: 7200,
        token_type: 'Bearer',
        'not-before-policy': 0,
        scope: 'profile email',
      }

      const mockResponse2: OAuth2TokenResponse = {
        access_token: 'new-token',
        expires_in: 3600,
        refresh_expires_in: 7200,
        token_type: 'Bearer',
        'not-before-policy': 0,
        scope: 'profile email',
      }

      let callCount = 0
      const mockFetch = jest.fn<typeof fetch>().mockImplementation(async () => {
        callCount++
        return {
          ok: true,
          status: 200,
          json: async () => (callCount === 1 ? mockResponse1 : mockResponse2),
        } as Response
      })
      // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
      global.fetch = mockFetch as any

      const manager = CantonTokenManager.getInstance()

      // Get initial token
      const token1 = await manager.getToken()
      expect(token1).toBe('old-token')
      expect(mockFetch).toHaveBeenCalledTimes(1)

      // Force refresh
      const token2 = await manager.forceRefresh()
      expect(token2).toBe('new-token')
      expect(mockFetch).toHaveBeenCalledTimes(2)

      // Subsequent getToken should return the new token from cache
      const token3 = await manager.getToken()
      expect(token3).toBe('new-token')
      expect(mockFetch).toHaveBeenCalledTimes(2) // Still 2 calls
    })

    it('deduplicates concurrent forceRefresh calls', async () => {
      const mockResponse: OAuth2TokenResponse = {
        access_token: 'refreshed-token',
        expires_in: 3600,
        refresh_expires_in: 7200,
        token_type: 'Bearer',
        'not-before-policy': 0,
        scope: 'profile email',
      }

      let fetchCount = 0
      const mockFetch = jest.fn<typeof fetch>().mockImplementation(async () => {
        fetchCount++
        await new Promise((resolve) => setTimeout(resolve, 100))
        return {
          ok: true,
          status: 200,
          json: async () => mockResponse,
        } as Response
      })
      global.fetch = mockFetch as unknown as typeof fetch

      const manager = CantonTokenManager.getInstance()

      // Make 3 concurrent forceRefresh calls
      const promises = Array.from({ length: 3 }, () => manager.forceRefresh())
      const tokens = await Promise.all(promises)

      expect(tokens).toEqual(['refreshed-token', 'refreshed-token', 'refreshed-token'])
      expect(fetchCount).toBe(1)
    })
  })

  describe('Suite 5: Clear Cache', () => {
    it('clears cached token', async () => {
      const mockResponse1: OAuth2TokenResponse = {
        access_token: 'token-1',
        expires_in: 3600,
        refresh_expires_in: 7200,
        token_type: 'Bearer',
        'not-before-policy': 0,
        scope: 'profile email',
      }

      const mockResponse2: OAuth2TokenResponse = {
        access_token: 'token-2',
        expires_in: 3600,
        refresh_expires_in: 7200,
        token_type: 'Bearer',
        'not-before-policy': 0,
        scope: 'profile email',
      }

      let callCount = 0
      const mockFetch = jest.fn<typeof fetch>().mockImplementation(async () => {
        callCount++
        return {
          ok: true,
          status: 200,
          json: async () => (callCount === 1 ? mockResponse1 : mockResponse2),
        } as Response
      })
      // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
      global.fetch = mockFetch as any

      const manager = CantonTokenManager.getInstance()

      // Get token
      const token1 = await manager.getToken()
      expect(token1).toBe('token-1')

      // Clear cache
      manager.clearCache()

      // Get token again - should fetch new one
      const token2 = await manager.getToken()
      expect(token2).toBe('token-2')
      expect(mockFetch).toHaveBeenCalledTimes(2)
    })

    it('clearCache is idempotent', () => {
      const manager = CantonTokenManager.getInstance()
      expect(() => {
        manager.clearCache()
        manager.clearCache()
        manager.clearCache()
      }).not.toThrow()
    })
  })

  describe('Suite 6: Edge Cases', () => {
    it('handles very short expiry times', async () => {
      const mockResponse: OAuth2TokenResponse = {
        access_token: 'short-lived-token',
        expires_in: 10, // 10 seconds
        refresh_expires_in: 7200,
        token_type: 'Bearer',
        'not-before-policy': 0,
        scope: 'profile email',
      }

      const mockFetch = jest.fn<typeof fetch>().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      } as Response)
      // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
      global.fetch = mockFetch as any

      const manager = CantonTokenManager.getInstance()
      const token = await manager.getToken()

      expect(token).toBe('short-lived-token')

      // Token should be considered expired due to buffer
      // (10s expiry - 300s buffer = negative, should refresh immediately)
      const cachedToken = manager.getCachedTokenForTesting()
      const now = Date.now()

      // Token should either be expired or very close to expiry
      expect(cachedToken?.expiresAt).toBeLessThanOrEqual(now + 100)
    })

    it('handles zero expiry time', async () => {
      const mockResponse: OAuth2TokenResponse = {
        access_token: 'instant-expire-token',
        expires_in: 0,
        refresh_expires_in: 7200,
        token_type: 'Bearer',
        'not-before-policy': 0,
        scope: 'profile email',
      }

      const mockFetch = jest.fn<typeof fetch>().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      } as Response)
      // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
      global.fetch = mockFetch as any

      const manager = CantonTokenManager.getInstance()
      const token = await manager.getToken()

      expect(token).toBe('instant-expire-token')
    })

    it('handles malformed JSON response', async () => {
      const mockFetch = jest.fn<typeof fetch>().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => {
          throw new Error('Invalid JSON')
        },
        // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
      } as any)
      // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
      global.fetch = mockFetch as any

      const manager = CantonTokenManager.getInstance()
      await expect(manager.getToken()).rejects.toThrow('Invalid JSON')
    })
  })
})
