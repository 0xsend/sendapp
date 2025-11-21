import { getRequiredCantonConfig } from '../../utils/canton-config'
import { CantonTokenManager } from './token-manager'
import type {
  CantonPriorityToken,
  CreatePriorityTokenRequest,
  PriorityTokenListResponse,
} from './types'

/**
 * Canton Wallet API client with query-first idempotency
 *
 * Features:
 * - Query-first pattern: GET list, search for match, POST if not found
 * - Auto-inject JWT via Token Manager
 * - Retry once on 401 with token refresh
 * - Invite URL builder for Canton Wallet onboarding
 */
export class CantonAPIClient {
  private static instance: CantonAPIClient | null = null

  private readonly apiUrl: string
  private readonly tokenManager: CantonTokenManager

  private constructor() {
    const config = getRequiredCantonConfig()

    if (!config.api) {
      throw new Error('Canton integration is not enabled')
    }

    this.apiUrl = config.api.url
    this.tokenManager = CantonTokenManager.getInstance()
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): CantonAPIClient {
    if (!CantonAPIClient.instance) {
      CantonAPIClient.instance = new CantonAPIClient()
    }
    return CantonAPIClient.instance
  }

  /**
   * Test helper: Reset singleton instance
   * Should only be used in test environments
   */
  public static resetForTesting(): void {
    CantonAPIClient.instance = null
  }

  /**
   * Ensure priority token exists (query-first idempotency)
   *
   * Algorithm:
   * 1. GET /api/queue/admin/priority-tokens (list all)
   * 2. Search for token with matching label
   * 3. If found, return existing token
   * 4. If not found, POST /api/queue/admin/priority-tokens
   * 5. Return new token
   *
   * @param label - Unique label for the priority token
   * @returns Priority token string
   */
  public async ensurePriorityToken(label: string): Promise<string> {
    const result = await this.ensurePriorityTokenWithStatus(label)
    return result.token
  }

  /**
   * Ensure priority token exists with status tracking
   *
   * Algorithm:
   * 1. GET /api/queue/admin/priority-tokens (list all)
   * 2. Search for usable token with matching label:
   *    - Label matches
   *    - Not revoked
   *    - Usage count < maxUses (or maxUses undefined)
   * 3. If found, return existing token with isNew=false
   * 4. If not found, POST /api/queue/admin/priority-tokens with:
   *    - Label
   *    - createdBy from config
   *    - maxUses=1 (single-use)
   *    - expiresAt based on TTL
   *    - metadata with source info
   * 5. Return new token with isNew=true
   *
   * @param label - Unique label for the priority token
   * @param metadata - Optional metadata to attach to the token
   * @returns Object with token string and isNew flag
   */
  public async ensurePriorityTokenWithStatus(
    label: string,
    metadata?: Record<string, unknown>
  ): Promise<{ token: string; isNew: boolean }> {
    const config = getRequiredCantonConfig()

    // Step 1: Query for existing tokens
    const existingTokens = await this.listPriorityTokens()

    // Step 2: Search for usable token with matching label
    const existing = existingTokens.find((t) => {
      // Label must match (case-sensitive)
      if (t.label !== label) return false

      // Token must not be revoked
      if (t.isRevoked) return false

      // Token must not be exhausted
      // If maxUses is undefined, token has unlimited uses
      if (t.maxUses !== undefined && t.usageCount >= t.maxUses) return false

      return true
    })

    // Step 3: Return existing if found
    if (existing) {
      return { token: existing.token, isNew: false }
    }

    // Step 4: Create new token with single-use config
    const expiresAt =
      typeof config.priorityToken.ttlHours === 'number'
        ? Date.now() + config.priorityToken.ttlHours * 60 * 60 * 1000
        : undefined

    const newToken = await this.createPriorityToken({
      label,
      createdBy: config.priorityToken.createdBy,
      maxUses: config.priorityToken.maxUses,
      ...(expiresAt ? { expiresAt } : {}),
      metadata: {
        source: 'send-app',
        ...metadata,
      },
    })

    // Step 5: Return new token
    return { token: newToken.token, isNew: true }
  }

  /**
   * Build invite URL for Canton Wallet onboarding.
   * Mobile clients only attempt to open https URLs, so keep this in lockstep
   * with the app expectation (`https://cantonwallet.com/auth/create-account`).
   *
   * @param token - Priority token
   * @returns HTTPS URL to cantonwallet.com
   */
  public buildDeepLink(token: string): string {
    const url = new URL('https://cantonwallet.com/auth/create-account')
    url.searchParams.set('priorityToken', token)
    return url.toString()
  }

  /**
   * List all priority tokens
   */
  private async listPriorityTokens(): Promise<CantonPriorityToken[]> {
    const response = await this.fetchWithAuth(`${this.apiUrl}/queue/admin/priority-tokens`, {
      method: 'GET',
    })

    const data = (await response.json()) as PriorityTokenListResponse

    // Validate response
    if (!Array.isArray(data.tokens)) {
      throw new Error('Invalid priority tokens list response: missing or invalid tokens array')
    }

    return data.tokens
  }

  /**
   * Create new priority token
   */
  private async createPriorityToken(
    request: CreatePriorityTokenRequest
  ): Promise<CantonPriorityToken> {
    const response = await this.fetchWithAuth(`${this.apiUrl}/queue/admin/priority-tokens`, {
      method: 'POST',
      body: JSON.stringify(request),
    })

    const data = (await response.json()) as CantonPriorityToken

    // Validate response
    if (!data.token || typeof data.token !== 'string') {
      throw new Error('Invalid priority token response: missing or invalid token field')
    }

    return data
  }

  /**
   * Fetch with automatic JWT injection and 401 retry
   */
  private async fetchWithAuth(url: string, init: RequestInit): Promise<Response> {
    // Get JWT token
    let token = await this.tokenManager.getToken()

    // Add auth header
    const headers = {
      ...init.headers,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    }

    // First attempt
    let response = await fetch(url, {
      ...init,
      headers,
    })

    // Retry once on 401
    if (response.status === 401) {
      // Refresh token
      token = await this.tokenManager.forceRefresh()

      // Update auth header
      headers.Authorization = `Bearer ${token}`

      // Retry request
      response = await fetch(url, {
        ...init,
        headers,
      })
    }

    // Check response
    if (!response.ok) {
      throw new Error(`Canton API error: ${response.status} ${response.statusText}`)
    }

    return response
  }
}
