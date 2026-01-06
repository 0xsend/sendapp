import type { CheckResult, DoctorResult, SingleCheckResult } from './types.js'

/**
 * Format duration for display
 */
function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`
  }
  return `${(ms / 1000).toFixed(1)}s`
}

/**
 * Get status symbol for human output
 */
function getStatusSymbol(status: string): string {
  switch (status) {
    case 'ok':
      return '✓'
    case 'failed':
      return '✗'
    case 'skipped':
      return '-'
    default:
      return '?'
  }
}

/**
 * Get status text for human output
 */
function getStatusText(status: string): string {
  switch (status) {
    case 'ok':
      return 'OK'
    case 'failed':
      return 'FAIL'
    case 'skipped':
      return 'SKIP'
    default:
      return status.toUpperCase()
  }
}

/**
 * Format a check result row for human output
 */
function formatCheckRow(name: string, result: CheckResult, indent = 0): string {
  const symbol = getStatusSymbol(result.status)
  const statusText = getStatusText(result.status)
  const time =
    result.status === 'skipped' && result.reason
      ? `(${result.reason})`
      : formatDuration(result.duration_ms)

  const prefix = indent > 0 ? '  '.repeat(indent) : ''
  const paddedName = name.padEnd(12 - indent * 2)

  return `${prefix}${paddedName}${symbol} ${statusText.padEnd(5)}${time}`
}

/**
 * Format sub-checks with tree-like structure
 */
function formatSubChecks(sub_checks: Record<string, CheckResult>): string[] {
  const entries = Object.entries(sub_checks)
  const lines: string[] = []

  entries.forEach(([name, result], index) => {
    const isLast = index === entries.length - 1
    const prefix = isLast ? '  └─ ' : '  ├─ '
    const symbol = getStatusSymbol(result.status)
    const statusText = getStatusText(result.status)
    const time =
      result.status === 'failed' && result.error ? result.error : formatDuration(result.duration_ms)

    lines.push(`${prefix}${name.padEnd(10)}${symbol} ${statusText.padEnd(5)}${time}`)
  })

  return lines
}

/**
 * Format doctor result for human output
 */
export function formatDoctorHuman(result: DoctorResult): string {
  const lines: string[] = []

  lines.push('Service     Status   Time')
  lines.push('─────────────────────────────')

  for (const [name, check] of Object.entries(result.checks)) {
    lines.push(formatCheckRow(name, check))

    if (check.sub_checks) {
      lines.push(...formatSubChecks(check.sub_checks))
    }
  }

  lines.push('')

  const failedCount = Object.values(result.checks).filter((c) => c.status === 'failed').length
  const skippedCount = Object.values(result.checks).filter((c) => c.status === 'skipped').length

  if (result.success) {
    lines.push(`All checks passed (${formatDuration(result.duration_ms)} total)`)
  } else {
    const parts: string[] = []
    if (failedCount > 0) parts.push(`${failedCount} check${failedCount > 1 ? 's' : ''} failed`)
    if (skippedCount > 0) parts.push(`${skippedCount} skipped`)
    lines.push(parts.join(', '))

    // Show failure details
    const failures = Object.entries(result.checks).filter(([, c]) => c.status === 'failed')
    if (failures.length > 0) {
      lines.push('')
      lines.push('Failures:')
      for (const [name, check] of failures) {
        lines.push(`  ${name}: ${check.error}`)
      }
    }
  }

  return lines.join('\n')
}

/**
 * Format doctor result for JSON output
 */
export function formatDoctorJson(result: DoctorResult): string {
  return JSON.stringify(result, null, 2)
}

/**
 * Format single check result for human output
 */
export function formatSingleCheckHuman(result: SingleCheckResult): string {
  const lines: string[] = []

  lines.push('Service     Status   Time')
  lines.push('─────────────────────────────')
  lines.push(formatCheckRow(result.service, result))

  if (result.sub_checks) {
    lines.push(...formatSubChecks(result.sub_checks))
  }

  lines.push('')

  if (result.status === 'ok') {
    lines.push(`Check passed (${formatDuration(result.duration_ms)})`)
  } else if (result.status === 'failed') {
    lines.push(`Check failed: ${result.error}`)
  } else {
    lines.push(`Check skipped: ${result.reason}`)
  }

  return lines.join('\n')
}

/**
 * Format single check result for JSON output
 */
export function formatSingleCheckJson(result: SingleCheckResult): string {
  return JSON.stringify(result, null, 2)
}
