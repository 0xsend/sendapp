import type { CheckResult, HttpCheckConfig } from '../types.js'

/**
 * Check Shovel indexer health
 * Endpoint: GET /health (primary), fallback to GET / if 404
 * Success: HTTP 200
 */
export async function checkShovel(config: HttpCheckConfig): Promise<CheckResult> {
  const start = Date.now()

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), config.timeout)

    // Try /health first
    let response = await fetch(`${config.url}/health`, {
      signal: controller.signal,
    })

    // Fallback to / if /health returns 404
    if (response.status === 404) {
      response = await fetch(config.url, {
        signal: controller.signal,
      })
    }

    clearTimeout(timeoutId)
    const duration_ms = Date.now() - start

    if (response.ok) {
      return { status: 'ok', duration_ms }
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
