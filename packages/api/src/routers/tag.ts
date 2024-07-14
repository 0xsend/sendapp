import type { PostgrestError } from '@supabase/supabase-js'
import { TRPCError } from '@trpc/server'
import { total } from 'app/data/sendtags'
import { hexToBytea } from 'app/utils/hexToBytea'
import { supabaseAdmin } from 'app/utils/supabase/admin'
import { byteaTxHash } from 'app/utils/zod'
import debug from 'debug'
import { withRetry } from 'viem'
import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '../trpc'
import { fetchSendtagCheckoutTransfers } from 'app/features/account/sendtag/checkout/components/checkout-confirm-button'
import { throwIf } from 'app/utils/throwIf'
import { assert } from 'app/utils/assert'

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

      const pendingTags = tags.filter((t) => t.status === 'pending')
      const amountDue = total(pendingTags)
      const txBytea = byteaTxHash.safeParse(hexToBytea(txHash as `0x${string}`))

      if (!txBytea.success) {
        log('transaction hash required')
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: txBytea.error.message,
        })
      }

      const data = await withRetry(
        async () => {
          const { data, error } = await fetchSendtagCheckoutTransfers(supabase)
            .eq('tx_hash', txBytea.data)
            .single()
          throwIf(error)
          assert(!!data, 'No checkout receipt found')
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

      const { event_id, f: senderPgB16, v } = data

      if (!senderPgB16 || !v) {
        log('no sender or v found', `txHash=${txHash}`)
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'No sender or v found. Please try again.',
        })
      }

      if (!v || BigInt(v) !== amountDue) {
        log('transaction is not a payment for tags or incorrect amount', `txHash=${txHash}`)
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
        log('confirm tags error', confirmTagsErr)
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
