import { TRPCError } from '@trpc/server'
import debug from 'debug'
import { createSupabaseAdminClient } from 'app/utils/supabase/admin'
import { createTRPCRouter, publicProcedure } from '../trpc'
import { z } from 'zod'
import { verifyMessage, type Hex } from 'viem'
import { CHECK_NOTE_ACCESS_MESSAGE } from 'app/utils/sendCheckConstants'

const logger = debug('api:routers:sendCheck')

export const GetCheckNoteRequestSchema = z.object({
  ephemeralAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid address format'),
  chainId: z.number(),
  signature: z.string().regex(/^0x[a-fA-F0-9]+$/, 'Invalid signature format'),
})

export const sendCheckRouter = createTRPCRouter({
  /**
   * Get the note for a check by proving ownership of the ephemeral private key.
   *
   * The caller must sign the message "Send Check Note Access" with the ephemeral
   * private key to prove they have access to the check.
   */
  getCheckNote: publicProcedure
    .input(GetCheckNoteRequestSchema)
    .query(async ({ input }): Promise<{ note: string | null }> => {
      const { ephemeralAddress, chainId, signature } = input

      // Verify the signature proves ownership of the ephemeral key
      let verified = false
      try {
        verified = await verifyMessage({
          address: ephemeralAddress as Hex,
          message: CHECK_NOTE_ACCESS_MESSAGE,
          signature: signature as Hex,
        })
      } catch (error) {
        logger('getCheckNote:signature-verification-error:', error)
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid signature format',
        })
      }

      if (!verified) {
        logger('getCheckNote:signature-verification-failed')
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Signature verification failed. Ensure you are signing with the correct key.',
        })
      }

      // Use admin client to bypass RLS and fetch the note
      const supabaseAdmin = createSupabaseAdminClient()

      // Convert address to bytea format
      const addressBytes = `\\x${ephemeralAddress.slice(2).toLowerCase()}`

      const { data, error } = await supabaseAdmin
        .from('send_check_notes')
        .select('note')
        .eq('ephemeral_address', addressBytes)
        .eq('chain_id', chainId)
        .single()

      if (error) {
        // PGRST116 means no rows found - that's ok, just return null
        if (error.code === 'PGRST116') {
          return { note: null }
        }
        logger('getCheckNote:database-error:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch note',
        })
      }

      return { note: data?.note ?? null }
    }),
})
