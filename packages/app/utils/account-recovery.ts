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

/**
 * Attempts to insert a challenge. Upon failing to generate a challenge (in the case of duplicate challenges), this function will retry a maximum of `maxRetries` times.
 *
 *
 * @param {int} [maxRetries=3] Maximum number of retries
 * @returns Challenge
 */
export const tryInsertChallenge = async (maxRetries: int = 3) => {
  if (maxRetries === 0) {
    return
  }
  const result = await supabaseAdmin
    .rpc('insert_challenge', {
      challenge: generateChallenge(),
    })
    .single()

  const { data, error } = result
  if (!data || error) {
    return await tryInsertChallenge(maxRetries - 1)
  }

  return result
}

export const getChallengeById = async (challengeId: number) => {
  return await supabaseAdmin.from('challenges').select('*').eq('id', challengeId).single()
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
 * @see {tryInsertChallenge} - avoid using `generateChallenge` directly. use `tryGenerateChallenge` instead.
 */
function generateChallenge(): Uint8Array {
  const buffer = new Uint8Array(64)
  crypto.getRandomValues(buffer)
  return buffer
}
