import { TRPCError } from '@trpc/server'
import { createSupabaseAdminClient } from 'app/utils/supabase/admin'
import debug from 'debug'
import { z } from 'zod'
import { createTRPCRouter, publicProcedure } from '../../trpc'
import { AuthStatus } from './types'

const log = debug('api:auth')

export const authRouter = createTRPCRouter({
  signUp: publicProcedure
    .input(
      z.object({
        sendtag: z.string(),
        captchaToken: z.string().optional(),
      })
    )
    .mutation(async ({ ctx: { supabase }, input: { sendtag, captchaToken } }) => {
      if (!!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && !captchaToken) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Captcha token is required',
        })
      }

      try {
        const email = `${sendtag}@no-reply.users.send.app`
        const password = Array.from(crypto.getRandomValues(new Uint8Array(32)))
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('')

        const { error } = await supabase.auth.signUp({
          email,
          password,
        })

        if (error) {
          throw new Error(error.message)
        }
      } catch (error) {
        log('Error creating an account: ', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to create an account: ${error.message}`,
        })
      }
    }),
  signInWithOtp: publicProcedure
    .input(
      z.object({
        phone: z.string().trim(),
        countrycode: z.string(),
        captchaToken: z.string().optional(),
        bypassOnboardedCheck: z.boolean().optional().default(true),
      })
    )
    .mutation(async ({ input }) => {
      const supabaseAdmin = createSupabaseAdminClient()
      const { phone, countrycode, captchaToken, bypassOnboardedCheck } = input

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

      if (!bypassOnboardedCheck) {
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
