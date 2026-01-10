import type { DryRunResult, OutputFormat } from '../types'
import { formatTable } from './table'
import { formatJson } from './json'
import { formatCsv } from './csv'
import { formatMarkdown } from './markdown'

export { formatTable } from './table'
export { formatJson } from './json'
export { formatCsv } from './csv'
export { formatMarkdown } from './markdown'

/**
 * Format dry run result using specified output format.
 */
export function formatOutput(result: DryRunResult, format: OutputFormat): string {
  switch (format) {
    case 'table':
      return formatTable(result)
    case 'json':
      return formatJson(result)
    case 'csv':
      return formatCsv(result)
    case 'markdown':
      return formatMarkdown(result)
    default: {
      const _exhaustive: never = format
      throw new Error(`Unknown format: ${_exhaustive}`)
    }
  }
}
