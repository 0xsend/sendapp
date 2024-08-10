import { useSendAccount } from 'app/utils/send-accounts'
import { supabaseAdmin } from 'app/utils/supabase/admin'
import { useCallback } from 'react'
import debug from 'debug'
import type { Hex } from 'viem'

const logger = debug.log

export const useSendChecksClaimed = () => {
  const { data: sendAccount } = useSendAccount()
  return useCallback(async () => {
    return await getSendChecksClaimed(sendAccount?.address)
  }, [sendAccount?.address])
}

export const getSendChecksClaimed = async (redeemer?: Hex) => {
  if (!redeemer) {
    logger('Cannot get send checks claimed. `redeemer` is undefined.')
    return
  }

  const { data, error } = await supabaseAdmin
    .from('send_check_claimed')
    .select('*')
    .eq('redeemer', redeemer)

  if (error) {
    logger(`Error fetching send checks claimed for redeemer: [${redeemer}]`, error)
    throw error
  }

  return data
}
