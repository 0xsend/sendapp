import type { PgBytea, Database } from '@my/supabase/database.types'
import type { PostgrestError } from '@supabase/supabase-js'
import { supabaseAdmin } from 'app/utils/supabase/admin'

export async function upsertTemporalTokenSendAccountTransfer({
  workflow_id,
  status,
  block_num,
  f,
  t,
  v,
  log_addr,
}: {
  workflow_id: string
  status: Database['temporal']['Enums']['transfer_status']
  block_num: bigint
  f: PgBytea
  t: PgBytea
  v: bigint
  log_addr: PgBytea
}) {
  return await supabaseAdmin
    .schema('temporal')
    .from('send_account_transfers')
    .upsert({
      workflow_id,
      status,
      created_at_block_num: Number(block_num),
      data: {
        f,
        t,
        v: v.toString(),
        log_addr,
      },
    })
    .select('*')
    .single()
}

export async function upsertTemporalEthSendAccountTransfer({
  workflow_id,
  status,
  block_num,
  sender,
  log_addr,
  value,
}: {
  workflow_id: string
  status: Database['temporal']['Enums']['transfer_status']
  block_num: bigint
  sender: PgBytea
  log_addr: PgBytea
  value: bigint
}) {
  return await supabaseAdmin
    .schema('temporal')
    .from('send_account_transfers')
    .upsert({
      workflow_id,
      status,
      created_at_block_num: Number(block_num),
      data: {
        sender,
        value: value.toString(),
        log_addr,
      },
    })
    .select('*')
    .single()
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
  return await supabaseAdmin
    .schema('temporal')
    .from('send_account_transfers')
    .update({
      status,
      data,
    })
    .eq('workflow_id', workflow_id)
    .select('*')
    .single()
}

export function isRetryableDBError(error: PostgrestError) {
  // Network related errors should be retried
  const retryableCodes = [
    '08000', // Connection error
    '08006', // Connection failure
    '08001', // SQL client unable to establish connection
    '08004', // Rejected by server
    '57P01', // Admin shutdown
    '57P02', // Crash shutdown
    '40001', // Serialization failure
    '40P01', // Deadlock detected
  ]

  return retryableCodes.includes(error.code)
}
