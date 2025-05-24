import { useSendAccount } from 'app/utils/send-accounts'
import { supabaseAdmin } from 'app/utils/supabase/admin'
import { useCallback } from 'react'
import debug from 'debug'

const logger = debug.log

export const useGetCreatedSendChecks = () => {
  const { data: sendAccount } = useSendAccount()

  return useCallback(async () => {
    return await getCreatedSendChecks(sendAccount?.address)
  }, [sendAccount?.address])
}

export const getCreatedSendChecks = async (from?: string) => {
  if (!from) {
    logger('Cannot get send checks created. `from` is undefined.')
    return
  }
  const { data, error } = await supabaseAdmin
    .from('send_check_created')
    .select('*')
    .eq('from', from)

  if (error) {
    logger('Error fetching created send checks', error)
    throw error
  }

  return data
}
