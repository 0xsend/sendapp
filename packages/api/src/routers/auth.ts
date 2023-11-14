import { TRPCError } from '@trpc/server'
import { createTRPCRouter, publicProcedure } from '../trpc'
import { z } from 'zod'
import { supabaseAdmin } from 'app/utils/supabase/admin'
import debug from 'debug'

const log = debug('api:auth')

export const authRouter = createTRPCRouter({
  signInWithOtp: publicProcedure
    .input(z.object({ phone: z.string() }))
    .mutation(async ({ input }) => {
      const { phone } = input
      if (!phone) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Phone number is required',
        })
      }
      try {
        const result = await supabaseAdmin.auth.signInWithOtp({ phone }).then(async (r) => {
          if (
            __DEV__ ||
            process.env.CI // TODO: potentially add a fake numbers list for app store reviewers
          ) {
            log('fake_otp_credentials', { phone })
            return await supabaseAdmin.rpc('fake_otp_credentials', { phone })
          }
          const errMessage = r.error?.message.toLowerCase()
          log('signInWithOtp', { errMessage })
          return r
        })
        return { error: result.error }
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }),
})
