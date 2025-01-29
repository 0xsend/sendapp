import { log, ApplicationFailure } from '@temporalio/activity'
import { hexToBytea } from 'app/utils/hexToBytea'
import { supabaseAdmin } from 'app/utils/supabase/admin'
import type { UserOperation } from 'permissionless'

export async function isTransferIndexed(hash: `0x${string}`) {
  const { count, error, status, statusText } = await supabaseAdmin
    .from('send_account_transfers')
    .select('*', { count: 'exact', head: true })
    .eq('tx_hash', hexToBytea(hash))

  log.info('isTransferIndexed', { count, error, status, statusText })
  if (error) {
    if (error.code === 'PGRST116') {
      log.info('isTransferIndexedActivity', { error })
      return null
    }
    throw ApplicationFailure.nonRetryable(
      'Error reading transfer from send_account_transfers column.',
      error.code,
      {
        ...error,
        status,
        statusText,
      }
    )
  }
  return count !== null && count > 0
}

export async function insertTemporalTransfer({
  _user_id,
  _user_op_hash,
  _f,
  _t,
  _v,
  _data,
}: {
  _user_id: string
  _user_op_hash: string
  _f: string
  _t: string
  _v: bigint
  _data: {
    token: string
    from: string
    to: string
    amount: string
  }
}) {
  const { data, error } = await supabaseAdmin.rpc('insert_temporal_transfer', {
    _user_id,
    _user_op_hash,
    _f,
    _t,
    _v: _v.toString(),
    _data,
  })

  if (error) {
    throw ApplicationFailure.nonRetryable('Failed to insert temporal transfer', error.code, {
      error,
      userId: _user_id,
      userOpHash: _user_op_hash,
    })
  }

  return data as string // returns workflow_id
}
