import { ApplicationFailure, log, proxyActivities } from '@temporalio/workflow'
import type { createImageActivities } from './activities'
import { AVATAR_SIZES, BANNER_SIZES, FORMATS, QUALITY, type ProcessImageInput } from './types'

const {
  processVariantActivity,
  updateProfileImageDataActivity,
  updateProfileBlurhashActivity,
  deleteOldImageActivity,
  deleteOriginalUploadActivity,
  generateBlurhashActivity,
} = proxyActivities<ReturnType<typeof createImageActivities>>({
  startToCloseTimeout: '2 minutes',
  retry: {
    maximumAttempts: 3,
  },
})

export async function processImage(input: ProcessImageInput): Promise<void> {
  const {
    userId,
    storagePath,
    imageType,
    imageId,
    previousImageId,
    blurhash: providedBlurhash,
  } = input

  log.info('Starting image processing workflow', { userId, imageType, imageId })

  const sizes = imageType === 'avatar' ? AVATAR_SIZES : BANNER_SIZES
  const basePath = `${userId}/${imageType}/${imageId}`

  try {
    // Generate blurhash if not provided, and process variants in parallel
    const blurhashPromise = providedBlurhash
      ? Promise.resolve({ blurhash: providedBlurhash })
      : generateBlurhashActivity({ sourcePath: storagePath, imageType })

    const variantPromises = Object.entries(sizes).flatMap(([variant, dimensions]) =>
      FORMATS.map((format) =>
        processVariantActivity({
          sourcePath: storagePath,
          outputPath: `${basePath}/${variant}.${format}`,
          width: dimensions.width,
          height: dimensions.height,
          format,
          quality: QUALITY,
        })
      )
    )

    // Run blurhash generation and variant processing in parallel
    const [blurhashResult] = await Promise.all([blurhashPromise, ...variantPromises])
    log.info('All variants processed successfully', { userId, imageType, imageId })

    // Update blurhash if it was generated (not provided by client)
    if (!providedBlurhash && blurhashResult.blurhash) {
      await updateProfileBlurhashActivity({
        userId,
        imageType,
        imageId,
        blurhash: blurhashResult.blurhash,
      })
    }

    // Update profile with completed status
    await updateProfileImageDataActivity({
      userId,
      imageType,
      imageId,
      basePath,
      status: 'complete',
    })

    // Delete original uploaded file (best-effort)
    await deleteOriginalUploadActivity({
      storagePath,
    })

    // Delete old image variants
    if (previousImageId) {
      await deleteOldImageActivity({
        userId,
        imageType,
        imageId: previousImageId,
      })
    }

    log.info('Image processing workflow completed successfully', { userId, imageType, imageId })
  } catch (error) {
    log.error('Image processing workflow failed', { userId, imageType, imageId, error })

    // Try to update the profile status to failed
    try {
      await updateProfileImageDataActivity({
        userId,
        imageType,
        imageId,
        basePath,
        status: 'failed',
      })
    } catch (updateError) {
      log.error('Failed to update profile status to failed', { userId, imageType, updateError })
    }

    // Re-throw the error
    if (error instanceof ApplicationFailure) {
      throw error
    }
    throw ApplicationFailure.nonRetryable(
      error instanceof Error ? error.message : 'Unknown error during image processing',
      'IMAGE_PROCESSING_FAILED'
    )
  }
}
