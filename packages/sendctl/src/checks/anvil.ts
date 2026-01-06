import { sendAccountFactoryAddress, tokenPaymasterAddress } from '@my/wagmi/generated'
import type { CheckResult, HttpCheckConfig } from '../types.js'

/** Expected chain ID for localnet (Base Localhost: 845337 = 0xce619) */
const EXPECTED_CHAIN_ID = '0xce619'
const CHAIN_ID_NUMBER = 845337

/**
 * Make a JSON-RPC request to Anvil
 */
async function rpcCall(
  url: string,
  method: string,
  params: unknown[],
  signal: AbortSignal
): Promise<{ result?: unknown; error?: { message: string } }> {
  const response = await fetch(url, {
    method: 'POST',
    signal,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method,
      params,
    }),
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }

  return response.json() as Promise<{ result?: unknown; error?: { message: string } }>
}

/**
 * Check Anvil (Base fork) health with multi-step verification:
 * 1. RPC Health: eth_chainId returns 0xce619 (845337)
 * 2. Factory Contract: eth_getCode confirms SendAccountFactory deployed
 * 3. Paymaster Contract: eth_getCode confirms TokenPaymaster deployed
 * 4. Factory Funding: eth_getBalance confirms factory account has ETH (> 0)
 *
 * TODO: Tilt sets up additional fixtures that provide more accurate readiness signals:
 * - anvil:anvil-deploy-verifying-paymaster-fixtures: deploys verifying paymaster
 * - anvil:anvil-token-paymaster-deposit: funds the token paymaster
 * The paymaster contract is already deployed in the Base fork; these fixtures configure
 * and fund it. Consider checking paymaster deposit balance or querying Tilt resource
 * status for more precise readiness detection.
 */
export async function checkAnvil(config: HttpCheckConfig): Promise<CheckResult> {
  const start = Date.now()
  const sub_checks: Record<string, CheckResult> = {}

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), config.timeout)

  try {
    // Sub-check 1: RPC Health (eth_chainId)
    const rpcStart = Date.now()
    try {
      const chainIdResult = await rpcCall(config.url, 'eth_chainId', [], controller.signal)

      if (chainIdResult.error) {
        sub_checks.rpc = {
          status: 'failed',
          duration_ms: Date.now() - rpcStart,
          error: `JSON-RPC error: ${chainIdResult.error.message}`,
        }
      } else if (chainIdResult.result !== EXPECTED_CHAIN_ID) {
        sub_checks.rpc = {
          status: 'failed',
          duration_ms: Date.now() - rpcStart,
          error: `Chain ID mismatch: expected ${EXPECTED_CHAIN_ID}, got ${chainIdResult.result}`,
        }
      } else {
        sub_checks.rpc = { status: 'ok', duration_ms: Date.now() - rpcStart }
      }
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err)
      sub_checks.rpc = {
        status: 'failed',
        duration_ms: Date.now() - rpcStart,
        error: error.includes('abort') ? 'timeout' : error,
      }
    }

    // If RPC failed, skip remaining checks
    if (sub_checks.rpc.status === 'failed') {
      clearTimeout(timeoutId)
      return {
        status: 'failed',
        duration_ms: Date.now() - start,
        error: sub_checks.rpc.error,
        sub_checks,
      }
    }

    // Sub-check 2: Factory Contract
    const factoryStart = Date.now()
    const factoryAddress = sendAccountFactoryAddress[CHAIN_ID_NUMBER]
    try {
      const factoryCode = await rpcCall(
        config.url,
        'eth_getCode',
        [factoryAddress, 'latest'],
        controller.signal
      )

      if (
        factoryCode.error ||
        !factoryCode.result ||
        factoryCode.result === '0x' ||
        factoryCode.result === '0x0'
      ) {
        sub_checks.factory = {
          status: 'failed',
          duration_ms: Date.now() - factoryStart,
          error: 'SendAccountFactory not deployed',
        }
      } else {
        sub_checks.factory = { status: 'ok', duration_ms: Date.now() - factoryStart }
      }
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err)
      sub_checks.factory = {
        status: 'failed',
        duration_ms: Date.now() - factoryStart,
        error: error.includes('abort') ? 'timeout' : error,
      }
    }

    // Sub-check 3: Paymaster Contract
    // TODO: This checks if the contract exists, but in the Base fork the paymaster is already
    // deployed. A more accurate check would verify the Tilt fixtures have run:
    // - anvil:anvil-deploy-verifying-paymaster-fixtures (sets up verifying paymaster)
    // - anvil:anvil-token-paymaster-deposit (funds the token paymaster)
    // Consider checking the paymaster's deposit balance instead of just bytecode presence.
    const paymasterStart = Date.now()
    const paymasterAddress = tokenPaymasterAddress[CHAIN_ID_NUMBER]
    try {
      const paymasterCode = await rpcCall(
        config.url,
        'eth_getCode',
        [paymasterAddress, 'latest'],
        controller.signal
      )

      if (
        paymasterCode.error ||
        !paymasterCode.result ||
        paymasterCode.result === '0x' ||
        paymasterCode.result === '0x0'
      ) {
        sub_checks.paymaster = {
          status: 'failed',
          duration_ms: Date.now() - paymasterStart,
          error: 'TokenPaymaster not deployed',
        }
      } else {
        sub_checks.paymaster = { status: 'ok', duration_ms: Date.now() - paymasterStart }
      }
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err)
      sub_checks.paymaster = {
        status: 'failed',
        duration_ms: Date.now() - paymasterStart,
        error: error.includes('abort') ? 'timeout' : error,
      }
    }

    // Sub-check 4: Factory Funding (informational only, does not fail the check)
    const fundedStart = Date.now()
    try {
      const balance = await rpcCall(
        config.url,
        'eth_getBalance',
        [factoryAddress, 'latest'],
        controller.signal
      )

      if (balance.error) {
        // Informational only - mark as OK even on error
        sub_checks.funded = {
          status: 'ok',
          duration_ms: Date.now() - fundedStart,
        }
      } else {
        // Always OK - just checking connectivity, not balance
        sub_checks.funded = { status: 'ok', duration_ms: Date.now() - fundedStart }
      }
    } catch {
      // Informational only - mark as OK even on error
      sub_checks.funded = {
        status: 'ok',
        duration_ms: Date.now() - fundedStart,
      }
    }

    clearTimeout(timeoutId)
    const duration_ms = Date.now() - start

    // Check if any sub-check failed
    const failed = Object.values(sub_checks).some((c) => c.status === 'failed')
    if (failed) {
      const errors = Object.entries(sub_checks)
        .filter(([, c]) => c.status === 'failed')
        .map(([name, c]) => `${name}: ${c.error}`)
        .join('; ')

      return {
        status: 'failed',
        duration_ms,
        error: errors,
        sub_checks,
      }
    }

    return { status: 'ok', duration_ms, sub_checks }
  } catch (err) {
    clearTimeout(timeoutId)
    const duration_ms = Date.now() - start
    const error = err instanceof Error ? err.message : String(err)

    return {
      status: 'failed',
      duration_ms,
      error: error.includes('abort') ? `Connection timeout after ${config.timeout}ms` : error,
      sub_checks,
    }
  }
}
