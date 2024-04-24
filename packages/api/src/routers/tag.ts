import { TRPCError } from '@trpc/server'
import { getPriceInWei } from 'app/features/account/sendtag/checkout/checkout-utils'
import { supabaseAdmin } from 'app/utils/supabase/admin'
import { baseMainnetClient } from '@my/wagmi'
import debug from 'debug'
import { isAddressEqual } from 'viem'
import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '../trpc'
import { hexToPgBase16 } from 'app/utils/hexToPgBase16'
import { pgBase16ToHex } from 'app/utils/pgBase16ToHex'

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

        // get transaction receipt
        const [receipt, confirmations] = await Promise.all([
          baseMainnetClient.getTransactionReceipt({
            hash: txHash as `0x${string}`,
          }),
          baseMainnetClient.getTransactionConfirmations({
            hash: txHash as `0x${string}`,
          }),
        ]).catch((error) => {
          log('transaction error', error)
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: error.message,
          })
        })

        // check if transaction is confirmed by at least 2 blocks
        if (confirmations < 2) {
          log('transaction too new', `txHash=${txHash}`)
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Transaction too new. Please try again.',
          })
        }

        // check if transaction is successful
        if (receipt.status === 'reverted') {
          log('transaction failed', `txHash=${txHash}`)
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Transaction failed. Please try again.',
          })
        }

        const { data, error } = await supabase
          .from('send_revenues_safe_receives')
          .select('*')
          .eq('tx_hash', hexToPgBase16(txHash as `0x${string}`))
          .single()

        if (error) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: error.message,
          })
        }

        if (data === null) {
          log('transaction is not a payment for tags', `txHash=${txHash}`)
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Transaction is not a payment for tags.',
          })
        }

        const { sender: senderPgB16, v } = data

        if (!senderPgB16 || !v) {
          log('no sender or v found', `txHash=${txHash}`)
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'No sender or v found. Please try again.',
          })
        }

        const sender = pgBase16ToHex(senderPgB16 as `\\x${string}`)

        if (!v || BigInt(v) !== ethAmount) {
          log('transaction is not a payment for tags or incorrect amount', `txHash=${txHash}`)
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Transaction is not a payment for tags or incorrect amount.',
          })
        }

        // this check may be redundant
        if (!sender || !isAddressEqual(sender, receipt.from)) {
          log('transaction is not a payment for tags or incorrect sender', `txHash=${txHash}`)
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Transaction is not a payment for tags or incorrect sender.',
          })
        }

        // validate the the address is confirmed by the user
        const { error: verifyAddressErr } = await supabase
          .from('chain_addresses')
          .select('address')
          .eq('address', sender)
          .single()

        if (verifyAddressErr) {
          if (verifyAddressErr.code === 'PGRST004') {
            log('address not confirmed by user', `txHash=${txHash}`)
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: 'Address not confirmed by user.',
            })
          }
          log('verify address error', verifyAddressErr)
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: verifyAddressErr.message,
          })
        }
      } else {
        // if free just ensure there is a verified address
        const { error: verifyAddressErr } = await supabase
          .from('chain_addresses')
          .select('address')
          .single()

        if (verifyAddressErr) {
          if (verifyAddressErr.code === 'PGRST004') {
            log('no verified address')
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: 'No verified address.',
            })
          }
          log('verify address error', verifyAddressErr)
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: verifyAddressErr.message,
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
