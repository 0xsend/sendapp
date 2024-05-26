import { supabaseAdmin } from 'app/utils/supabase/admin'
import type { Debugger } from 'debug'

export const getChainAddress = async (chainAddress: string) => {
  return await supabaseAdmin
    .from('chain_addresses')
    .select('*')
    .eq('address', chainAddress)
    .single()
}

export const getPasskey = async (publicKey: string) => {
  return await supabaseAdmin
    .from('webauthn_credentials')
    .select('*')
    .eq('public_key', publicKey)
    .single()
}

export const getChallenge = async (userId: string) => {
  return await supabaseAdmin.from('challenges').select('*').eq('user_id', userId).single()
}

export const isChallengeExpired = async (
  challengeId: string,
  logger?: Debugger
): Promise<boolean> => {
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

/**
 * Generates a 64-byte randomly generated challenge (hex)
 *
 * @returns {string} - challenge hex string
 */
export function generateChallenge(): Uint8Array {
  const buffer = new Uint8Array(64)
  crypto.getRandomValues(buffer)
  return buffer
}
