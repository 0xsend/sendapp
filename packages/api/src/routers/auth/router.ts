import { TRPCError } from '@trpc/server'
import { createSupabaseAdminClient } from 'app/utils/supabase/admin'
import debug from 'debug'
import { z } from 'zod'
import { createTRPCRouter, publicProcedure } from '../../trpc'

const log = debug('api:auth')

export const authRouter = createTRPCRouter({
  appReviewSignIn: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string(),
      })
    )
    .mutation(async ({ input: { email, password } }) => {
      log('App review sign in: ', email)

      try {
        // Use admin client to bypass captcha
        const supabaseAdmin = createSupabaseAdminClient()

        const { data, error } = await supabaseAdmin.auth.signInWithPassword({
          email,
          password,
        })

        if (error) {
          throw new Error(error.message || 'Invalid credentials')
        }

        return data
      } catch (error) {
        log('Error signing in for app review: ', error)
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: `Failed to sign in: ${error.message}`,
        })
      }
    }),
  signUp: publicProcedure
    .input(
      z.object({
        sendtag: z.string(),
        captchaToken: z.string().optional(),
      })
    )
    .mutation(async ({ ctx: { supabase }, input: { sendtag, captchaToken } }) => {
      log('Signing up: ', sendtag)

      if (!!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && !captchaToken) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Captcha token is required',
        })
      }

      try {
        const emailId = crypto.randomUUID()
        const email = `${sendtag}_${emailId}@no-reply.users.send.app`
        const password = Array.from(crypto.getRandomValues(new Uint8Array(32)))
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('')

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { captchaToken },
        })

        if (error) {
          throw new Error(error.message || 'Unable to create account')
        }

        return data
      } catch (error) {
        log('Error creating an account: ', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to create an account: ${error.message}`,
        })
      }
    }),
})
