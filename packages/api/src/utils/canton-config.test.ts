import { describe, expect, it, beforeEach, afterEach } from '@jest/globals'
import {
  getCantonConfig,
  isCantonIntegrationEnabled,
  getRequiredCantonConfig,
  createCantonApiGatewayConfig,
} from './canton-config'

describe('Canton Config', () => {
  const originalEnv = process.env

  beforeEach(() => {
    // Reset process.env to a clean state before each test
    process.env = { ...originalEnv }
    // Clear all Canton-related env vars
    process.env.ENABLE_CANTON_WALLET_INTEGRATION = undefined
    process.env.CANTON_KEYCLOAK_URL = undefined
    process.env.CANTON_KEYCLOAK_REALM = undefined
    process.env.CANTON_SERVICE_ACCOUNT_CLIENT_ID = undefined
    process.env.CANTON_SERVICE_ACCOUNT_CLIENT_SECRET = undefined
    process.env.CANTON_API_URL = undefined
    process.env.CANTON_TOKEN_REFRESH_BUFFER_SECONDS = undefined
    process.env.CANTON_PRIORITY_TOKEN_CREATED_BY = undefined
    process.env.CANTON_PRIORITY_TOKEN_MAX_USES = undefined
    process.env.CANTON_PRIORITY_TOKEN_TTL_HOURS = undefined
  })

  afterEach(() => {
    // Restore original env after each test
    process.env = originalEnv
  })

  describe('Suite 1: Integration Disabled with Localnet Defaults', () => {
    it('returns enabled: false when env var not set', () => {
      const config = getCantonConfig()
      expect(config.enabled).toBe(false)
      expect(config.priorityToken).toEqual({
        createdBy: 'sendapp-api',
        maxUses: 1,
        ttlHours: undefined,
      })
    })

    it('returns enabled: false when env var is false', () => {
      process.env.ENABLE_CANTON_WALLET_INTEGRATION = 'false'
      const config = getCantonConfig()
      expect(config.enabled).toBe(false)
    })

    it('uses localnet defaults even when disabled', () => {
      const config = getCantonConfig()
      expect(config.keycloak).toEqual({
        url: 'http://localhost:8880',
        realm: 'localnet',
        clientId: 'sendapp-api',
        clientSecret: 'sendapp-api-secret',
      })
      expect(config.api).toEqual({
        url: 'http://localhost:8787/api',
      })
      expect(config.tokenRefreshBufferSeconds).toBe(300)
      expect(config.priorityToken).toEqual({
        createdBy: 'sendapp-api',
        maxUses: 1,
        ttlHours: undefined,
      })
    })

    it('isCantonIntegrationEnabled() returns false when disabled', () => {
      expect(isCantonIntegrationEnabled()).toBe(false)
    })

    it('getRequiredCantonConfig() throws error when disabled', () => {
      expect(() => getRequiredCantonConfig()).toThrow('Canton integration is not enabled')
    })
  })

  describe('Suite 2: Integration Enabled - Valid Config', () => {
    beforeEach(() => {
      // Set up valid config
      process.env.ENABLE_CANTON_WALLET_INTEGRATION = 'true'
      process.env.CANTON_KEYCLOAK_URL = 'http://localhost:8880'
      process.env.CANTON_KEYCLOAK_REALM = 'localnet'
      process.env.CANTON_SERVICE_ACCOUNT_CLIENT_ID = 'sendapp-api'
      process.env.CANTON_SERVICE_ACCOUNT_CLIENT_SECRET = 'sendapp-api-secret'
      process.env.CANTON_API_URL = 'http://localhost:8787/api'
    })

    it('returns complete config with all env vars set', () => {
      const config = getCantonConfig()
      expect(config.enabled).toBe(true)
      expect(config.keycloak).toEqual({
        url: 'http://localhost:8880',
        realm: 'localnet',
        clientId: 'sendapp-api',
        clientSecret: 'sendapp-api-secret',
      })
      expect(config.api).toEqual({
        url: 'http://localhost:8787/api',
      })
      expect(config.tokenRefreshBufferSeconds).toBe(300)
    })

    it('uses default tokenRefreshBufferSeconds when not specified', () => {
      const config = getCantonConfig()
      expect(config.tokenRefreshBufferSeconds).toBe(300)
    })

    it('uses custom tokenRefreshBufferSeconds when specified', () => {
      process.env.CANTON_TOKEN_REFRESH_BUFFER_SECONDS = '600'
      const config = getCantonConfig()
      expect(config.tokenRefreshBufferSeconds).toBe(600)
    })

    it('isCantonIntegrationEnabled() returns true', () => {
      expect(isCantonIntegrationEnabled()).toBe(true)
    })

    it('getRequiredCantonConfig() returns config with non-null keycloak and api', () => {
      const config = getRequiredCantonConfig()
      expect(config.enabled).toBe(true)
      expect(config.keycloak).not.toBeNull()
      expect(config.api).not.toBeNull()
      expect(config.keycloak?.url).toBe('http://localhost:8880')
      expect(config.keycloak?.realm).toBe('localnet')
      expect(config.keycloak?.clientId).toBe('sendapp-api')
      expect(config.keycloak?.clientSecret).toBe('sendapp-api-secret')
      expect(config.api?.url).toBe('http://localhost:8787/api')
      expect(config.priorityToken).toEqual({
        createdBy: 'sendapp-api',
        maxUses: 1,
        ttlHours: undefined,
      })
    })

    it('applies custom priority token overrides when specified', () => {
      process.env.CANTON_PRIORITY_TOKEN_CREATED_BY = 'custom-app'
      process.env.CANTON_PRIORITY_TOKEN_MAX_USES = '5'
      process.env.CANTON_PRIORITY_TOKEN_TTL_HOURS = '48'

      const config = getCantonConfig()

      expect(config.priorityToken).toEqual({
        createdBy: 'custom-app',
        maxUses: 5,
        ttlHours: 48,
      })
    })
  })

  describe('Suite 3: Invalid Config Values (with defaults fallback)', () => {
    it('throws error when Keycloak URL is explicitly invalid', () => {
      process.env.CANTON_KEYCLOAK_URL = 'not-a-url'

      expect(() => getCantonConfig()).toThrow()
    })

    it('throws error when API URL is explicitly invalid', () => {
      process.env.CANTON_API_URL = 'not-a-url'

      expect(() => getCantonConfig()).toThrow()
    })

    it('throws error when token refresh buffer is not a number', () => {
      process.env.CANTON_TOKEN_REFRESH_BUFFER_SECONDS = 'not-a-number'

      expect(() => getCantonConfig()).toThrow()
    })

    it('throws error when token refresh buffer is negative', () => {
      process.env.CANTON_TOKEN_REFRESH_BUFFER_SECONDS = '-100'

      expect(() => getCantonConfig()).toThrow()
    })

    it('throws error when priority token TTL is not a number', () => {
      process.env.CANTON_PRIORITY_TOKEN_TTL_HOURS = 'invalid'

      expect(() => getCantonConfig()).toThrow()
    })

    it('uses localnet defaults when env vars are missing', () => {
      // All env vars missing, should use defaults
      const config = getCantonConfig()

      expect(config.keycloak.url).toBe('http://localhost:8880')
      expect(config.keycloak.realm).toBe('localnet')
      expect(config.keycloak.clientId).toBe('sendapp-api')
      expect(config.keycloak.clientSecret).toBe('sendapp-api-secret')
      expect(config.api.url).toBe('http://localhost:8787/api')
    })
  })

  describe('Suite 4: createCantonApiGatewayConfig helper', () => {
    it('returns localnet defaults when no env vars set', () => {
      const config = createCantonApiGatewayConfig()

      expect(config.keycloak).toEqual({
        url: 'http://localhost:8880',
        realm: 'localnet',
        clientId: 'sendapp-api',
        clientSecret: 'sendapp-api-secret',
      })
      expect(config.api).toEqual({
        url: 'http://localhost:8787/api',
      })
      expect(config.tokenRefreshBufferSeconds).toBe(300)
      expect(config.priorityToken).toEqual({
        createdBy: 'sendapp-api',
        maxUses: 1,
        ttlHours: undefined,
      })
    })

    it('overrides defaults with custom env vars', () => {
      process.env.CANTON_KEYCLOAK_URL = 'https://auth.canton.network'
      process.env.CANTON_KEYCLOAK_REALM = 'production'
      process.env.CANTON_SERVICE_ACCOUNT_CLIENT_ID = 'sendapp-prod'
      process.env.CANTON_SERVICE_ACCOUNT_CLIENT_SECRET = 'prod-secret'
      process.env.CANTON_API_URL = 'https://api.canton.network'
      process.env.CANTON_TOKEN_REFRESH_BUFFER_SECONDS = '600'
      process.env.CANTON_PRIORITY_TOKEN_CREATED_BY = 'custom'
      process.env.CANTON_PRIORITY_TOKEN_MAX_USES = '10'
      process.env.CANTON_PRIORITY_TOKEN_TTL_HOURS = '24'

      const config = createCantonApiGatewayConfig()

      expect(config.keycloak).toEqual({
        url: 'https://auth.canton.network',
        realm: 'production',
        clientId: 'sendapp-prod',
        clientSecret: 'prod-secret',
      })
      expect(config.api).toEqual({
        url: 'https://api.canton.network',
      })
      expect(config.tokenRefreshBufferSeconds).toBe(600)
      expect(config.priorityToken).toEqual({
        createdBy: 'custom',
        maxUses: 10,
        ttlHours: 24,
      })
    })
  })

  describe('Suite 5: Edge Cases', () => {
    it('treats empty strings as invalid (does not fall back to defaults)', () => {
      process.env.CANTON_KEYCLOAK_URL = ''

      // Empty string is invalid and should throw
      expect(() => getCantonConfig()).toThrow()
    })

    it('handles uppercase TRUE for boolean flag', () => {
      process.env.ENABLE_CANTON_WALLET_INTEGRATION = 'TRUE'
      const config = getCantonConfig()
      expect(config.enabled).toBe(true)
    })

    it('handles whitespace in boolean flag', () => {
      process.env.ENABLE_CANTON_WALLET_INTEGRATION = '  true  '
      const config = getCantonConfig()
      expect(config.enabled).toBe(true)
    })
  })

  describe('Suite 6: Priority Token Configuration', () => {
    it('uses default priority token settings when env vars not set', () => {
      const config = getCantonConfig()
      expect(config.priorityToken).toEqual({
        createdBy: 'sendapp-api',
        maxUses: 1,
        ttlHours: 72,
      })
    })

    it('overrides createdBy from env var', () => {
      process.env.CANTON_PRIORITY_TOKEN_CREATED_BY = 'custom-service'
      const config = getCantonConfig()
      expect(config.priorityToken.createdBy).toBe('custom-service')
    })

    it('overrides maxUses from env var', () => {
      process.env.CANTON_PRIORITY_TOKEN_MAX_USES = '5'
      const config = getCantonConfig()
      expect(config.priorityToken.maxUses).toBe(5)
    })

    it('overrides ttlHours from env var', () => {
      process.env.CANTON_PRIORITY_TOKEN_TTL_HOURS = '48'
      const config = getCantonConfig()
      expect(config.priorityToken.ttlHours).toBe(48)
    })

    it('overrides all priority token settings from env vars', () => {
      process.env.CANTON_PRIORITY_TOKEN_CREATED_BY = 'test-service'
      process.env.CANTON_PRIORITY_TOKEN_MAX_USES = '10'
      process.env.CANTON_PRIORITY_TOKEN_TTL_HOURS = '24'
      const config = getCantonConfig()
      expect(config.priorityToken).toEqual({
        createdBy: 'test-service',
        maxUses: 10,
        ttlHours: 24,
      })
    })

    it('throws error when maxUses is not a positive number', () => {
      process.env.CANTON_PRIORITY_TOKEN_MAX_USES = '0'
      expect(() => getCantonConfig()).toThrow()
    })

    it('throws error when maxUses is negative', () => {
      process.env.CANTON_PRIORITY_TOKEN_MAX_USES = '-1'
      expect(() => getCantonConfig()).toThrow()
    })

    it('throws error when maxUses is not a valid number', () => {
      process.env.CANTON_PRIORITY_TOKEN_MAX_USES = 'not-a-number'
      expect(() => getCantonConfig()).toThrow()
    })

    it('throws error when ttlHours is not a positive number', () => {
      process.env.CANTON_PRIORITY_TOKEN_TTL_HOURS = '0'
      expect(() => getCantonConfig()).toThrow()
    })

    it('throws error when ttlHours is negative', () => {
      process.env.CANTON_PRIORITY_TOKEN_TTL_HOURS = '-24'
      expect(() => getCantonConfig()).toThrow()
    })

    it('throws error when createdBy is empty string', () => {
      process.env.CANTON_PRIORITY_TOKEN_CREATED_BY = ''
      expect(() => getCantonConfig()).toThrow()
    })
  })
})
