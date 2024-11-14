import type { Database } from '@my/supabase/database.types'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Fetches the sendtag checkout receipts.
 * Returns an array of receipts with numerics converted to strings to avoid overflows.
 *
 * @note this function is in it's own file to avoid playwright importing unnecessary modules
 *
 * @param supabase
 * @returns The sendtag checkout receipts.
 */
export function fetchSendtagCheckoutReceipts(supabase: SupabaseClient<Database>) {
  return supabase.from('sendtag_checkout_receipts').select(`
      event_id,
      amount::text,
      referrer,
      reward::text,
      tx_hash
    `)
}
