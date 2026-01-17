import { bootstrap } from '../utils/bootstrap'
import { isRetryableDBError } from '../utils/isRetryableDBError'
import { ApplicationFailure, log } from '@temporalio/activity'
import { encode as encodeBlurhash } from 'blurhash'
import { createSupabaseAdminClient } from 'app/utils/supabase/admin'
// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
const sharp: typeof import('sharp') = require('sharp')
import {
  AVATAR_SIZES,
  BANNER_SIZES,
  type DeleteOldImageInput,
  type DeleteOriginalUploadInput,
  type GenerateBlurhashInput,
  type GenerateBlurhashOutput,
  type ImageType,
  type ProcessVariantInput,
  type UpdateProfileBlurhashInput,
  type UpdateProfileImageDataInput,
} from './types'

export interface ImageActivities {
  processVariantActivity: (input: ProcessVariantInput) => Promise<void>
  updateProfileImageDataActivity: (input: UpdateProfileImageDataInput) => Promise<void>
  updateProfileBlurhashActivity: (input: UpdateProfileBlurhashInput) => Promise<void>
  deleteOldImageActivity: (input: DeleteOldImageInput) => Promise<void>
  deleteOriginalUploadActivity: (input: DeleteOriginalUploadInput) => Promise<void>
  generateBlurhashActivity: (input: GenerateBlurhashInput) => Promise<GenerateBlurhashOutput>
}

export function createImageActivities(env: Record<string, string | undefined>): ImageActivities {
  bootstrap(env)

  return {
    processVariantActivity,
    updateProfileImageDataActivity,
    updateProfileBlurhashActivity,
    deleteOldImageActivity,
    deleteOriginalUploadActivity,
    generateBlurhashActivity,
  }
}

async function processVariantActivity(input: ProcessVariantInput): Promise<void> {
  const { sourcePath, outputPath, width, height, format, quality } = input
  const supabase = createSupabaseAdminClient()

  log.info('Processing image variant', { sourcePath, outputPath, width, height, format })

  // Download source image
  const { data: sourceData, error: downloadError } = await supabase.storage
    .from('avatars')
    .download(sourcePath)

  if (downloadError) {
    log.error('Failed to download source image', { sourcePath, error: downloadError })
    throw ApplicationFailure.retryable(
      `Failed to download source image: ${downloadError.message}`,
      downloadError.name
    )
  }

  const sourceBuffer = Buffer.from(await sourceData.arrayBuffer())

  // Process image (upscale if source is smaller than target)
  const sharpInstance = sharp(sourceBuffer).resize(width, height, {
    fit: 'cover',
    withoutEnlargement: false, // Allow upscaling
  })

  // Apply format-specific processing
  const processed = await (format === 'webp'
    ? sharpInstance.webp({ quality })
    : sharpInstance.jpeg({ quality })
  ).toBuffer()

  // Upload processed variant
  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(outputPath, processed, {
      contentType: `image/${format}`,
      cacheControl: '31536000', // 1 year (immutable)
      upsert: true,
    })

  if (uploadError) {
    log.error('Failed to upload processed variant', { outputPath, error: uploadError })
    throw ApplicationFailure.retryable(
      `Failed to upload processed variant: ${uploadError.message}`,
      uploadError.name
    )
  }

  log.info('Successfully processed and uploaded variant', { outputPath })
}

async function updateProfileImageDataActivity(input: UpdateProfileImageDataInput): Promise<void> {
  const { userId, imageType, imageId, basePath, status } = input
  const supabase = createSupabaseAdminClient()

  log.info('Updating profile image data', { userId, imageType, imageId, status })

  const {
    data: { publicUrl: baseUrl },
  } = supabase.storage.from('avatars').getPublicUrl(basePath)

  const sizes = getSizesForImageType(imageType)

  const variants = Object.fromEntries(
    sizes.map((variant) => [
      variant,
      {
        webp: `${baseUrl}/${variant}.webp`,
        jpeg: `${baseUrl}/${variant}.jpeg`,
      },
    ])
  )

  const column = imageType === 'avatar' ? 'avatar_data' : 'banner_data'

  // First get the current data to preserve blurhash
  const { data: currentProfile, error: fetchError } = await supabase
    .from('profiles')
    .select(column)
    .eq('id', userId)
    .single()

  if (fetchError) {
    log.error('Failed to fetch current profile', { userId, error: fetchError })
    if (isRetryableDBError(fetchError)) {
      throw ApplicationFailure.retryable(
        `Failed to fetch profile: ${fetchError.message}`,
        fetchError.code
      )
    }
    throw ApplicationFailure.nonRetryable(
      `Failed to fetch profile: ${fetchError.message}`,
      fetchError.code
    )
  }

  const currentData = currentProfile ? (currentProfile[column] ?? {}) : {}

  // Only update if the current imageId matches (prevents stale workflows overwriting newer uploads)
  const updatePayload = {
    [column]: {
      ...(currentData as Record<string, unknown>),
      processingStatus: status,
      baseUrl,
      imageId,
      variants,
    },
  }

  const { error: updateError } = await supabase
    .from('profiles')
    .update(updatePayload)
    .eq('id', userId)
    .filter(`${column}->>imageId`, 'eq', imageId)

  if (updateError) {
    log.error('Failed to update profile image data', { userId, imageType, error: updateError })
    if (isRetryableDBError(updateError)) {
      throw ApplicationFailure.retryable(
        `Failed to update profile: ${updateError.message}`,
        updateError.code
      )
    }
    throw ApplicationFailure.nonRetryable(
      `Failed to update profile: ${updateError.message}`,
      updateError.code
    )
  }

  log.info('Successfully updated profile image data', { userId, imageType, status })
}

async function updateProfileBlurhashActivity(input: UpdateProfileBlurhashInput): Promise<void> {
  const { userId, imageType, imageId, blurhash } = input
  const supabase = createSupabaseAdminClient()
  const column = imageType === 'avatar' ? 'avatar_data' : 'banner_data'

  log.info('Updating profile blurhash', { userId, imageType, imageId })

  // First get the current data
  const { data: currentProfile, error: fetchError } = await supabase
    .from('profiles')
    .select(column)
    .eq('id', userId)
    .single()

  if (fetchError) {
    log.error('Failed to fetch current profile for blurhash update', { userId, error: fetchError })
    if (isRetryableDBError(fetchError)) {
      throw ApplicationFailure.retryable(
        `Failed to fetch profile: ${fetchError.message}`,
        fetchError.code
      )
    }
    throw ApplicationFailure.nonRetryable(
      `Failed to fetch profile: ${fetchError.message}`,
      fetchError.code
    )
  }

  const currentData = currentProfile ? (currentProfile[column] ?? {}) : {}

  // Only update if the current imageId matches
  const updatePayload = {
    [column]: {
      ...(currentData as Record<string, unknown>),
      blurhash,
    },
  }

  const { error: updateError } = await supabase
    .from('profiles')
    .update(updatePayload)
    .eq('id', userId)
    .filter(`${column}->>imageId`, 'eq', imageId)

  if (updateError) {
    log.error('Failed to update profile blurhash', { userId, imageType, error: updateError })
    if (isRetryableDBError(updateError)) {
      throw ApplicationFailure.retryable(
        `Failed to update profile blurhash: ${updateError.message}`,
        updateError.code
      )
    }
    throw ApplicationFailure.nonRetryable(
      `Failed to update profile blurhash: ${updateError.message}`,
      updateError.code
    )
  }

  log.info('Successfully updated profile blurhash', { userId, imageType })
}

async function deleteOldImageActivity(input: DeleteOldImageInput): Promise<void> {
  const { userId, imageType, imageId } = input
  const supabase = createSupabaseAdminClient()
  const folderPath = `${userId}/${imageType}/${imageId}`

  log.info('Deleting old image variants', { folderPath })

  // List and delete all files in the old image folder
  const { data: files, error: listError } = await supabase.storage.from('avatars').list(folderPath)

  if (listError) {
    // Don't fail the workflow for cleanup errors
    log.warn('Failed to list old image files', { folderPath, error: listError })
    return
  }

  if (files && files.length > 0) {
    const paths = files.map((f) => `${folderPath}/${f.name}`)
    const { error: removeError } = await supabase.storage.from('avatars').remove(paths)

    if (removeError) {
      // Don't fail the workflow for cleanup errors
      log.warn('Failed to remove old image files', { paths, error: removeError })
      return
    }

    log.info('Successfully deleted old image variants', { folderPath, count: files.length })
  }
}

async function deleteOriginalUploadActivity(input: DeleteOriginalUploadInput): Promise<void> {
  const { storagePath } = input
  const supabase = createSupabaseAdminClient()

  log.info('Deleting original upload', { storagePath })

  const { error } = await supabase.storage.from('avatars').remove([storagePath])

  if (error) {
    // Don't fail the workflow for cleanup errors
    log.warn('Failed to delete original upload', { storagePath, error })
    return
  }

  log.info('Successfully deleted original upload', { storagePath })
}

async function generateBlurhashActivity(
  input: GenerateBlurhashInput
): Promise<GenerateBlurhashOutput> {
  const { sourcePath, imageType } = input
  const supabase = createSupabaseAdminClient()

  log.info('Generating blurhash', { sourcePath, imageType })

  // Download source image
  const { data: sourceData, error: downloadError } = await supabase.storage
    .from('avatars')
    .download(sourcePath)

  if (downloadError) {
    log.error('Failed to download source image for blurhash', { sourcePath, error: downloadError })
    throw ApplicationFailure.nonRetryable(
      `Failed to download source image: ${downloadError.message}`,
      downloadError.name
    )
  }

  const sourceBuffer = Buffer.from(await sourceData.arrayBuffer())

  // Resize to a small thumbnail for blurhash calculation
  // Blurhash works best on small images (32x32 is sufficient)
  const { data: pixels, info } = await sharp(sourceBuffer)
    .resize(32, 32, { fit: 'cover' })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  // Use different component counts for avatars vs banners
  // Avatars: 4x4 (square), Banners: 6x4 (wider aspect)
  const componentX = imageType === 'banner' ? 6 : 4
  const componentY = 4

  const blurhash = encodeBlurhash(
    new Uint8ClampedArray(pixels),
    info.width,
    info.height,
    componentX,
    componentY
  )

  log.info('Generated blurhash', { sourcePath, blurhash })

  return { blurhash }
}

function getSizesForImageType(imageType: ImageType): string[] {
  return imageType === 'avatar'
    ? (Object.keys(AVATAR_SIZES) as string[])
    : (Object.keys(BANNER_SIZES) as string[])
}
