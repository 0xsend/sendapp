import type { PostgrestError } from '@supabase/supabase-js'
import { TRPCError } from '@trpc/server'
import { reward, total } from 'app/data/sendtags'
import { fetchReferrer } from 'app/features/account/sendtag/checkout/checkout-utils'
import { fetchSendtagCheckoutReceipts } from 'app/features/account/sendtag/checkout/checkout-utils.fetchSendtagCheckoutReceipts'
import { assert } from 'app/utils/assert'
import { hexToBytea } from 'app/utils/hexToBytea'
import { supabaseAdmin } from 'app/utils/supabase/admin'
import { throwIf } from 'app/utils/throwIf'
import { byteaTxHash } from 'app/utils/zod'
import debug from 'debug'
import { isAddressEqual, withRetry, zeroAddress } from 'viem'
import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '../trpc'
import { byteaToHex } from 'app/utils/byteaToHex'
import type { Database } from '@my/supabase/database.types'

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
        log('profile not found', profileError)
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
        log('tags error', tagsError)
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

      const { event_id, amount, referrer: referrerBytea, reward: rewardSentStr } = data
      const rewardSent = rewardSentStr ? BigInt(rewardSentStr) : 0n
      const referrer = byteaToHex(referrerBytea as `\\x${string}`)
      const invalidAmount = !amount || BigInt(amount) !== amountDue
      const invalidReferrer =
        (!referrerProfile && rewardSent !== 0n) || // no referrer and reward is sent
        (referrerProfile && rewardSent !== rewardDue) || // referrer and invalid reward
        (rewardSent > 0n && !isAddressEqual(referrerProfile?.address ?? zeroAddress, referrer)) // referrer and reward sent is not the correct referrer

      if (invalidAmount || invalidReferrer) {
        log('transaction is not a payment for tags or incorrect amount', `txHash=${txHash}`, {
          amount,
          referrer,
          rewardDue,
          rewardSent,
          referrerProfile,
          event_id,
          invalidAmount,
          invalidReferrer,
        })
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Transaction is not a payment for tags or incorrect amount.',
        })
      }

      // Get the send account directly from the database
      const { data: sendAccount, error: sendAccountError } = await supabase
        .from('send_accounts')
        .select('id')
        .eq('user_id', profile.id)
        .single()

      if (sendAccountError || !sendAccount) {
        log('no send account found', sendAccountError)
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'No send account found',
        })
      }

      log('confirming tags', `event_id=${event_id} send_account_id=${sendAccount.id}`)

      // confirm all pending tags and save the transaction receipt
      const { error: confirmTagsErr } = await supabaseAdmin.rpc('confirm_tags', {
        tag_names: pendingTags.map((t) => t.name),
        send_account_id: sendAccount.id,
        _event_id: event_id,
        _referral_code: referrerProfile?.refcode ?? '',
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
  delete: protectedProcedure
    .input(
      z.object({
        tagId: z.number(),
      })
    )
    .mutation(async ({ ctx: { supabase }, input: { tagId } }) => {
      const { data: profile } = await supabase.auth.getUser()
      if (!profile.user) throw new TRPCError({ code: 'UNAUTHORIZED' })

      // Get the user's send account
      const { data: sendAccount, error: sendAccountError } = await supabase
        .from('send_accounts')
        .select('id')
        .eq('user_id', profile.user.id)
        .single()

      if (sendAccountError || !sendAccount) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Send account not found',
        })
      }

      // Check if the tag belongs to the user's send account
      const { data: sendAccountTag, error: tagError } = await supabase
        .from('send_account_tags')
        .select('*')
        .eq('tag_id', tagId)
        .eq('send_account_id', sendAccount.id)
        .single()

      if (tagError || !sendAccountTag) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Tag not found',
        })
      }

      // Delete the send_account_tag association
      const { error } = await supabase
        .from('send_account_tags')
        .delete()
        .eq('tag_id', tagId)
        .eq('send_account_id', sendAccount.id)

      if (error) {
        console.error('Error deleting tag:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
        })
      }

      return { success: true }
    }),
})
