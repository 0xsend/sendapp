import type { Database } from '@my/supabase/database.types'
import { supabaseAdmin } from 'app/utils/supabase/admin'

// Define types based on the temporal.send_earn_deposits schema
export type TemporalDeposit = Database['temporal']['Tables']['send_earn_deposits']['Row']
export type TemporalDepositInsert = Database['temporal']['Tables']['send_earn_deposits']['Insert']
export type TemporalDepositUpdate = Database['temporal']['Tables']['send_earn_deposits']['Update']

/**
 * Upserts a record into the temporal.send_earn_deposits table.
 * Primarily used for inserting the initial 'initialized' state, including decoded data.
 */
export async function upsertTemporalSendEarnDeposit(
  insertData: Pick<
    TemporalDepositInsert,
    'workflow_id' | 'status' | 'owner' | 'assets' | 'vault' // Add assets and vault
  >
) {
  const { workflow_id, status, owner, assets, vault } = insertData

  // Ensure required fields for initial insert are present
  if (!workflow_id || !status || !owner || !assets || !vault) {
    throw new Error(
      'workflow_id, status, owner, assets, and vault are required for initial upsert.'
    )
  }

  return await supabaseAdmin
    .schema('temporal')
    .from('send_earn_deposits')
    .upsert(
      // Pass the complete initial data object
      // Casting might still be needed if types are incorrect in generated file
      insertData as TemporalDepositInsert,
      {
        onConflict: 'workflow_id', // Keep this to handle potential retries/restarts
        ignoreDuplicates: false, // Allow updates on conflict if needed later
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
