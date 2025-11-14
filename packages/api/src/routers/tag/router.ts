import type { PostgrestError } from '@supabase/supabase-js'
import { TRPCError } from '@trpc/server'
import { reward, total } from 'app/data/sendtags'
import { fetchSendtagCheckoutReceipts } from 'app/features/account/sendtag/checkout/checkout-utils.fetchSendtagCheckoutReceipts'
import { assert } from 'app/utils/assert'
import { byteaToHex } from 'app/utils/byteaToHex'
import { hexToBytea } from 'app/utils/hexToBytea'
import { createSupabaseAdminClient } from 'app/utils/supabase/admin'
import { throwIf } from 'app/utils/throwIf'
import { fetchReferrer } from 'app/utils/useReferrer'
import { byteaTxHash } from 'app/utils/zod'
import debug from 'debug'
import { isAddressEqual, withRetry, zeroAddress } from 'viem'
import { z } from 'zod'
import { createTRPCRouter, protectedProcedure, publicProcedure } from '../../trpc'
import { SendtagSchema } from 'app/utils/zod/sendtag'
import { SendtagAvailability } from './types'

const log = debug('api:routers:tag')

export const tagRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        name: z.string(),
      })
    )
    .mutation(async ({ ctx: { supabase }, input }) => {
      // Get the user's send account
      const { data: sendAccount, error: sendAccountError } = await supabase
        .from('send_accounts')
        .select('id')
        .single()

      if (sendAccountError || !sendAccount) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Send account not found',
        })
      }

      const { error } = await supabase.rpc('create_tag', {
        tag_name: input.name,
        send_account_id: sendAccount.id,
      })

      if (error) {
        console.error("Couldn't create Sendtag", error)
        switch (error.code) {
          case '23505':
            throw new TRPCError({
              code: 'CONFLICT',
              message: 'This Sendtag is already taken',
            })
          default:
            throw new TRPCError({
              code: 'INTERNAL_SERVER_ERROR',
              message: error.message ?? 'Something went wrong',
            })
        }
      }

      return { success: true }
    }),
  checkAvailability: publicProcedure.input(SendtagSchema).mutation(async ({ input: { name } }) => {
    log('checking sendtag availability: ', { name })

    try {
      const supabaseAdmin = createSupabaseAdminClient()
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString()

      const { count, error } = await supabaseAdmin
        .from('tags')
        .select('*', { count: 'exact', head: true })
        .eq('name', name)
        .or(`status.eq.confirmed,and(status.eq.pending,created_at.gt.${thirtyMinutesAgo})`)

      if (error || count === null) {
        throw new Error(error?.message || "Unable to fetch user's tags")
      }

      if (count > 0) {
        return { sendtagAvailability: SendtagAvailability.Taken }
      }

      return { sendtagAvailability: SendtagAvailability.Available }
    } catch (error) {
      log('Error checking sendtag availability: ', error)
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Failed to check sendtag availability: ${error.message}`,
      })
    }
  }),
  registerFirstSendtag: protectedProcedure
    .input(
      z.object({
        name: z.string().min(5, 'First Sendtag must be at least 5 characters').max(20),
        sendAccountId: z.string().uuid(),
        referralCode: z.string().optional().nullable(),
      })
    )
    .mutation(async ({ ctx: { supabase }, input: { name, sendAccountId, referralCode } }) => {
      try {
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

        // if referral code is present and not the same as the profile, fetch the referrer profile
        const referrerProfile = referralCode
          ? await fetchReferrer({
              supabase,
              profile,
              referral_code: referralCode,
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

        // Use the atomic SQL function that handles everything in a single transaction
        const { data: result, error } = await supabase.rpc('register_first_sendtag', {
          tag_name: name,
          send_account_id: sendAccountId,
          _referral_code: referrerProfile?.refcode ?? '',
        })

        if (error) {
          log('Error registering first sendtag: ', error)
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: error.message,
          })
        }

        return result
      } catch (error) {
        log('Error registering first sendtag: ', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to register first sendtag: ${error.message}`,
        })
      }
    }),
  confirm: protectedProcedure
    .input(
      z.object({
        transaction: z
          .string()
          .regex(/^0x[0-9a-f]{64}$/i)
          .optional(),
        referralCode: z.string().optional().nullable(),
      })
    )
    .mutation(async ({ ctx: { supabase }, input: { transaction: txHash, referralCode } }) => {
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
            referral_code: referralCode,
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
      const referrerProfileAddress = (referrerProfile?.address ?? zeroAddress) as `0x${string}`
      const invalidAmount = !amount || BigInt(amount) !== amountDue
      const invalidReferrer =
        (!referrerProfile && rewardSent !== 0n) || // no referrer and reward is sent
        (referrerProfile && rewardSent !== rewardDue) || // referrer and invalid reward
        (rewardSent > 0n && !isAddressEqual(referrerProfileAddress, referrer)) // referrer and reward sent is not the correct referrers

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
      const supabaseAdmin = createSupabaseAdminClient()
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
        .select('id, main_tag_id')
        .eq('user_id', profile.user.id)
        .single()

      if (sendAccountError || !sendAccount) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Send account not found',
        })
      }

      // Cannot delete main tag
      if (sendAccount.main_tag_id === tagId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Cannot delete main tag. Set a different main tag first.',
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

      // Validate if tag can be deleted (single DB call)
      const { data: canDelete, error: validationError } = await supabase.rpc('can_delete_tag', {
        p_send_account_id: sendAccount.id,
        p_tag_id: tagId,
      })

      if (validationError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to validate tag deletion',
        })
      }

      // Block deletion if validation fails
      if (!canDelete) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Cannot delete this sendtag. You must maintain at least one paid sendtag.',
        })
      }

      // Delete the send_account_tag association
      // The database trigger will automatically handle tag status update and main tag succession
      const { error: deleteError } = await supabase
        .from('send_account_tags')
        .delete()
        .eq('tag_id', tagId)
        .eq('send_account_id', sendAccount.id)

      if (deleteError) {
        console.error('Error deleting tag:', deleteError)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: deleteError.message,
        })
      }

      return { success: true }
    }),
  canDeleteTags: protectedProcedure.query(async ({ ctx: { supabase } }) => {
    const { data: profile } = await supabase.auth.getUser()
    if (!profile.user) throw new TRPCError({ code: 'UNAUTHORIZED' })

    // Get the user's send account
    const { data: sendAccount, error: sendAccountError } = await supabase
      .from('send_accounts')
      .select('id')
      .single()

    if (sendAccountError || !sendAccount) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Send account not found',
      })
    }

    // Check if user can delete any tag (no tag_id = general check)
    const { data: canDelete, error: validationError } = await supabase.rpc('can_delete_tag', {
      p_send_account_id: sendAccount.id,
    })

    if (validationError) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to check tag deletion eligibility',
      })
    }

    return canDelete ?? false
  }),
})
