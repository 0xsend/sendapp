import type { PgBytea, Database } from '@my/supabase/database.types'
import { supabaseAdmin } from 'app/utils/supabase/admin'

export async function insertTemporalTokenSendAccountTransfer({
  workflow_id,
  status,
  f,
  t,
  v,
  log_addr,
}: {
  workflow_id: string
  status: Database['temporal']['Enums']['transfer_status']
  f: PgBytea
  t: PgBytea
  v: bigint
  log_addr: PgBytea
}) {
  return await supabaseAdmin.schema('temporal').rpc('insert_temporal_token_send_account_transfer', {
    workflow_id,
    status,
    f,
    t,
    v: v.toString(),
    log_addr,
  })
}

export async function insertTemporalEthSendAccountTransfer({
  workflow_id,
  status,
  sender,
  log_addr,
  value,
}: {
  workflow_id: string
  status: Database['temporal']['Enums']['transfer_status']
  sender: PgBytea
  log_addr: PgBytea
  value: bigint
}) {
  return await supabaseAdmin.schema('temporal').rpc('insert_temporal_eth_send_account_transfer', {
    workflow_id,
    status,
    sender,
    log_addr,
    value: value.toString(),
  })
}

export async function updateTemporalSendAccountTransfer({
  workflow_id,
  status,
  data,
}: {
  workflow_id: string
  status: Database['temporal']['Enums']['transfer_status']
  data?: Database['temporal']['Tables']['send_account_transfers']['Row']['data']
}) {
  return await supabaseAdmin.schema('temporal').rpc('update_temporal_send_account_transfer', {
    workflow_id,
    status,
    data,
  })
}

export async function deleteTemporalTransfer(workflow_id: string) {
  return await supabaseAdmin
    .schema('temporal')
    .from('send_account_transfers')
    .delete()
    .eq('workflow_id', workflow_id)
    .select('workflow_id')
    .single()
}

export async function deleteTemporalTransferFromActivityTable(workflow_id: string) {
  return await supabaseAdmin
    .from('activity')
    .delete()
    .eq('event_id', workflow_id)
    .select('event_id')
    .single()
}
