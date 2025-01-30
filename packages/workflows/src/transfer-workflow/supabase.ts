import { log, ApplicationFailure } from '@temporalio/activity'
import { hexToBytea } from 'app/utils/hexToBytea'
import { supabaseAdmin } from 'app/utils/supabase/admin'

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
