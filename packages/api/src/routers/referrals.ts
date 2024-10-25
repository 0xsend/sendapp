import { TRPCError } from '@trpc/server'
import { createTRPCRouter, protectedProcedure } from '../trpc'
import debug from 'debug'
import { supabaseAdmin } from 'app/utils/supabase/admin'
const log = debug('api:routers:referrals')

export const referralsRouter = createTRPCRouter({
  getReferred: protectedProcedure.query(async ({ ctx }) => {
    const { user } = ctx.session
    if (!user) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Unauthorized',
      })
    }
    const { data: referred, error } = await supabaseAdmin
      .from('referrals')
      .select('*')
      .eq('referred_id', user.id)
      .single()
    if (error && error.code !== 'PGRST116') {
      log('referrals error', error)
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: error.message,
      })
    }
    if (!referred) return null
    const { data: referrerSendAccount, error: referrerError } = await supabaseAdmin
      .from('send_accounts')
      .select('*')
      .eq('id', referred.referrer_id)
      .single()
    if (referrerError && referrerError.code !== 'PGRST116') {
      log('referrals error', referrerError)
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: referrerError.message,
      })
    }

    return { referred, referrerSendAccount }
  }),
})
