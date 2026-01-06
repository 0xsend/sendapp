import { ConfigError } from '../config.js'
import type { CheckResult, SupabaseCheckConfig } from '../types.js'

/**
 * Check Supabase API health
 * Endpoint: GET /rest/v1/
 * Headers: apikey, Authorization
 * Success: HTTP 200
 * Throws: ConfigError if NEXT_PUBLIC_SUPABASE_ANON_KEY is missing
 */
export async function checkSupabase(config: SupabaseCheckConfig): Promise<CheckResult> {
  const start = Date.now()

  // Check for required anonKey - this is a config error per spec (exit code 2)
  if (!config.anonKey) {
    throw new ConfigError('NEXT_PUBLIC_SUPABASE_ANON_KEY is required')
  }

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), config.timeout)

    const response = await fetch(`${config.url}/rest/v1/`, {
      signal: controller.signal,
      headers: {
        apikey: config.anonKey,
        Authorization: `Bearer ${config.anonKey}`,
      },
    })

    clearTimeout(timeoutId)
    const duration_ms = Date.now() - start

    if (response.ok) {
      return { status: 'ok', duration_ms }
    }

    if (response.status === 401 || response.status === 403) {
      return {
        status: 'failed',
        duration_ms,
        error: `Auth error: HTTP ${response.status}`,
      }
    }

    return {
      status: 'failed',
      duration_ms,
      error: `HTTP ${response.status}`,
    }
  } catch (err) {
    const duration_ms = Date.now() - start
    const error = err instanceof Error ? err.message : String(err)

    if (error.includes('abort')) {
      return {
        status: 'failed',
        duration_ms,
        error: `Connection timeout after ${config.timeout}ms`,
      }
    }

    return {
      status: 'failed',
      duration_ms,
      error,
    }
  }
}
