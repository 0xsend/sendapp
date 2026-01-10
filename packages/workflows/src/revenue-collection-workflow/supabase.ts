import { createSupabaseAdminClient } from 'app/utils/supabase/admin'
import { log } from '@temporalio/activity'
import type { HarvestRecord, SweepRecord } from '@my/send-earn'
import type { SupabaseClient } from '@supabase/supabase-js'

// Type for harvest table row
interface HarvestRow {
  vault: string
  token: string
  amount: string
  tx_hash: string
  block_num: number
  block_time: number
}

// Type for sweep table row
interface SweepRow {
  vault: string
  token: string
  amount: string
  destination: string
  tx_hash: string
  block_num: number
  block_time: number
}

/**
 * Insert harvest records into the database.
 * Note: Uses type assertion since send_earn_revenue_harvest may not be in generated types yet.
 * Once migration is run and types regenerated, this can be simplified.
 */
export async function insertHarvestRecords(records: HarvestRecord[]): Promise<void> {
  if (records.length === 0) {
    log.info('No harvest records to insert')
    return
  }

  const supabaseAdmin = createSupabaseAdminClient()

  // Convert records to database format
  // Use bytea escape format for PostgreSQL
  const rows: HarvestRow[] = records.map((record) => ({
    vault: `\\x${record.vault.slice(2)}`,
    token: `\\x${record.token.slice(2)}`,
    amount: record.amount.toString(),
    tx_hash: `\\x${record.txHash.slice(2)}`,
    block_num: Number(record.blockNum),
    block_time: Number(record.blockTime),
  }))

  // Use from with type assertion since table may not be in generated types yet
  // biome-ignore lint/suspicious/noExplicitAny: table not in generated types until migration runs
  const { error } = await (supabaseAdmin as SupabaseClient<any>)
    .from('send_earn_revenue_harvest')
    .insert(rows)

  if (error) {
    log.error('Failed to insert harvest records', { error, count: records.length })
    throw error
  }

  log.info('Successfully inserted harvest records', { count: records.length })
}

/**
 * Insert sweep records into the database.
 * Note: Uses type assertion since send_earn_revenue_sweep may not be in generated types yet.
 * Once migration is run and types regenerated, this can be simplified.
 */
export async function insertSweepRecords(records: SweepRecord[]): Promise<void> {
  if (records.length === 0) {
    log.info('No sweep records to insert')
    return
  }

  const supabaseAdmin = createSupabaseAdminClient()

  // Convert records to database format
  // Use bytea escape format for PostgreSQL
  const rows: SweepRow[] = records.map((record) => ({
    vault: `\\x${record.vault.slice(2)}`,
    token: `\\x${record.token.slice(2)}`,
    amount: record.amount.toString(),
    destination: `\\x${record.destination.slice(2)}`,
    tx_hash: `\\x${record.txHash.slice(2)}`,
    block_num: Number(record.blockNum),
    block_time: Number(record.blockTime),
  }))

  // Use from with type assertion since table may not be in generated types yet
  // biome-ignore lint/suspicious/noExplicitAny: table not in generated types until migration runs
  const { error } = await (supabaseAdmin as SupabaseClient<any>)
    .from('send_earn_revenue_sweep')
    .insert(rows)

  if (error) {
    log.error('Failed to insert sweep records', { error, count: records.length })
    throw error
  }

  log.info('Successfully inserted sweep records', { count: records.length })
}

/**
 * Get active vault addresses from the database.
 */
export async function getActiveVaults(): Promise<`0x${string}`[]> {
  const supabaseAdmin = createSupabaseAdminClient()

  const { data, error } = await supabaseAdmin
    .from('send_earn_create')
    .select('send_earn')
    .order('block_num', { ascending: false })

  if (error) {
    log.error('Failed to fetch active vaults', { error })
    throw error
  }

  if (!data || data.length === 0) {
    log.info('No active vaults found')
    return []
  }

  // Convert bytea to hex and deduplicate
  const vaults = [
    ...new Set(
      data.map((d) => {
        const hex = d.send_earn as unknown as string
        // Handle both bytea (\\x...) and Buffer formats
        if (typeof hex === 'string' && hex.startsWith('\\x')) {
          return `0x${hex.slice(2)}` as `0x${string}`
        }
        if (Buffer.isBuffer(hex)) {
          return `0x${hex.toString('hex')}` as `0x${string}`
        }
        return hex as `0x${string}`
      })
    ),
  ]

  log.info('Fetched active vaults', { count: vaults.length })
  return vaults
}
