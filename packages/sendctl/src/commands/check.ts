import { runCheck } from '../checks/index.js'
import { ConfigError, getTimeout, loadEnvironment } from '../config.js'
import { formatSingleCheckHuman, formatSingleCheckJson } from '../output.js'
import { SERVICE_NAMES, type ServiceName, type SingleCheckResult } from '../types.js'

export interface CheckOptions {
  json?: boolean
  timeout?: number
}

/**
 * Validate service name
 */
function isValidService(service: string): service is ServiceName {
  return SERVICE_NAMES.includes(service as ServiceName)
}

/**
 * Run check command for a single service
 */
export async function check(service: string, options: CheckOptions): Promise<void> {
  // Validate service name
  if (!isValidService(service)) {
    if (options.json) {
      console.log(
        JSON.stringify({
          error: `Invalid service: ${service}. Available: ${SERVICE_NAMES.join(', ')}`,
          type: 'config_error',
        })
      )
    } else {
      console.error(`Invalid service: ${service}`)
      console.error(`Available services: ${SERVICE_NAMES.join(', ')}`)
    }
    process.exit(2)
  }

  const timeout = getTimeout(options.timeout)
  const env = loadEnvironment(timeout)

  let checkResult: Awaited<ReturnType<typeof runCheck>>
  try {
    checkResult = await runCheck(service, env)
  } catch (err) {
    // ConfigError from service checks (e.g., missing SUPABASE_ANON_KEY) -> exit 2
    if (err instanceof ConfigError) {
      if (options.json) {
        console.log(JSON.stringify({ error: err.message, type: 'config_error' }))
      } else {
        console.error(`Configuration error: ${err.message}`)
      }
      process.exit(2)
    }
    throw err
  }

  const result: SingleCheckResult = {
    service,
    ...checkResult,
  }

  if (options.json) {
    console.log(formatSingleCheckJson(result))
  } else {
    console.log(formatSingleCheckHuman(result))
  }

  if (result.status === 'ok') {
    process.exit(0)
  } else {
    process.exit(1)
  }
}
