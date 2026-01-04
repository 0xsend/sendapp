import type { Database } from '@my/supabase/database.types'
import { createSupabaseAdminClient } from 'app/utils/supabase/admin'

export type TemporalTransfer = Database['temporal']['Tables']['send_account_transfers']['Row']
export type TemporalTransferInsert =
  Database['temporal']['Tables']['send_account_transfers']['Insert']
export type TemporalTransferUpdate =
  Database['temporal']['Tables']['send_account_transfers']['Update']

// Transfer Intents types
export type TransferIntent = Database['public']['Tables']['transfer_intents']['Row']
export type TransferIntentInsert = Database['public']['Tables']['transfer_intents']['Insert']
export type TransferIntentUpdate = Database['public']['Tables']['transfer_intents']['Update']
export type TransferIntentStatus = Database['public']['Enums']['transfer_intent_status']

// Transfer Reconciliations types
export type TransferReconciliation = Database['public']['Tables']['transfer_reconciliations']['Row']
export type TransferReconciliationInsert =
  Database['public']['Tables']['transfer_reconciliations']['Insert']

export async function upsertTemporalSendAccountTransfer({
  workflow_id,
  status,
  data,
}: TemporalTransferInsert) {
  const supabaseAdmin = createSupabaseAdminClient()
  return await supabaseAdmin
    .schema('temporal')
    .from('send_account_transfers')
    .upsert(
      { workflow_id, status, data },
      {
        onConflict: 'workflow_id',
        ignoreDuplicates: false, // false means do update on conflict
      }
    )
    .select('*')
    .single()
}

export async function updateTemporalSendAccountTransfer(params: TemporalTransferUpdate) {
  const { workflow_id, ...rest } = params
  if (!workflow_id) throw new Error('Workflow ID is required to update temporal transfer')
  const payload: TemporalTransferUpdate = {}

  for (const [key, value] of Object.entries(rest)) {
    if (value !== null && value !== undefined) {
      payload[key] = value
    }
  }
  const supabaseAdmin = createSupabaseAdminClient()
  return await supabaseAdmin
    .schema('temporal')
    .from('send_account_transfers')
    .update(payload)
    .eq('workflow_id', workflow_id)
    .select('*')
    .single()
}

// ============================================================================
// Transfer Intents Functions
// ============================================================================

/**
 * Creates a new transfer intent.
 * Uses upsert to handle idempotent workflow restarts.
 */
export async function upsertTransferIntent(params: TransferIntentInsert) {
  const supabaseAdmin = createSupabaseAdminClient()
  return await supabaseAdmin
    .from('transfer_intents')
    .upsert(params, {
      onConflict: 'workflow_id',
      ignoreDuplicates: false,
    })
    .select('*')
    .single()
}

/**
 * Updates an existing transfer intent by workflow_id.
 */
export async function updateTransferIntent(params: TransferIntentUpdate & { workflow_id: string }) {
  const { workflow_id, ...rest } = params
  if (!workflow_id) throw new Error('Workflow ID is required to update transfer intent')

  const payload: TransferIntentUpdate = {}
  for (const [key, value] of Object.entries(rest)) {
    if (value !== null && value !== undefined) {
      payload[key] = value
    }
  }

  const supabaseAdmin = createSupabaseAdminClient()
  return await supabaseAdmin
    .from('transfer_intents')
    .update(payload)
    .eq('workflow_id', workflow_id)
    .select('*')
    .single()
}

/**
 * Gets a transfer intent by workflow_id.
 */
export async function getTransferIntent(workflowId: string) {
  const supabaseAdmin = createSupabaseAdminClient()
  return await supabaseAdmin
    .from('transfer_intents')
    .select('*')
    .eq('workflow_id', workflowId)
    .single()
}

// ============================================================================
// Transfer Reconciliations Functions
// ============================================================================

/**
 * Creates a transfer reconciliation linking an intent to on-chain event.
 * Uses upsert with (chain_id, tx_hash, log_idx) constraint for idempotency.
 */
export async function upsertTransferReconciliation(params: TransferReconciliationInsert) {
  const supabaseAdmin = createSupabaseAdminClient()
  return await supabaseAdmin
    .from('transfer_reconciliations')
    .upsert(params, {
      onConflict: 'chain_id,tx_hash,log_idx',
      ignoreDuplicates: false,
    })
    .select('*')
    .single()
}
