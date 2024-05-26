import { TRPCError } from '@trpc/server'
import { getPriceInWei } from 'app/features/account/sendtag/checkout/checkout-utils'
import { supabaseAdmin } from 'app/utils/supabase/admin'
import debug from 'debug'
import { withRetry } from 'viem'
import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '../trpc'
import { hexToBytea } from 'app/utils/hexToBytea'
import type { PostgrestError } from '@supabase/supabase-js'

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
      const ethAmount = getPriceInWei(pendingTags)
      const isFree = ethAmount === BigInt(0)

      // transaction validation for rare Sendtags
      if (!isFree) {
        if (!txHash) {
          log('transaction hash required')
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Transaction hash required.',
          })
        }

        // transaction has not been claimed before in tag receipts
        const { data: receipts, error: receiptsError } = await supabase
          .from('receipts')
          .select('hash')
          .eq('hash', txHash)
          .maybeSingle()

        if (receiptsError) {
          log('receipts error', receiptsError)
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: receiptsError.message,
          })
        }

        if (receipts) {
          log('transaction has already been claimed', `txHash=${txHash}`)
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Transaction has already been claimed.',
          })
        }

        const data = await withRetry(
          async () => {
            const { data, error } = await supabase
              .from('send_revenues_safe_receives')
              .select('*')
              .eq('tx_hash', hexToBytea(txHash as `0x${string}`))
              .single()

            if (error) {
              throw error
            }

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

        const { sender: senderPgB16, v } = data

        if (!senderPgB16 || !v) {
          log('no sender or v found', `txHash=${txHash}`)
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'No sender or v found. Please try again.',
          })
        }

        if (!v || BigInt(v) !== ethAmount) {
          log('transaction is not a payment for tags or incorrect amount', `txHash=${txHash}`)
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Transaction is not a payment for tags or incorrect amount.',
          })
        }
      }

      // confirm all pending tags and save the transaction receipt
      const { error: confirmTagsErr } = await supabaseAdmin.rpc('confirm_tags', {
        tag_names: pendingTags.map((t) => t.name),
        receipt_hash: txHash ?? '',
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
