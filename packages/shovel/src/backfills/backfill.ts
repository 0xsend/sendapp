/**
 * Backfill integrations that track events not already captured in their
 * corresponding original integration tables.
 *
 * Each backfill integration:
 * - Uses the same event structure as the original integration
 * - Filters out events where tx_hash already exists in the original table
 * - Shares the shovel_backfill table (Shovel will union all columns)
 * - Can be enabled/disabled individually via the enabled field
 */
import type { BlockData, FilterReference, Integration, Table } from '@indexsupply/shovel-config'
import { sendAccountTransfersIntegration, sendTokenTransfersIntegration } from '../integrations'

/**
 * Creates a backfill integration for a given original integration.
 * The backfill integration will exclude events where tx_hash already exists
 * in the original integration's table.
 */
export function createBackfillIntegration(
  integration: Omit<Integration, 'sources'>
): Omit<Integration, 'sources' | 'enabled'> {
  // Create filter reference to check if tx_hash exists in original table
  const txHashFilterRef: FilterReference = {
    integration: integration.name,
    column: 'tx_hash',
  }

  const backfillTable: Table = {
    name: 'shovel_backfill',
    columns: integration.table.columns,
  } as const

  // Copy block data from original, but add filter to exclude if tx_hash exists
  const backfillBlock: BlockData[] = (integration.block ?? []).map((blockItem) => {
    // Add filter to tx_hash block item if it exists
    if (blockItem.name === 'tx_hash' && blockItem.column === 'tx_hash') {
      return {
        ...blockItem,
        filter_op: '!contains' as const,
        filter_ref: txHashFilterRef,
      }
    }
    return blockItem
  })

  // If tx_hash block item doesn't exist, add it with filter
  const hasTxHashBlock = backfillBlock.some(
    (item) => item.name === 'tx_hash' && item.column === 'tx_hash'
  )
  if (!hasTxHashBlock) {
    backfillBlock.push({
      name: 'tx_hash',
      column: 'tx_hash',
      filter_op: '!contains',
      filter_ref: txHashFilterRef,
    })
  }

  return {
    name: `${integration.name}_backfill`,
    table: backfillTable,
    block: backfillBlock,
    event: integration.event,
  }
}

/**
 * Backfill integrations configuration.
 * Add integrations here to enable them for backfilling.
 *
 * Example:
 * {
 *   name: 'send_account_transfers',
 *   start: 1000000, // specific block number (will be converted to bigint)
 * },
 * {
 *   name: 'send_token_transfers',
 *   start: '$BASE_BLOCK_START', // use environment variable
 * }
 */
export const backfills: {
  integration: Omit<Integration, 'sources'>
  start: Integration['sources'][number]['start']
}[] = [
  {
    integration: sendAccountTransfersIntegration,
    start: '$BASE_BLOCK_START',
  },
  {
    integration: sendTokenTransfersIntegration,
    start: '$BASE_BLOCK_START',
  },
]
