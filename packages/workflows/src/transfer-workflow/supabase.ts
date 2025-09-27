import type { Database } from '@my/supabase/database.types'
import { createSupabaseAdminClient } from 'app/utils/supabase/admin'

export type TemporalTransfer = Database['temporal']['Tables']['send_account_transfers']['Row']
export type TemporalTransferInsert =
  Database['temporal']['Tables']['send_account_transfers']['Insert']
export type TemporalTransferUpdate =
  Database['temporal']['Tables']['send_account_transfers']['Update']

export async function upsertTemporalSendAccountTransfer(params: TemporalTransferInsert) {
  const supabaseAdmin = createSupabaseAdminClient()
  return await supabaseAdmin
    .schema('temporal')
    .from('send_account_transfers')
    .upsert(params, {
      onConflict: 'nonce',
      ignoreDuplicates: false, // false means do update on conflict
    })
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

export async function verifyActivityEventExists({ eventName, eventId }) {
  const supabaseAdmin = createSupabaseAdminClient()
  return await supabaseAdmin
    .from('activity')
    .select('*', { count: 'exact', head: true }) // Efficiently check existence
    .eq('event_eane', eventName)
    .eq('event_id', eventId)
}

export async function deleteTemporalTransferEvent({ workflowId }: { workflowId: string }) {
  const supabaseAdmin = createSupabaseAdminClient()
  return await supabaseAdmin
    .from('activity')
    .delete({ count: 'exact' })
    .eq('event_id', workflowId)
    .eq('event_name', 'temporal_send_account_transfers')
}
