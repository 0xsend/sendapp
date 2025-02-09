import type { Database } from '@my/supabase/database-generated.types'
import { log } from '@temporalio/activity'
import { hexToBytea } from 'app/utils/hexToBytea'
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
  f: `\\x${string}`
  t: `\\x${string}`
  v: bigint
  log_addr: `\\x${string}`
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
  sender: `\\x${string}`
  log_addr: `\\x${string}`
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

export async function isTokenTransferIndexed(tx_hash: `0x${string}`) {
  const { count, error, status, statusText } = await supabaseAdmin
    .from('send_account_transfers')
    .select('*', { count: 'exact', head: true })
    .eq('tx_hash', hexToBytea(tx_hash))

  log.info('isTokenTransferIndexed', { count, error, status, statusText })

  return count !== null && count > 0
}

export async function isEthTransferIndexed(tx_hash: `0x${string}`) {
  const { count, error, status, statusText } = await supabaseAdmin
    .from('send_account_receives')
    .select('*', { count: 'exact', head: true })
    .eq('tx_hash', hexToBytea(tx_hash))

  log.info('isEthTransferIndexed', { count, error, status, statusText })

  return count !== null && count > 0
}
