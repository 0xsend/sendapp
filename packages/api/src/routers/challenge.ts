import { TRPCError } from '@trpc/server'
import { sha256 } from '@noble/hashes/sha256'
import debug from 'debug'
import { z } from 'zod'
import { supabaseAdmin } from 'app/utils/supabase/admin'
import { createTRPCRouter, publicProcedure } from '../trpc'
import { formatPhoneNumber } from 'app/utils/formatPhoneNumber'

const log = debug('api:challenge')

export type ChallengeResponse = {
  id: string
  user_id: string
  challenge: string
  created_at: string
  expires_at: string
}

export const challengeRouter = createTRPCRouter({
  challengeUser: publicProcedure
    .input(z.object({ phoneNumberInput: z.string() }))
    .mutation(async ({ input }) => {
      // Check the phone number was supplied
      const { phoneNumberInput } = input
      if (!phoneNumberInput) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Phone number is required',
        })
      }
      const phoneNumber: string = formatPhoneNumber(phoneNumberInput)
      try {
        // Retrieve the corresponding user_id to the tag name
        const { data } = await supabaseAdmin
          .from('users')
          .select('*')
          .eq('phone', phoneNumber)
          .single()
        const user_id: string = (data?.id as string) || ''
        if (user_id === '') {
          log('challengeUser:user-not-found')
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'User not found',
          })
        }
        // Call the create_challenge function with the user_id and the
        // hex encoded hashed challenge message
        const { data: result } = await supabaseAdmin
          .rpc('upsert_auth_challenges', {
            userid: user_id,
            challenge: challengeUserMessage(user_id, phoneNumber),
          })
          .single()
        // If the result is null throw an error
        if (!result) {
          log('challengeUser:no-response')
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'No response from server',
          })
        }
        // Return the JSON result object
        return result as ChallengeResponse
      } catch (error) {
        log('challengeUser:unknown-error', { error })
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }),
})

function challengeUserMessage(user_id: string, pii: string): string {
  return Buffer.from(sha256(`${user_id}: ${generateRandomString(256)} :${pii}`)).toString('hex')
}

const chars =
  'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789&@$^%*(){}[]<>:;,.!?-_=+~'

function generateRandomString(length: number): string {
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)]
  }
  return result
}
