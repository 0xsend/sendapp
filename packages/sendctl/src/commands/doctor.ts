import { CHECK_ORDER, runCheck } from '../checks/index.js'
import { ConfigError, getTimeout, loadEnvironment } from '../config.js'
import { formatDoctorHuman, formatDoctorJson } from '../output.js'
import type { CheckResult, DoctorResult } from '../types.js'

/** Interval between retry attempts in wait mode (ms) */
const WAIT_INTERVAL = 2000

export interface DoctorOptions {
  json?: boolean
  timeout?: number
  wait?: boolean
  maxRetries?: number
}

/**
 * Run all service checks once
 */
async function runAllChecks(timeout: number): Promise<DoctorResult> {
  const start = Date.now()
  const checks: Record<string, CheckResult> = {}
  let anvilFailed = false

  const env = loadEnvironment(timeout)

  for (const service of CHECK_ORDER) {
    // Skip bundler if anvil failed (dependency)
    if (service === 'bundler' && anvilFailed) {
      checks.bundler = {
        status: 'skipped',
        duration_ms: 0,
        reason: 'depends on anvil',
      }
      continue
    }

    const result = await runCheck(service, env)
    checks[service] = result

    if (service === 'anvil' && result.status === 'failed') {
      anvilFailed = true
    }
  }

  const duration_ms = Date.now() - start
  const success = Object.values(checks).every((c) => c.status === 'ok')

  return { success, duration_ms, checks }
}

/**
 * Run doctor command
 */
export async function doctor(options: DoctorOptions): Promise<void> {
  const timeout = getTimeout(options.timeout)
  const maxRetries = options.maxRetries ?? 30

  let attempt = 0

  while (true) {
    attempt++

    if (options.wait && attempt > 1) {
      // Progress message to stderr (allows piping JSON)
      process.stderr.write(`Waiting for services... (attempt ${attempt}/${maxRetries})\n`)
    }

    let result: DoctorResult

    try {
      result = await runAllChecks(timeout)
    } catch (err) {
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

    // If success or not in wait mode, output and exit
    if (result.success || !options.wait) {
      if (options.json) {
        console.log(formatDoctorJson(result))
      } else {
        console.log(formatDoctorHuman(result))
      }

      process.exit(result.success ? 0 : 1)
    }

    // Check if we've exceeded max retries
    if (attempt >= maxRetries) {
      if (options.json) {
        console.log(formatDoctorJson(result))
      } else {
        console.log(formatDoctorHuman(result))
      }
      process.exit(1)
    }

    // Wait before next attempt
    await new Promise((resolve) => setTimeout(resolve, WAIT_INTERVAL))
  }
}
