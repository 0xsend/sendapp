import { TRPCError } from '@trpc/server'
import { supabaseAdmin } from 'app/utils/supabase/admin'
import debug from 'debug'
import { z } from 'zod'
import { createTRPCRouter, publicProcedure } from '../../trpc'
import { AuthStatus } from './types'

const log = debug('api:auth')

export const authRouter = createTRPCRouter({
  signInWithOtp: publicProcedure
    .input(
      z.object({
        phone: z.string().trim(),
        countrycode: z.string(),
        captchaToken: z.string().optional(),
        bypassPhoneCheck: z.boolean().optional().default(false),
      })
    )
    .mutation(async ({ input }) => {
      const { phone, countrycode, captchaToken, bypassPhoneCheck } = input

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

      if (!bypassPhoneCheck) {
        log('checking if phone is already used', { phone })

        const { data } = await supabaseAdmin
          .rpc('profile_lookup', { lookup_type: 'phone', identifier: `${countrycode}${phone}` })
          .maybeSingle()

        if (data) {
          log('phone is already used', { phone })

          return {
            status: AuthStatus.PhoneAlreadyUsed,
          }
        }
      }

      const { error } = await supabaseAdmin.auth
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
          log('signInWithOtp', { errMessage, phone })
          return r
        })

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
        })
      }

      log('successfully signed up with otp', { phone })

      return {
        status: AuthStatus.SignedIn,
      }
    }),
})
