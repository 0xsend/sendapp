/**
 * Canton Wallet Priority Token Eligibility Types
 *
 * This module defines types and constants for checking Canton Wallet priority token eligibility.
 * Eligibility is determined by three server-side checks at a specific snapshot block.
 */

/**
 * Snapshot configuration for Canton Wallet priority token eligibility checks
 */
export const CANTON_SNAPSHOT_CONFIG = {
  /**
   * Block number at which eligibility is evaluated
   * All balance and state checks occur at this block
   */
  SNAPSHOT_BLOCK: 22524265n,

  /**
   * Minimum SEND token balance required for eligibility
   * User must hold at least this amount at snapshot block
   */
  MIN_SEND_BALANCE: process.env.NODE_ENV === 'production' ? 3000n * 10n ** 18n : 100n * 10n ** 18n, // 3,000 SEND (prod), 100 SEND (dev)

  /**
   * Minimum Send Earn USDC balance required for eligibility
   * Sum of all vault balances must be at least this amount at snapshot block
   */
  MIN_EARN_BALANCE_USDC: process.env.NODE_ENV === 'production' ? 2000n * 10n ** 6n : 5n * 10n ** 6n, // $2,000 USDC (prod), $5 USDC (dev)
} as const

/**
 * Individual eligibility check result
 */
export interface EligibilityCheck {
  /** Whether this specific check passed */
  eligible: boolean
  /** Human-readable reason for the result */
  reason: string
  /** Additional metadata about the check (e.g., actual balance, required balance) */
  metadata?: Record<string, unknown>
}

/**
 * Complete eligibility evaluation result
 */
export interface EligibilityResult {
  /** Whether user is eligible for Canton Wallet priority tokens */
  eligible: boolean
  /** Timestamp when eligibility was checked (ISO 8601 format) */
  checkedAt: string
  /** Results from individual eligibility checks */
  checks: {
    /** SendTag ownership check */
    hasTag: EligibilityCheck
    /** Send Earn balance check (at snapshot block) */
    hasEarnBalance: EligibilityCheck
    /** SEND token balance check (at snapshot block) */
    hasSendBalance: EligibilityCheck
  }
  /** Distribution used for eligibility checks */
  distribution?: {
    id: number
    number: number
    name: string
    snapshot_block_num: string
  }
}

/**
 * OAuth2 token response from Keycloak
 */
export interface OAuth2TokenResponse {
  access_token: string
  expires_in: number
  refresh_expires_in: number
  token_type: string
  'not-before-policy': number
  scope: string
}

/**
 * Cached token with expiry metadata
 */
export interface CachedToken {
  accessToken: string
  expiresAt: number
}

/**
 * Canton priority token from API
 * Mirrors the Canton API Gateway PriorityTokenRecord schema
 */
export interface CantonPriorityToken {
  /** UUID identifier for the token record */
  id: string
  /** UUID token value used for authentication */
  token: string
  /** Human-readable label for the token */
  label: string
  /** Unix timestamp (milliseconds) when token was created */
  createdAt: number
  /** Identifier of who created the token (e.g., 'sendapp-api') */
  createdBy: string
  /** Unix timestamp (milliseconds) when token expires (optional) */
  expiresAt?: number
  /** Whether the token has been revoked */
  isRevoked: boolean
  /** Number of times the token has been used */
  usageCount: number
  /** Unix timestamp (milliseconds) when token was last used (optional) */
  lastUsedAt?: number
  /** Maximum number of times the token can be used (optional) */
  maxUses?: number
  /** Additional metadata (optional) */
  metadata?: Record<string, unknown>
}

/**
 * Canton priority token create request
 */
export interface CreatePriorityTokenRequest {
  /** Human-readable label for the token */
  label: string
  /** Identifier of who created the token */
  createdBy: string
  /** Maximum number of times the token can be used (optional) */
  maxUses?: number
  /** Unix timestamp (milliseconds) when token expires (optional) */
  expiresAt?: number
  /** Additional metadata (optional) */
  metadata?: Record<string, unknown>
}

/**
 * Canton priority token list response
 */
export interface PriorityTokenListResponse {
  tokens: CantonPriorityToken[]
}
