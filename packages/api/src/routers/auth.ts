import { TRPCError } from '@trpc/server'
import { supabaseAdmin } from 'app/utils/supabase/admin'
import debug from 'debug'
import { z } from 'zod'
import { createTRPCRouter, publicProcedure } from '../trpc'

const log = debug('api:auth')

export const authRouter = createTRPCRouter({
  signInWithOtp: publicProcedure
    .input(
      z.object({ phone: z.string(), countrycode: z.string(), captchaToken: z.string().optional() })
    )
    .mutation(async ({ input }) => {
      const { phone, countrycode, captchaToken } = input
      if (!phone) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Phone number is required',
        })
      }
      if (!countrycode) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Country Code is required',
        })
      }
      if (!!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && !captchaToken) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Captcha token is required',
        })
      }
      try {
        const result = await supabaseAdmin.auth
          .signInWithOtp({ phone: `${countrycode}${phone}`, options: { captchaToken } })
          .then(async (r) => {
            // TODO: potentially add a fake numbers list for app store reviewers
            if (__DEV__ || process.env.CI) {
              log('fake_otp_credentials', { phone: `${countrycode}${phone}` })
              return await supabaseAdmin.rpc('fake_otp_credentials', {
                phone: `${countrycode}${phone}`,
              })
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
