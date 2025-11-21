import { getRequiredCantonConfig } from '../../utils/canton-config'
import type { OAuth2TokenResponse, CachedToken } from './types'

/**
 * Manages JWT token lifecycle for Canton Wallet API
 *
 * Features:
 * - Singleton pattern with in-memory cache
 * - OAuth2 client credentials flow with Keycloak
 * - Auto-refresh 5 min before expiry (configurable)
 * - Thread-safe concurrent request deduplication
 */
export class CantonTokenManager {
  private static instance: CantonTokenManager | null = null
  private static currentTokenPromise: Promise<string> | null = null

  private cachedToken: CachedToken | null = null
  private readonly keycloakUrl: string
  private readonly realm: string
  private readonly clientId: string
  private readonly clientSecret: string
  private readonly refreshBufferSeconds: number

  private constructor() {
    const config = getRequiredCantonConfig()

    if (!config.keycloak || !config.api) {
      throw new Error('Canton integration is not enabled')
    }

    this.keycloakUrl = config.keycloak.url
    this.realm = config.keycloak.realm
    this.clientId = config.keycloak.clientId
    this.clientSecret = config.keycloak.clientSecret
    this.refreshBufferSeconds = config.tokenRefreshBufferSeconds
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): CantonTokenManager {
    if (!CantonTokenManager.instance) {
      CantonTokenManager.instance = new CantonTokenManager()
    }
    return CantonTokenManager.instance
  }

  /**
   * Get valid JWT token (from cache or fetch new)
   */
  public async getToken(): Promise<string> {
    // Fast path: return cached token if still valid
    if (this.cachedToken && this.isTokenValid(this.cachedToken)) {
      return this.cachedToken.accessToken
    }

    // Deduplicate concurrent requests
    if (CantonTokenManager.currentTokenPromise) {
      return CantonTokenManager.currentTokenPromise
    }

    // Fetch new token
    CantonTokenManager.currentTokenPromise = this.fetchToken()

    try {
      const token = await CantonTokenManager.currentTokenPromise
      return token
    } finally {
      CantonTokenManager.currentTokenPromise = null
    }
  }

  /**
   * Force refresh token (bypass cache)
   */
  public async forceRefresh(): Promise<string> {
    // Clear cache
    this.cachedToken = null

    // Deduplicate concurrent refresh requests
    if (CantonTokenManager.currentTokenPromise) {
      return CantonTokenManager.currentTokenPromise
    }

    CantonTokenManager.currentTokenPromise = this.fetchToken()

    try {
      const token = await CantonTokenManager.currentTokenPromise
      return token
    } finally {
      CantonTokenManager.currentTokenPromise = null
    }
  }

  /**
   * Clear cached token
   */
  public clearCache(): void {
    this.cachedToken = null
  }

  /**
   * Test helper: Reset singleton instance and all state
   * Should only be used in test environments
   */
  public static resetForTesting(): void {
    CantonTokenManager.instance = null
    CantonTokenManager.currentTokenPromise = null
  }

  /**
   * Test helper: Get cached token for inspection
   * Should only be used in test environments
   */
  public getCachedTokenForTesting(): CachedToken | null {
    return this.cachedToken
  }

  /**
   * Check if token is still valid
   */
  private isTokenValid(token: CachedToken): boolean {
    return Date.now() < token.expiresAt
  }

  /**
   * Fetch new token from Keycloak
   */
  private async fetchToken(): Promise<string> {
    const tokenUrl = `${this.keycloakUrl}/realms/${this.realm}/protocol/openid-connect/token`

    const params = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: this.clientId,
      client_secret: this.clientSecret,
    })

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch Canton token: ${response.status} ${response.statusText}`)
    }

    const data = (await response.json()) as OAuth2TokenResponse

    // Validate response
    if (!data.access_token || typeof data.access_token !== 'string') {
      throw new Error('Invalid token response: missing access_token')
    }

    if (typeof data.expires_in !== 'number') {
      throw new Error('Invalid token response: missing or invalid expires_in')
    }

    // Calculate expiry with buffer
    const expiresInMs = data.expires_in * 1000
    const bufferMs = this.refreshBufferSeconds * 1000
    const expiresAt = Date.now() + expiresInMs - bufferMs

    // Cache token
    this.cachedToken = {
      accessToken: data.access_token,
      expiresAt,
    }

    return data.access_token
  }
}
