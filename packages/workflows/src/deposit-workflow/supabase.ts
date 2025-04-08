import type { Database } from '@my/supabase/database.types'
import { supabaseAdmin } from 'app/utils/supabase/admin'
import type { Address } from 'viem'
import { log } from '@temporalio/activity'

// Define types based on the temporal.send_earn_deposits schema
export type TemporalDeposit = Database['temporal']['Tables']['send_earn_deposits']['Row']
export type TemporalDepositInsert = Database['temporal']['Tables']['send_earn_deposits']['Insert']
export type TemporalDepositUpdate = Database['temporal']['Tables']['send_earn_deposits']['Update']

/**
 * Upserts a record into the temporal.send_earn_deposits table.
 * Primarily used for inserting the initial 'initialized' state.
 */
export async function upsertTemporalSendEarnDeposit(
  insertData: Pick<TemporalDepositInsert, 'workflow_id' | 'status' | 'owner' | 'assets' | 'vault'>
) {
  const { workflow_id, status, owner, assets, vault } = insertData

  // Ensure required fields for initial insert are present
  // Vault can be null, so no check needed here.
  if (!workflow_id || !status || !owner || !assets) {
    throw new Error('workflow_id, status, owner, and assets are required for initial upsert.')
  }

  return await supabaseAdmin
    .schema('temporal')
    .from('send_earn_deposits')
    .upsert(
      // Pass the data directly, vault is already handled (can be null)
      insertData,
      {
        onConflict: 'workflow_id', // Keep this to handle potential retries/restarts
        ignoreDuplicates: false, // Allow updates on conflict
      }
    )
    .select('*')
    .single() // Expect a single row result
}

/**
 * Retrieves the user_id associated with a given Send Account address.
 */
export async function getUserIdFromAddress(address: Address): Promise<string | null> {
  if (!address) {
    log.warn('Received empty address')
    return null
  }

  const { data, error } = await supabaseAdmin
    .schema('public')
    .from('send_accounts')
    .select('user_id')
    .eq('address', address)
    .maybeSingle()

  if (error) {
    log.error(`Error fetching user_id for ${address}:`, error)
    // Consider if this should throw or return null based on expected usage
    return null
  }

  if (!data) {
    log.warn(`No user_id found for address ${address}`)
    return null
  }

  return data.user_id
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
    log.warn(`No fields to update for workflow ${workflow_id}`)
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
