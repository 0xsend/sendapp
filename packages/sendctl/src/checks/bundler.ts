import type { CheckResult, HttpCheckConfig } from '../types.js'

/** Expected chain ID for localnet (Base Localhost: 845337 = 0xce619) */
const EXPECTED_CHAIN_ID = '0xce619'

/**
 * Check AA Bundler health
 * Endpoint: POST /rpc with eth_chainId JSON-RPC
 * Success: Valid JSON-RPC response with chain ID matching 0x14a34
 */
export async function checkBundler(config: HttpCheckConfig): Promise<CheckResult> {
  const start = Date.now()

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), config.timeout)

    // Use URL as-is (bundler URL may already include /rpc path)
    const response = await fetch(config.url, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_chainId',
        params: [],
      }),
    })

    clearTimeout(timeoutId)
    const duration_ms = Date.now() - start

    if (!response.ok) {
      return {
        status: 'failed',
        duration_ms,
        error: `HTTP ${response.status}`,
      }
    }

    const data = (await response.json()) as { result?: string; error?: { message: string } }

    if (data.error) {
      return {
        status: 'failed',
        duration_ms,
        error: `JSON-RPC error: ${data.error.message}`,
      }
    }

    if (data.result !== EXPECTED_CHAIN_ID) {
      return {
        status: 'failed',
        duration_ms,
        error: `Chain ID mismatch: expected ${EXPECTED_CHAIN_ID}, got ${data.result}`,
      }
    }

    return { status: 'ok', duration_ms }
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
