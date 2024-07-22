import type { PostgrestError } from '@supabase/supabase-js'
import { TRPCError } from '@trpc/server'
import { reward, total } from 'app/data/sendtags'
import { fetchReferrer } from 'app/features/account/sendtag/checkout/checkout-utils'
import { fetchSendtagCheckoutReceipts } from 'app/features/account/sendtag/checkout/components/checkout-confirm-button'
import { assert } from 'app/utils/assert'
import { hexToBytea } from 'app/utils/hexToBytea'
import { supabaseAdmin } from 'app/utils/supabase/admin'
import { throwIf } from 'app/utils/throwIf'
import { byteaTxHash } from 'app/utils/zod'
import debug from 'debug'
import { withRetry } from 'viem'
import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '../trpc'

const log = debug('api:routers:tag')

export const tagRouter = createTRPCRouter({
  confirm: protectedProcedure
    .input(
      z.object({
        transaction: z
          .string()
          .regex(/^0x[0-9a-f]{64}$/i)
          .optional(),
      })
    )
    .mutation(async ({ ctx: { supabase, referralCode }, input: { transaction: txHash } }) => {
      const { data: tags, error: tagsError } = await supabase.from('tags').select('*')
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .single()
      // if profile error, return early
      if (profileError || !profile) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: profileError.message || 'Profile not found',
        })
      }
      // if tags error, return early
      if (tagsError) {
        if (tagsError.code === 'PGRST116') {
          log('no tags to confirm')
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'No tags to confirm.',
          })
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: tagsError.message,
        })
      }

      // if referral code is present and not the same as the profile, fetch the referrer profile
      const referrerProfile = referralCode
        ? await fetchReferrer({
            supabase,
            profile,
            referralCode,
          }).catch((e) => {
            const error = e as unknown as PostgrestError
            if (error.code === 'PGRST116') {
              return null
            }
            throw new TRPCError({
              code: 'INTERNAL_SERVER_ERROR',
              message: error.message,
            })
          })
        : null

      const pendingTags = tags.filter((t) => t.status === 'pending')
      const amountDue = total(pendingTags)
      const txBytea = byteaTxHash.safeParse(hexToBytea(txHash as `0x${string}`))
      const rewardDue =
        referrerProfile?.address && referrerProfile.tag // ensure referrer exists and has a tag
          ? pendingTags.reduce((acc, t) => acc + reward(t.name.length), 0n)
          : 0n

      if (!txBytea.success) {
        log('transaction hash required')
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: txBytea.error.message,
        })
      }

      const data = await withRetry(
        async () => {
          const { data, error } = await fetchSendtagCheckoutReceipts(supabase)
            .eq('tx_hash', txBytea.data)
            .single()
          throwIf(error)
          assert(!!data, 'No checkout receipt found')
          log('fetched checkout receipt', data)
          return data
        },
        {
          retryCount: 10,
          delay: 500,
          shouldRetry({ error: e }) {
            const error = e as unknown as PostgrestError
            if (error.code === 'PGRST116') {
              return true // retry on no rows
            }
            return false
          },
        }
      ).catch((e) => {
        const error = e as unknown as PostgrestError
        if (error.code === 'PGRST116') {
          log('transaction is not a payment for tags', `txHash=${txHash}`)
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Transaction is not a payment for tags.',
          })
        }
        log('error fetching transaction', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
        })
      })

      const { event_id, amount, referrer, reward: rewardSentStr } = data
      const rewardSent = rewardSentStr ? BigInt(rewardSentStr) : 0n

      const invalidAmount = !amount || BigInt(amount) !== amountDue
      const invalidReferrer =
        (!referrer && rewardSent !== 0n) || // no referrer and reward is sent
        (referrer && (!reward || rewardSent !== rewardDue)) // referrer and invalid reward

      if (invalidAmount || invalidReferrer) {
        log('transaction is not a payment for tags or incorrect amount', `txHash=${txHash}`, data)
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Transaction is not a payment for tags or incorrect amount.',
        })
      }

      log('confirming tags', `event_id=${event_id}`)

      // confirm all pending tags and save the transaction receipt
      const { error: confirmTagsErr } = await supabaseAdmin.rpc('confirm_tags', {
        tag_names: pendingTags.map((t) => t.name),
        event_id,
        referral_code_input: referralCode ?? '',
      })

      if (confirmTagsErr) {
        console.error('confirm tags error', confirmTagsErr)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: confirmTagsErr.message,
        })
      }

      log(
        'confirmed tags',
        pendingTags.map((t) => t.name)
      )
      return ''
    }),
})
