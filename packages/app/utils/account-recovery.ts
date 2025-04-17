import { createSupabaseAdminClient } from 'app/utils/supabase/admin'
import type { Debugger } from 'debug'

/**
 * Retrieve a chainAddress row from the `chain_addresses` table
 * @param {string} chainAddress - chainAddress to retrieve
 * @returns chainAddress row
 */
export const getChainAddress = async (chainAddress: string) => {
  const supabaseAdmin = createSupabaseAdminClient()
  return await supabaseAdmin
    .from('chain_addresses')
    .select('*')
    .eq('address', chainAddress)
    .single()
}

/**
 * Retrieves a passkey row from the `webauthn_credentials` table by its name `passkeyName` in the format <userId>.<keySlot>
 * @param {string} passkeyName - passkey name, in the format <userId>.<keySlot>
 * @returns passkey row
 */
export const getPasskey = async (passkeyName: string) => {
  const supabaseAdmin = createSupabaseAdminClient()
  return await supabaseAdmin
    .from('webauthn_credentials')
    .select('*')
    .eq('name', passkeyName)
    .single()
}

/**
 * Retrieves a challenge from the `challenges` table, from the challenge id.
 * @param {number} challengeId
 * @returns challenge row
 */
export const getChallengeById = async (challengeId: number) => {
  const supabaseAdmin = createSupabaseAdminClient()
  return await supabaseAdmin.from('challenges').select('*').eq('id', challengeId).single()
}

/**
 * Determines whether a challenge is expired
 * @param {number} challengeId - challenge id in `challenges` table
 * @param {Debugger} logger - logger
 * @returns {boolean} - whether the challenge is expired
 */
export const isChallengeExpired = async (
  challengeId: number,
  logger?: Debugger
): Promise<boolean> => {
  const supabaseAdmin = createSupabaseAdminClient()
  const { data, error } = await supabaseAdmin
    .from('challenges')
    .select('*')
    .eq('id', challengeId)
    .gt('expires_at', 'now()')
    .limit(1)

  if (error) {
    logger?.(`isChallengeExpired:${error?.message}`)
    throw error
  }

  if (data.length === 0) {
    return true
  }
  return false
}
