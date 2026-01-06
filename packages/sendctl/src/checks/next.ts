import type { CheckResult, HttpCheckConfig } from '../types.js'

/**
 * Check Next.js app health
 * Endpoint: GET /api/healthz
 * Success: HTTP 200
 */
export async function checkNext(config: HttpCheckConfig): Promise<CheckResult> {
  const start = Date.now()

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), config.timeout)

    const response = await fetch(`${config.url}/api/healthz`, {
      signal: controller.signal,
    })

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
