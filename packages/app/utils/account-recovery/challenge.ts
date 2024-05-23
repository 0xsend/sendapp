import { supabaseAdmin } from 'app/utils/supabase/admin'
import type { ChallengeResponse } from '@my/api/src/routers/account-recovery/types'
import type { Debugger } from 'debug'
import type { PostgrestSingleResponse } from '@supabase/postgrest-js'
import { sha256 } from '@noble/hashes/sha256'

export const getChallenge = async (
  userId: string
): Promise<PostgrestSingleResponse<ChallengeResponse>> => {
  return await supabaseAdmin.from('auth_challenges').select('*').eq('user_id', userId).single()
}

export const isChallengeExpired = async (
  challengeId: string,
  logger?: Debugger
): Promise<boolean> => {
  const { data, error } = await supabaseAdmin
    .from('auth_challenges')
    .select('*')
    .eq('id', challengeId)
    .gt('expires_at', 'now()')
    .limit(1)

  if (error) {
    console.log('here', error)
    logger?.(`isChallengeExpired:${error?.message}`)
    throw error
  }

  if (data.length === 0) {
    return true
  }
  return false
}

export function challengeUserMessage(user_id: string, pii: string): string {
  return Buffer.from(sha256(`${user_id}: ${generateRandomString(256)} :${pii}`)).toString('hex')
}

// TODO: use lib for this?
const chars =
  'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789&@$^%*(){}[]<>:;,.!?-_=+~'

// TODO: use lib for this?
function generateRandomString(length: number): string {
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)]
  }
  return result
}
