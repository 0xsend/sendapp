import type { Database } from '@my/supabase/database.types'
import type { PostgrestError } from '@supabase/supabase-js'
import { supabaseAdmin } from 'app/utils/supabase/admin'

// Define types based on the temporal.send_earn_deposits schema
export type TemporalDeposit = Database['temporal']['Tables']['send_earn_deposits']['Row']
export type TemporalDepositInsert = Database['temporal']['Tables']['send_earn_deposits']['Insert']
export type TemporalDepositUpdate = Database['temporal']['Tables']['send_earn_deposits']['Update']

/**
 * Upserts a record into the temporal.send_earn_deposits table.
 * Primarily used for inserting the initial 'initialized' state.
 */
export async function upsertTemporalSendEarnDeposit({
  workflow_id,
  status,
  owner,
}: Pick<TemporalDepositInsert, 'workflow_id' | 'status' | 'owner'>) {
  // Ensure required fields for initial insert are present
  if (!workflow_id || !status || !owner) {
    throw new Error('workflow_id, status, and owner are required for initial upsert.')
  }

  return await supabaseAdmin
    .schema('temporal')
    .from('send_earn_deposits')
    .upsert(
      // Cast the partial object to satisfy the Insert type, assuming DB handles defaults/nulls
      { workflow_id, status, owner } as TemporalDepositInsert,
      {
        onConflict: 'workflow_id',
        ignoreDuplicates: false, // Update if conflict occurs (though unlikely for initial insert)
      }
    )
    .select('*')
    .single() // Expect a single row result
}

/**
 * Updates an existing record in the temporal.send_earn_deposits table.
 * Used to update status, add decoded data, hashes, and error messages.
 */
export async function updateTemporalSendEarnDeposit(updateData: TemporalDepositUpdate) {
  const { workflow_id, ...payload } = updateData

  if (!workflow_id) {
    throw new Error('Workflow ID is required to update temporal deposit record.')
  }
  if (Object.keys(payload).length === 0) {
    // Avoid making an update call with no changes
    console.warn(`[updateTemporalSendEarnDeposit] No fields to update for workflow ${workflow_id}`)
    // Need to fetch the current state if we want to return it, or adjust return type
    // For now, fetch and return the current record
    return await supabaseAdmin
      .schema('temporal')
      .from('send_earn_deposits')
      .select('*')
      .eq('workflow_id', workflow_id)
      .single()
  }

  return await supabaseAdmin
    .schema('temporal')
    .from('send_earn_deposits')
    .update(payload) // Pass only the fields to update
    .eq('workflow_id', workflow_id)
    .select('*')
    .single() // Expect a single row result
}

/**
 * Checks if a PostgrestError indicates a potentially transient database issue
 * that might be resolved by retrying.
 */
export function isRetryableDBError(error: PostgrestError): boolean {
  // Network related errors or temporary server issues should be retried
  const retryableCodes = [
    '08000', // connection_exception
    '08003', // connection_does_not_exist
    '08006', // connection_failure
    '08001', // sqlclient_unable_to_establish_sqlconnection
    '08004', // sqlserver_rejected_establishment_of_sqlconnection
    '08007', // transaction_resolution_unknown
    '08P01', // protocol_violation (potentially transient)
    '53000', // insufficient_resources (e.g., out of memory, disk full - maybe retry)
    '53100', // disk_full
    '53200', // out_of_memory
    '53300', // too_many_connections
    '57P01', // admin_shutdown
    '57P02', // crash_shutdown
    '57P03', // cannot_connect_now (e.g., startup, recovery)
    '40001', // serialization_failure (optimistic lock failure, retryable)
    '40P01', // deadlock_detected (retryable)
    'XX000', // internal_error (potentially transient)
    'XX001', // data_corrupted
    'XX002', // index_corrupted
  ]

  // Check if the error code is in the list of retryable codes
  return retryableCodes.includes(error.code)
}
