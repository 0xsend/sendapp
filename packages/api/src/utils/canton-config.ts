import { z } from 'zod'

/**
 * Canton Wallet integration configuration
 */
export interface CantonConfig {
  enabled: boolean
  keycloak: {
    url: string
    realm: string
    clientId: string
    clientSecret: string
  }
  api: {
    url: string
  }
  tokenRefreshBufferSeconds: number
  priorityToken: {
    createdBy: string
    maxUses: number
    ttlHours?: number
  }
}

/**
 * Localnet defaults for Canton Wallet integration.
 * These allow developers to run the app without setting any environment variables.
 *
 * For testnet/mainnet deployments, override these with appropriate values:
 * - CANTON_KEYCLOAK_URL
 * - CANTON_KEYCLOAK_REALM
 * - CANTON_SERVICE_ACCOUNT_CLIENT_ID
 * - CANTON_SERVICE_ACCOUNT_CLIENT_SECRET
 * - CANTON_API_URL
 * - CANTON_PRIORITY_TOKEN_CREATED_BY
 * - CANTON_PRIORITY_TOKEN_MAX_USES
 * - CANTON_PRIORITY_TOKEN_TTL_HOURS
 */
const LOCALNET_DEFAULTS = {
  KEYCLOAK_URL: 'http://localhost:8880',
  KEYCLOAK_REALM: 'localnet',
  SERVICE_ACCOUNT_CLIENT_ID: 'sendapp-api',
  SERVICE_ACCOUNT_CLIENT_SECRET: 'sendapp-api-secret',
  API_URL: 'http://localhost:8787/api',
  TOKEN_REFRESH_BUFFER_SECONDS: 300,
  PRIORITY_TOKEN_CREATED_BY: 'sendapp-api',
  PRIORITY_TOKEN_MAX_USES: 1,
  PRIORITY_TOKEN_TTL_HOURS: undefined,
} as const

/**
 * Schema for Canton API Gateway configuration with localnet defaults.
 * Developers running localnet do not need to set any environment variables.
 */
const CantonApiGatewayConfigSchema = z.object({
  keycloak: z.object({
    url: z.string().url().default(LOCALNET_DEFAULTS.KEYCLOAK_URL),
    realm: z.string().min(1).default(LOCALNET_DEFAULTS.KEYCLOAK_REALM),
    clientId: z.string().min(1).default(LOCALNET_DEFAULTS.SERVICE_ACCOUNT_CLIENT_ID),
    clientSecret: z.string().min(1).default(LOCALNET_DEFAULTS.SERVICE_ACCOUNT_CLIENT_SECRET),
  }),
  api: z.object({
    url: z.string().url().default(LOCALNET_DEFAULTS.API_URL),
  }),
  tokenRefreshBufferSeconds: z
    .number()
    .int()
    .nonnegative()
    .default(LOCALNET_DEFAULTS.TOKEN_REFRESH_BUFFER_SECONDS),
  priorityToken: z.object({
    createdBy: z.string().min(1).default(LOCALNET_DEFAULTS.PRIORITY_TOKEN_CREATED_BY),
    maxUses: z.number().int().positive().default(LOCALNET_DEFAULTS.PRIORITY_TOKEN_MAX_USES),
    ttlHours: z.number().int().positive().optional(),
  }),
})

export type CantonApiGatewayConfig = z.infer<typeof CantonApiGatewayConfigSchema>

/**
 * Parse a boolean from an environment variable
 */
function parseBoolean(value: string | undefined): boolean {
  if (!value) return false
  const trimmed = value.trim().toLowerCase()
  return trimmed === 'true'
}

/**
 * Parse a number from an environment variable
 */
function parseNumber(value: string | undefined, defaultValue: number): number {
  if (!value) return defaultValue
  const parsed = Number.parseInt(value, 10)
  if (Number.isNaN(parsed)) {
    throw new Error(`Invalid number value: ${value}`)
  }
  return parsed
}

/**
 * Create Canton API Gateway configuration from environment variables.
 * Uses localnet defaults if environment variables are not set.
 *
 * @returns Canton API Gateway configuration
 *
 * @example
 * // Uses localnet defaults (no env vars needed)
 * const config = createCantonApiGatewayConfig()
 *
 * @example
 * // Override for production
 * process.env.CANTON_KEYCLOAK_URL = 'https://auth.canton.network'
 * process.env.CANTON_KEYCLOAK_REALM = 'canton-production'
 * const config = createCantonApiGatewayConfig()
 */
export function createCantonApiGatewayConfig(): CantonApiGatewayConfig {
  return CantonApiGatewayConfigSchema.parse({
    keycloak: {
      url: process.env.CANTON_KEYCLOAK_URL,
      realm: process.env.CANTON_KEYCLOAK_REALM,
      clientId: process.env.CANTON_SERVICE_ACCOUNT_CLIENT_ID,
      clientSecret: process.env.CANTON_SERVICE_ACCOUNT_CLIENT_SECRET,
    },
    api: {
      url: process.env.CANTON_API_URL,
    },
    tokenRefreshBufferSeconds: process.env.CANTON_TOKEN_REFRESH_BUFFER_SECONDS
      ? parseNumber(
          process.env.CANTON_TOKEN_REFRESH_BUFFER_SECONDS,
          LOCALNET_DEFAULTS.TOKEN_REFRESH_BUFFER_SECONDS
        )
      : undefined,
    priorityToken: {
      createdBy: process.env.CANTON_PRIORITY_TOKEN_CREATED_BY,
      maxUses: process.env.CANTON_PRIORITY_TOKEN_MAX_USES
        ? parseNumber(
            process.env.CANTON_PRIORITY_TOKEN_MAX_USES,
            LOCALNET_DEFAULTS.PRIORITY_TOKEN_MAX_USES
          )
        : undefined,
      ttlHours: process.env.CANTON_PRIORITY_TOKEN_TTL_HOURS
        ? parseNumber(process.env.CANTON_PRIORITY_TOKEN_TTL_HOURS, 1)
        : undefined,
    },
  })
}

/**
 * Get Canton configuration from environment variables.
 * Uses localnet defaults if ENABLE_CANTON_WALLET_INTEGRATION is not explicitly set to 'true'.
 *
 * @returns Canton configuration with enabled flag
 */
export function getCantonConfig(): CantonConfig {
  const enabled = parseBoolean(process.env.ENABLE_CANTON_WALLET_INTEGRATION)

  // Create config using localnet defaults
  const apiGatewayConfig = createCantonApiGatewayConfig()

  return {
    enabled,
    ...apiGatewayConfig,
  }
}

/**
 * Check if Canton integration is enabled and properly configured
 */
export function isCantonIntegrationEnabled(): boolean {
  try {
    const config = getCantonConfig()
    return config.enabled
  } catch {
    return false
  }
}

/**
 * Get Canton configuration, throwing error if not enabled
 */
export function getRequiredCantonConfig(): CantonConfig {
  const config = getCantonConfig()

  if (!config.enabled) {
    throw new Error('Canton integration is not enabled')
  }

  return config
}
