import { describe, expect, it, beforeEach, afterEach, jest } from '@jest/globals'
import { CantonAPIClient } from './api-client'
import { CantonTokenManager } from './token-manager'
import type { CantonPriorityToken, PriorityTokenListResponse } from './types'

describe('CantonAPIClient', () => {
  const originalEnv = process.env
  const mockApiUrl = 'http://localhost:8787/api'

  beforeEach(() => {
    process.env = { ...originalEnv }
    process.env.ENABLE_CANTON_WALLET_INTEGRATION = 'true'
    process.env.CANTON_KEYCLOAK_URL = 'http://localhost:8880'
    process.env.CANTON_KEYCLOAK_REALM = 'localnet'
    process.env.CANTON_SERVICE_ACCOUNT_CLIENT_ID = 'sendapp-api'
    process.env.CANTON_SERVICE_ACCOUNT_CLIENT_SECRET = 'sendapp-api-secret'
    process.env.CANTON_API_URL = mockApiUrl
    process.env.CANTON_TOKEN_REFRESH_BUFFER_SECONDS = '300'

    // Reset singletons
    CantonTokenManager.resetForTesting()
    CantonAPIClient.resetForTesting()

    jest.restoreAllMocks()
  })

  afterEach(() => {
    process.env = originalEnv
    if (originalEnv.fetch) {
      // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
      global.fetch = originalEnv.fetch as any
    }
  })

  describe('Suite 1: Initialization and Singleton', () => {
    it('returns the same instance on multiple getInstance calls', () => {
      const instance1 = CantonAPIClient.getInstance()
      const instance2 = CantonAPIClient.getInstance()
      expect(instance1).toBe(instance2)
    })

    it('throws error when Canton integration is not enabled', () => {
      process.env.ENABLE_CANTON_WALLET_INTEGRATION = 'false'
      expect(() => CantonAPIClient.getInstance()).toThrow('Canton integration is not enabled')
    })

    it('constructs with config from environment', () => {
      const instance = CantonAPIClient.getInstance()
      expect(instance).toBeDefined()
    })
  })

  describe('Suite 2: ensurePriorityToken - Query-First Idempotency', () => {
    it('returns existing token when label matches and not exhausted', async () => {
      const existingToken: CantonPriorityToken = {
        id: 'token-id-123',
        token: 'existing-token-123',
        label: 'test-label',
        createdAt: Date.now(),
        createdBy: 'sendapp-api',
        isRevoked: false,
        usageCount: 0,
        maxUses: 1,
      }

      const listResponse: PriorityTokenListResponse = {
        tokens: [existingToken],
      }

      // Mock token manager
      const mockTokenManager = {
        getToken: jest.fn<() => Promise<string>>().mockResolvedValue('mock-jwt-token'),
        forceRefresh: jest.fn(),
        clearCache: jest.fn<() => void>(),
      }
      // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
      jest.spyOn(CantonTokenManager, 'getInstance').mockReturnValue(mockTokenManager as any)

      // Mock fetch for GET request
      const mockFetch = jest.fn<typeof fetch>().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => listResponse,
      } as Response)
      // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
      global.fetch = mockFetch as any

      const client = CantonAPIClient.getInstance()
      const result = await client.ensurePriorityToken('test-label')

      expect(result).toBe('existing-token-123')
      expect(mockFetch).toHaveBeenCalledTimes(1)
      expect(mockFetch).toHaveBeenCalledWith(`${mockApiUrl}/queue/admin/priority-tokens`, {
        method: 'GET',
        headers: {
          Authorization: 'Bearer mock-jwt-token',
          'Content-Type': 'application/json',
        },
      })
    })

    it('creates new token when label does not exist', async () => {
      const otherToken: CantonPriorityToken = {
        id: 'other-id',
        token: 'other-token',
        label: 'other-label',
        createdAt: Date.now(),
        createdBy: 'sendapp-api',
        isRevoked: false,
        usageCount: 0,
        maxUses: 1,
      }

      const listResponse: PriorityTokenListResponse = {
        tokens: [otherToken],
      }

      const newToken: CantonPriorityToken = {
        id: 'new-id',
        token: 'new-token-456',
        label: 'test-label',
        createdAt: Date.now(),
        createdBy: 'sendapp-api',
        isRevoked: false,
        usageCount: 0,
        maxUses: 1,
      }

      const mockTokenManager = {
        getToken: jest.fn<() => Promise<string>>().mockResolvedValue('mock-jwt-token'),
        forceRefresh: jest.fn(),
        clearCache: jest.fn<() => void>(),
      }
      // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
      jest.spyOn(CantonTokenManager, 'getInstance').mockReturnValue(mockTokenManager as any)

      let callCount = 0
      const mockFetch = jest.fn<typeof fetch>().mockImplementation(async (url) => {
        callCount++
        if (callCount === 1) {
          // GET request
          return {
            ok: true,
            status: 200,
            json: async () => listResponse,
          } as Response
        }
        // POST request
        return {
          ok: true,
          status: 201,
          json: async () => newToken,
        } as Response
      })
      // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
      global.fetch = mockFetch as any

      const client = CantonAPIClient.getInstance()
      const result = await client.ensurePriorityToken('test-label')

      expect(result).toBe('new-token-456')
      expect(mockFetch).toHaveBeenCalledTimes(2)

      // Verify GET call
      expect(mockFetch).toHaveBeenNthCalledWith(1, `${mockApiUrl}/queue/admin/priority-tokens`, {
        method: 'GET',
        headers: {
          Authorization: 'Bearer mock-jwt-token',
          'Content-Type': 'application/json',
        },
      })

      // Verify POST call (verify it includes required fields)
      const postCall = mockFetch.mock.calls[1]
      expect(postCall).toBeDefined()
      // biome-ignore lint/style/noNonNullAssertion: Test verified postCall exists
      expect(postCall![0]).toBe(`${mockApiUrl}/queue/admin/priority-tokens`)
      // biome-ignore lint/style/noNonNullAssertion: Test verified postCall exists
      expect(postCall![1]?.method).toBe('POST')

      // biome-ignore lint/style/noNonNullAssertion: Test verified postCall exists
      const postBody = JSON.parse((postCall![1] as RequestInit)?.body as string)
      expect(postBody.label).toBe('test-label')
      expect(postBody.createdBy).toBe('sendapp-api')
      expect(postBody.maxUses).toBe(1)
      expect(postBody.expiresAt).toBeUndefined()
      expect(postBody.metadata).toEqual({ source: 'send-app' })
    })

    it('creates token when list is empty', async () => {
      const listResponse: PriorityTokenListResponse = {
        tokens: [],
      }

      const newToken: CantonPriorityToken = {
        id: 'new-id-789',
        token: 'new-token-789',
        label: 'test-label',
        createdAt: Date.now(),
        createdBy: 'sendapp-api',
        isRevoked: false,
        usageCount: 0,
        maxUses: 1,
      }

      const mockTokenManager = {
        getToken: jest.fn<() => Promise<string>>().mockResolvedValue('mock-jwt-token'),
        forceRefresh: jest.fn(),
        clearCache: jest.fn<() => void>(),
      }
      // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
      jest.spyOn(CantonTokenManager, 'getInstance').mockReturnValue(mockTokenManager as any)

      let callCount = 0
      const mockFetch = jest.fn<typeof fetch>().mockImplementation(async () => {
        callCount++
        if (callCount === 1) {
          return {
            ok: true,
            status: 200,
            json: async () => listResponse,
          } as Response
        }
        return {
          ok: true,
          status: 201,
          json: async () => newToken,
        } as Response
      })
      // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
      global.fetch = mockFetch as any

      const client = CantonAPIClient.getInstance()
      const result = await client.ensurePriorityToken('test-label')

      expect(result).toBe('new-token-789')
      expect(mockFetch).toHaveBeenCalledTimes(2)
    })

    it('handles case-sensitive label matching', async () => {
      const existingToken: CantonPriorityToken = {
        id: 'lowercase-id',
        token: 'token-lowercase',
        label: 'test-label',
        createdAt: Date.now(),
        createdBy: 'sendapp-api',
        isRevoked: false,
        usageCount: 0,
        maxUses: 1,
      }

      const listResponse: PriorityTokenListResponse = {
        tokens: [existingToken],
      }

      const newToken: CantonPriorityToken = {
        id: 'uppercase-id',
        token: 'token-uppercase',
        label: 'TEST-LABEL',
        createdAt: Date.now(),
        createdBy: 'sendapp-api',
        isRevoked: false,
        usageCount: 0,
        maxUses: 1,
      }

      const mockTokenManager = {
        getToken: jest.fn<() => Promise<string>>().mockResolvedValue('mock-jwt-token'),
        forceRefresh: jest.fn(),
        clearCache: jest.fn<() => void>(),
      }
      // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
      jest.spyOn(CantonTokenManager, 'getInstance').mockReturnValue(mockTokenManager as any)

      let callCount = 0
      const mockFetch = jest.fn<typeof fetch>().mockImplementation(async () => {
        callCount++
        if (callCount === 1) {
          return {
            ok: true,
            status: 200,
            json: async () => listResponse,
          } as Response
        }
        return {
          ok: true,
          status: 201,
          json: async () => newToken,
        } as Response
      })
      // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
      global.fetch = mockFetch as any

      const client = CantonAPIClient.getInstance()
      const result = await client.ensurePriorityToken('TEST-LABEL')

      // Should create new token since labels are case-sensitive
      expect(result).toBe('token-uppercase')
      expect(mockFetch).toHaveBeenCalledTimes(2)
    })

    it('creates new token when existing token is exhausted (usageCount >= maxUses)', async () => {
      const exhaustedToken: CantonPriorityToken = {
        id: 'exhausted-id',
        token: 'exhausted-token',
        label: 'test-label',
        createdAt: Date.now() - 1000,
        createdBy: 'sendapp-api',
        isRevoked: false,
        usageCount: 1,
        maxUses: 1,
      }

      const listResponse: PriorityTokenListResponse = {
        tokens: [exhaustedToken],
      }

      const newToken: CantonPriorityToken = {
        id: 'new-fresh-id',
        token: 'new-fresh-token',
        label: 'test-label',
        createdAt: Date.now(),
        createdBy: 'sendapp-api',
        isRevoked: false,
        usageCount: 0,
        maxUses: 1,
      }

      const mockTokenManager = {
        getToken: jest.fn<() => Promise<string>>().mockResolvedValue('mock-jwt-token'),
        forceRefresh: jest.fn(),
        clearCache: jest.fn<() => void>(),
      }
      // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
      jest.spyOn(CantonTokenManager, 'getInstance').mockReturnValue(mockTokenManager as any)

      let callCount = 0
      const mockFetch = jest.fn<typeof fetch>().mockImplementation(async () => {
        callCount++
        if (callCount === 1) {
          return {
            ok: true,
            status: 200,
            json: async () => listResponse,
          } as Response
        }
        return {
          ok: true,
          status: 201,
          json: async () => newToken,
        } as Response
      })
      // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
      global.fetch = mockFetch as any

      const client = CantonAPIClient.getInstance()
      const result = await client.ensurePriorityToken('test-label')

      expect(result).toBe('new-fresh-token')
      expect(mockFetch).toHaveBeenCalledTimes(2)
    })

    it('includes expiresAt when ttlHours env var is set', async () => {
      process.env.CANTON_PRIORITY_TOKEN_TTL_HOURS = '24'

      const listResponse: PriorityTokenListResponse = {
        tokens: [],
      }

      const newToken: CantonPriorityToken = {
        id: 'ttl-id',
        token: 'ttl-token',
        label: 'test-label',
        createdAt: Date.now(),
        createdBy: 'sendapp-api',
        isRevoked: false,
        usageCount: 0,
        maxUses: 1,
      }

      const mockTokenManager = {
        getToken: jest.fn<() => Promise<string>>().mockResolvedValue('mock-jwt-token'),
        forceRefresh: jest.fn(),
        clearCache: jest.fn<() => void>(),
      }
      // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
      jest.spyOn(CantonTokenManager, 'getInstance').mockReturnValue(mockTokenManager as any)

      let callCount = 0
      const mockFetch = jest.fn<typeof fetch>().mockImplementation(async () => {
        callCount++
        if (callCount === 1) {
          return {
            ok: true,
            status: 200,
            json: async () => listResponse,
          } as Response
        }
        return {
          ok: true,
          status: 201,
          json: async () => newToken,
        } as Response
      })
      // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
      global.fetch = mockFetch as any

      const client = CantonAPIClient.getInstance()
      await client.ensurePriorityToken('test-label')

      const postCall = mockFetch.mock.calls[1]
      // biome-ignore lint/style/noNonNullAssertion: Verified above
      const postBody = JSON.parse((postCall![1] as RequestInit).body as string)
      expect(postBody.expiresAt).toBeGreaterThan(Date.now())
    })

    it('skips revoked tokens when searching for existing token', async () => {
      const revokedToken: CantonPriorityToken = {
        id: 'revoked-id',
        token: 'revoked-token',
        label: 'test-label',
        createdAt: Date.now() - 1000,
        createdBy: 'sendapp-api',
        isRevoked: true,
        usageCount: 0,
        maxUses: 1,
      }

      const listResponse: PriorityTokenListResponse = {
        tokens: [revokedToken],
      }

      const newToken: CantonPriorityToken = {
        id: 'new-unrevoked-id',
        token: 'new-unrevoked-token',
        label: 'test-label',
        createdAt: Date.now(),
        createdBy: 'sendapp-api',
        isRevoked: false,
        usageCount: 0,
        maxUses: 1,
      }

      const mockTokenManager = {
        getToken: jest.fn<() => Promise<string>>().mockResolvedValue('mock-jwt-token'),
        forceRefresh: jest.fn(),
        clearCache: jest.fn<() => void>(),
      }
      // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
      jest.spyOn(CantonTokenManager, 'getInstance').mockReturnValue(mockTokenManager as any)

      let callCount = 0
      const mockFetch = jest.fn<typeof fetch>().mockImplementation(async () => {
        callCount++
        if (callCount === 1) {
          return {
            ok: true,
            status: 200,
            json: async () => listResponse,
          } as Response
        }
        return {
          ok: true,
          status: 201,
          json: async () => newToken,
        } as Response
      })
      // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
      global.fetch = mockFetch as any

      const client = CantonAPIClient.getInstance()
      const result = await client.ensurePriorityToken('test-label')

      expect(result).toBe('new-unrevoked-token')
      expect(mockFetch).toHaveBeenCalledTimes(2)
    })

    it('returns existing token with unlimited uses (maxUses undefined)', async () => {
      const unlimitedToken: CantonPriorityToken = {
        id: 'unlimited-id',
        token: 'unlimited-token',
        label: 'test-label',
        createdAt: Date.now(),
        createdBy: 'sendapp-api',
        isRevoked: false,
        usageCount: 100,
        // maxUses is undefined, so unlimited
      }

      const listResponse: PriorityTokenListResponse = {
        tokens: [unlimitedToken],
      }

      const mockTokenManager = {
        getToken: jest.fn<() => Promise<string>>().mockResolvedValue('mock-jwt-token'),
        forceRefresh: jest.fn(),
        clearCache: jest.fn<() => void>(),
      }
      // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
      jest.spyOn(CantonTokenManager, 'getInstance').mockReturnValue(mockTokenManager as any)

      const mockFetch = jest.fn<typeof fetch>().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => listResponse,
      } as Response)
      // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
      global.fetch = mockFetch as any

      const client = CantonAPIClient.getInstance()
      const result = await client.ensurePriorityToken('test-label')

      expect(result).toBe('unlimited-token')
      expect(mockFetch).toHaveBeenCalledTimes(1) // Only GET, no POST
    })

    it('returns existing token when usage is below limit', async () => {
      const partiallyUsedToken: CantonPriorityToken = {
        id: 'partial-id',
        token: 'partial-token',
        label: 'test-label',
        createdAt: Date.now(),
        createdBy: 'sendapp-api',
        isRevoked: false,
        usageCount: 2,
        maxUses: 5,
      }

      const listResponse: PriorityTokenListResponse = {
        tokens: [partiallyUsedToken],
      }

      const mockTokenManager = {
        getToken: jest.fn<() => Promise<string>>().mockResolvedValue('mock-jwt-token'),
        forceRefresh: jest.fn(),
        clearCache: jest.fn<() => void>(),
      }
      // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
      jest.spyOn(CantonTokenManager, 'getInstance').mockReturnValue(mockTokenManager as any)

      const mockFetch = jest.fn<typeof fetch>().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => listResponse,
      } as Response)
      // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
      global.fetch = mockFetch as any

      const client = CantonAPIClient.getInstance()
      const result = await client.ensurePriorityToken('test-label')

      expect(result).toBe('partial-token')
      expect(mockFetch).toHaveBeenCalledTimes(1) // Only GET, no POST
    })
  })

  describe('Suite 3: 401 Token Refresh', () => {
    it('retries with refreshed token on 401 response', async () => {
      const successResponse: PriorityTokenListResponse = {
        tokens: [
          {
            id: 'valid-id',
            token: 'valid-token',
            label: 'test-label',
            createdAt: Date.now(),
            createdBy: 'sendapp-api',
            isRevoked: false,
            usageCount: 0,
            maxUses: 1,
          },
        ],
      }

      const mockTokenManager = {
        getToken: jest.fn<() => Promise<string>>().mockResolvedValue('old-jwt-token'),
        forceRefresh: jest.fn<() => Promise<string>>().mockResolvedValue('new-jwt-token'),
        clearCache: jest.fn<() => void>(),
      }
      // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
      jest.spyOn(CantonTokenManager, 'getInstance').mockReturnValue(mockTokenManager as any)

      let callCount = 0
      const mockFetch = jest.fn<typeof fetch>().mockImplementation(async (url, init) => {
        callCount++
        const authHeader = (init as RequestInit)?.headers as Record<string, string>
        const token = authHeader?.Authorization

        if (callCount === 1) {
          // First call with old token - return 401
          expect(token).toBe('Bearer old-jwt-token')
          return {
            ok: false,
            status: 401,
            statusText: 'Unauthorized',
          } as Response
        }

        // Second call with new token - succeed
        expect(token).toBe('Bearer new-jwt-token')
        return {
          ok: true,
          status: 200,
          json: async () => successResponse,
        } as Response
      })
      // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
      global.fetch = mockFetch as any

      const client = CantonAPIClient.getInstance()
      const result = await client.ensurePriorityToken('test-label')

      expect(result).toBe('valid-token')
      expect(mockFetch).toHaveBeenCalledTimes(2)
      expect(mockTokenManager.forceRefresh).toHaveBeenCalledTimes(1)
    })

    it('fails after retry if second 401', async () => {
      const mockTokenManager = {
        getToken: jest.fn<() => Promise<string>>().mockResolvedValue('old-jwt-token'),
        forceRefresh: jest.fn<() => Promise<string>>().mockResolvedValue('new-jwt-token'),
        clearCache: jest.fn<() => void>(),
      }
      // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
      jest.spyOn(CantonTokenManager, 'getInstance').mockReturnValue(mockTokenManager as any)

      const mockFetch = jest.fn<typeof fetch>().mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      } as Response)
      // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
      global.fetch = mockFetch as any

      const client = CantonAPIClient.getInstance()
      await expect(client.ensurePriorityToken('test-label')).rejects.toThrow(
        'Canton API error: 401 Unauthorized'
      )

      expect(mockFetch).toHaveBeenCalledTimes(2)
      expect(mockTokenManager.forceRefresh).toHaveBeenCalledTimes(1)
    })

    it('does not retry on non-401 errors', async () => {
      const mockTokenManager = {
        getToken: jest.fn<() => Promise<string>>().mockResolvedValue('mock-jwt-token'),
        forceRefresh: jest.fn(),
        clearCache: jest.fn<() => void>(),
      }
      // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
      jest.spyOn(CantonTokenManager, 'getInstance').mockReturnValue(mockTokenManager as any)

      const mockFetch = jest.fn<typeof fetch>().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      } as Response)
      // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
      global.fetch = mockFetch as any

      const client = CantonAPIClient.getInstance()
      await expect(client.ensurePriorityToken('test-label')).rejects.toThrow(
        'Canton API error: 500 Internal Server Error'
      )

      expect(mockFetch).toHaveBeenCalledTimes(1)
      expect(mockTokenManager.forceRefresh).not.toHaveBeenCalled()
    })
  })

  describe('Suite 4: buildDeepLink', () => {
    it('builds correct invite URL format', () => {
      const client = CantonAPIClient.getInstance()
      const deepLink = client.buildDeepLink('priority-token-123')
      expect(deepLink).toBe(
        'https://cantonwallet.com/auth/create-account?priorityToken=priority-token-123'
      )
    })

    it('handles tokens with special characters', () => {
      const client = CantonAPIClient.getInstance()
      const deepLink = client.buildDeepLink('token-with-dashes-123')
      expect(deepLink).toBe(
        'https://cantonwallet.com/auth/create-account?priorityToken=token-with-dashes-123'
      )
    })

    it('handles empty token', () => {
      const client = CantonAPIClient.getInstance()
      const deepLink = client.buildDeepLink('')
      expect(deepLink).toBe('https://cantonwallet.com/auth/create-account?priorityToken=')
    })
  })

  describe('Suite 5: Error Handling', () => {
    it('throws error on network failure', async () => {
      const mockTokenManager = {
        getToken: jest.fn<() => Promise<string>>().mockResolvedValue('mock-jwt-token'),
        forceRefresh: jest.fn(),
        clearCache: jest.fn<() => void>(),
      }
      // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
      jest.spyOn(CantonTokenManager, 'getInstance').mockReturnValue(mockTokenManager as any)

      const mockFetch = jest.fn<typeof fetch>().mockRejectedValue(new Error('Network error'))
      // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
      global.fetch = mockFetch as any

      const client = CantonAPIClient.getInstance()
      await expect(client.ensurePriorityToken('test-label')).rejects.toThrow('Network error')
    })

    it('throws error on malformed JSON response', async () => {
      const mockTokenManager = {
        getToken: jest.fn<() => Promise<string>>().mockResolvedValue('mock-jwt-token'),
        forceRefresh: jest.fn(),
        clearCache: jest.fn<() => void>(),
      }
      // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
      jest.spyOn(CantonTokenManager, 'getInstance').mockReturnValue(mockTokenManager as any)

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

      const client = CantonAPIClient.getInstance()
      await expect(client.ensurePriorityToken('test-label')).rejects.toThrow('Invalid JSON')
    })

    it('throws error when GET response missing tokens array', async () => {
      const mockTokenManager = {
        getToken: jest.fn<() => Promise<string>>().mockResolvedValue('mock-jwt-token'),
        forceRefresh: jest.fn(),
        clearCache: jest.fn<() => void>(),
      }
      // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
      jest.spyOn(CantonTokenManager, 'getInstance').mockReturnValue(mockTokenManager as any)

      const mockFetch = jest.fn<typeof fetch>().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({}), // Missing tokens array
      } as Response)
      // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
      global.fetch = mockFetch as any

      const client = CantonAPIClient.getInstance()
      await expect(client.ensurePriorityToken('test-label')).rejects.toThrow(
        'Invalid priority tokens list response'
      )
    })

    it('throws error when POST response missing token field', async () => {
      const listResponse: PriorityTokenListResponse = {
        tokens: [],
      }

      const mockTokenManager = {
        getToken: jest.fn<() => Promise<string>>().mockResolvedValue('mock-jwt-token'),
        forceRefresh: jest.fn(),
        clearCache: jest.fn<() => void>(),
      }
      // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
      jest.spyOn(CantonTokenManager, 'getInstance').mockReturnValue(mockTokenManager as any)

      let callCount = 0
      const mockFetch = jest.fn<typeof fetch>().mockImplementation(async () => {
        callCount++
        if (callCount === 1) {
          return {
            ok: true,
            status: 200,
            json: async () => listResponse,
          } as Response
        }
        return {
          ok: true,
          status: 201,
          json: async () => ({ label: 'test-label' }), // Missing token field
        } as Response
      })
      // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
      global.fetch = mockFetch as any

      const client = CantonAPIClient.getInstance()
      await expect(client.ensurePriorityToken('test-label')).rejects.toThrow(
        'Invalid priority token response'
      )
    })
  })

  describe('Suite 6: Integration Tests', () => {
    it.skip('end-to-end flow: find existing token', async () => {
      // Reset singletons for integration test
      CantonTokenManager.resetForTesting()
      CantonAPIClient.resetForTesting()

      // Mock Keycloak token fetch
      const mockKeycloakResponse = {
        access_token: 'real-jwt-token',
        expires_in: 3600,
        refresh_expires_in: 7200,
        token_type: 'Bearer',
        'not-before-policy': 0,
        scope: 'profile email',
      }

      const existingToken: CantonPriorityToken = {
        id: 'integration-id',
        token: 'existing-priority-token',
        label: 'integration-test',
        createdAt: Date.now(),
        createdBy: 'sendapp-api',
        isRevoked: false,
        usageCount: 0,
        maxUses: 1,
      }

      const listResponse: PriorityTokenListResponse = {
        tokens: [existingToken],
      }

      let callCount = 0
      const mockFetch = jest.fn<typeof fetch>().mockImplementation(async (url) => {
        callCount++
        const urlString = url.toString()

        if (urlString.includes('keycloak')) {
          // Keycloak token request
          return {
            ok: true,
            status: 200,
            // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
            json: jest.fn<() => Promise<any>>().mockResolvedValue(mockKeycloakResponse),
            // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
          } as any
        }

        // Canton API request
        return {
          ok: true,
          status: 200,
          // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
          json: jest.fn<() => Promise<any>>().mockResolvedValue(listResponse),
          // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
        } as any
      })
      // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
      global.fetch = mockFetch as any

      const client = CantonAPIClient.getInstance()
      const token = await client.ensurePriorityToken('integration-test')

      expect(token).toBe('existing-priority-token')
      expect(mockFetch).toHaveBeenCalledTimes(2) // 1 Keycloak + 1 Canton GET
    })

    it.skip('end-to-end flow: create new token', async () => {
      // Reset singletons for integration test
      CantonTokenManager.resetForTesting()
      CantonAPIClient.resetForTesting()

      const mockKeycloakResponse = {
        access_token: 'real-jwt-token',
        expires_in: 3600,
        refresh_expires_in: 7200,
        token_type: 'Bearer',
        'not-before-policy': 0,
        scope: 'profile email',
      }

      const listResponse: PriorityTokenListResponse = {
        tokens: [],
      }

      const newToken: CantonPriorityToken = {
        id: 'new-integration-id',
        token: 'new-priority-token',
        label: 'integration-test',
        createdAt: Date.now(),
        createdBy: 'sendapp-api',
        isRevoked: false,
        usageCount: 0,
        maxUses: 1,
      }

      let callCount = 0
      const mockFetch = jest.fn<typeof fetch>().mockImplementation(async (url, init) => {
        callCount++
        const urlString = url.toString()

        if (urlString.includes('keycloak')) {
          return {
            ok: true,
            status: 200,
            // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
            json: jest.fn<() => Promise<any>>().mockResolvedValue(mockKeycloakResponse),
            // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
          } as any
        }

        const method = (init as RequestInit)?.method
        if (method === 'GET') {
          return {
            ok: true,
            status: 200,
            // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
            json: jest.fn<() => Promise<any>>().mockResolvedValue(listResponse),
            // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
          } as any
        }

        // POST
        return {
          ok: true,
          status: 201,
          // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
          json: jest.fn<() => Promise<any>>().mockResolvedValue(newToken),
          // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
        } as any
      })
      // biome-ignore lint/suspicious/noExplicitAny: Test mocking requires any types
      global.fetch = mockFetch as any

      const client = CantonAPIClient.getInstance()
      const token = await client.ensurePriorityToken('integration-test')

      expect(token).toBe('new-priority-token')
      expect(mockFetch).toHaveBeenCalledTimes(3) // 1 Keycloak + 1 GET + 1 POST
    })
  })
})
