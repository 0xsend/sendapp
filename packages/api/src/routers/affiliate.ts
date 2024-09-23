import { TRPCError } from '@trpc/server'
import { supabaseAdmin } from 'app/utils/supabase/admin'
import debug from 'debug'
import { createTRPCRouter, protectedProcedure } from '../trpc'
import { throwIf } from 'app/utils/throwIf'
import { z } from 'zod'

const log = debug('api:affiliate')

export const affiliateRouter = createTRPCRouter({
  getReferrals: protectedProcedure
    .input(
      z.object({
        limit: z.number().default(10),
        cursor: z.number().default(0),
      })
    )
    .query(async (opts) => {
      const {
        input,
        ctx: {
          session: { user },
        },
      } = opts
      const { cursor, limit } = input
      const from = cursor * limit
      const to = (cursor + 1) * limit - 1
      const request = await supabaseAdmin
        .from('referrals')
        .select('*')
        .eq('referred_id', user.id)
        .range(from, to)
      const { data, error } = await request
      throwIf(error)
      return data
    }),
  getStats: protectedProcedure.query(
    async ({
      ctx: {
        session: { user },
      },
    }) => {
      // lookup referred users
      const { data: referrerIds, error: referredIdsError } = await supabaseAdmin
        .from('referrals')
        .select('referrer_id')
        .eq('referred_id', user.id)

      if (referredIdsError) {
        log('Error fetching referrals', referredIdsError)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: referredIdsError.message,
        })
      }
      // lookup user affiliate stats
      const { data: affiliateStats, error: affiliateStatsError } = await supabaseAdmin
        .from('affiliate_stats')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (affiliateStatsError) {
        log('Error fetching affiliate stats', affiliateStatsError)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: affiliateStatsError.message,
        })
      }

      // calculate referred paymaster tx count
      type AggregateResult = {
        sum: number | null
      }

      const { data: referredPaymasterTxCount, error: referredPaymasterTxCountError } =
        await supabaseAdmin
          .from('affiliate_stats')
          .select('paymaster_tx_count')
          .in('user_id', referrerIds ?? [])
          .select('sum(paymaster_tx_count)')
          .single<AggregateResult>()

      return {
        referredPaymasterTxCount: referredPaymasterTxCount?.sum ?? 0,
        referralsCount: referrerIds?.length ?? 0,
        ...affiliateStats,
      }
    }
  ),
})
