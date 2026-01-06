import type { Environment, SupabaseCheckConfig } from './types.js'

/**
 * Default timeout for health checks in milliseconds
 */
const DEFAULT_TIMEOUT = 10000

/**
 * Get the configured timeout from flag, env var, or default
 * Precedence: flag > SENDCTL_TIMEOUT env var > default (10000ms)
 */
export function getTimeout(flagValue?: number): number {
  if (flagValue !== undefined) {
    return flagValue
  }
  const envTimeout = process.env.SENDCTL_TIMEOUT
  if (envTimeout !== undefined) {
    const parsed = Number.parseInt(envTimeout, 10)
    if (!Number.isNaN(parsed) && parsed > 0) {
      return parsed
    }
  }
  return DEFAULT_TIMEOUT
}

/**
 * Configuration error thrown when required env vars are missing
 */
export class ConfigError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ConfigError'
  }
}

/**
 * Load environment configuration from env vars
 * Throws ConfigError if required vars are missing
 */
export function loadEnvironment(timeout: number): Environment {
  // anonKey is optional here - the supabase check validates it when needed
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  const supabase: SupabaseCheckConfig = {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321',
    timeout,
    anonKey,
  }

  // Shovel URL: prefer SHOVEL_URL, fall back to constructing from SHOVEL_PORT
  const shovelUrl =
    process.env.SHOVEL_URL ||
    (process.env.SHOVEL_PORT
      ? `http://localhost:${process.env.SHOVEL_PORT}`
      : 'http://localhost:8383')

  return {
    next: {
      url: process.env.NEXT_PUBLIC_URL || 'http://localhost:3000',
      timeout,
    },
    supabase,
    anvil: {
      url: process.env.NEXT_PUBLIC_BASE_RPC_URL || 'http://localhost:8546',
      timeout,
    },
    bundler: {
      url: process.env.NEXT_PUBLIC_BUNDLER_RPC_URL || 'http://localhost:4337',
      timeout,
    },
    shovel: {
      url: shovelUrl,
      timeout,
    },
    temporal: {
      address: process.env.TEMPORAL_ADDR || 'localhost:7233',
      timeout,
    },
  }
}
