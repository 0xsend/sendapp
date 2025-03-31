import type { Database } from '@my/supabase/database.types'
import type { PostgrestError } from '@supabase/supabase-js'
import { supabaseAdmin } from 'app/utils/supabase/admin'

export type TemporalTransfer = Database['temporal']['Tables']['send_account_transfers']['Row']
export type TemporalTransferInsert =
  Database['temporal']['Tables']['send_account_transfers']['Insert']
export type TemporalTransferUpdate =
  Database['temporal']['Tables']['send_account_transfers']['Update']

export async function upsertTemporalSendAccountTransfer({
  workflow_id,
  status,
  data,
}: TemporalTransferInsert) {
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
  return await supabaseAdmin
    .schema('temporal')
    .from('send_account_transfers')
    .update(payload)
    .eq('workflow_id', workflow_id)
    .select('*')
    .single()
}
