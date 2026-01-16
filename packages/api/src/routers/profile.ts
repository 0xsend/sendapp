import { getTemporalClient } from '@my/temporal/client'
import { startWorkflow } from '@my/workflows/utils'
import { TRPCError } from '@trpc/server'
import debug from 'debug'
import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '../trpc'

const log = debug('api:profile')

export const profileRouter = createTRPCRouter({
  uploadImage: protectedProcedure
    .input(
      z.object({
        storagePath: z.string(),
        imageType: z.enum(['avatar', 'banner']),
        blurhash: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { storagePath, imageType, blurhash } = input
      const userId = ctx.session.user.id
      const imageId = crypto.randomUUID()

      log('Starting image upload', { userId, imageType, imageId })

      // Get current image ID for cleanup
      const column = imageType === 'avatar' ? 'avatar_data' : 'banner_data'
      const { data: profile, error: fetchError } = await ctx.supabase
        .from('profiles')
        .select(column)
        .eq('id', userId)
        .single()

      if (fetchError) {
        log('Failed to fetch profile', { userId, error: fetchError })
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to fetch profile: ${fetchError.message}`,
        })
      }

      const currentData = profile?.[column] as { imageId?: string } | null
      const previousImageId = currentData?.imageId

      // Set pending status with blurhash immediately (if provided)
      const pendingData = {
        version: 1,
        imageId,
        baseUrl: '',
        blurhash: blurhash ?? '',
        processingStatus: 'pending',
        variants: {},
      }

      const { error: updateError } = await ctx.supabase
        .from('profiles')
        .update({ [column]: pendingData })
        .eq('id', userId)

      if (updateError) {
        log('Failed to update profile with pending data', { userId, error: updateError })
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to update profile: ${updateError.message}`,
        })
      }

      // Start Temporal workflow
      const client = await getTemporalClient().catch((e) => {
        log('Failed to get Temporal client', { error: e.message })
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: e.message,
        })
      })

      await startWorkflow({
        client,
        workflow: 'processImage',
        ids: [userId, imageType, imageId],
        args: [
          {
            userId,
            storagePath,
            imageType,
            imageId,
            previousImageId,
            blurhash,
          },
        ],
      }).catch((e) => {
        log('Error starting processImage workflow', { error: e.message })
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: e.message,
        })
      })

      log('Image upload workflow started', { userId, imageType, imageId })

      return { imageId, blurhash }
    }),
})
