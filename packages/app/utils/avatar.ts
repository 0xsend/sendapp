export type ProcessingStatus = 'pending' | 'complete' | 'failed'

export interface VariantUrls {
  webp: string
  jpeg: string
}

export interface ImageData {
  version: number
  imageId: string
  baseUrl: string
  blurhash: string
  processingStatus: ProcessingStatus
  variants: Record<string, VariantUrls>
}

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'
export type BannerSize = 'sm' | 'md' | 'lg'

/**
 * Get the optimized avatar URL for a given size.
 * Returns null if processing is not complete or data is unavailable.
 */
export function getAvatarUrl(
  avatarData: ImageData | null | undefined,
  size: AvatarSize = 'md'
): string | null {
  if (!avatarData || avatarData.processingStatus !== 'complete') {
    return null
  }

  const variant = avatarData.variants[size]
  if (!variant) return null

  // WebP for all platforms (iOS 14+, Android, and web all support it)
  return variant.webp
}

/**
 * Get the optimized banner URL for a given size.
 * Returns null if processing is not complete or data is unavailable.
 */
export function getBannerUrl(
  bannerData: ImageData | null | undefined,
  size: BannerSize = 'md'
): string | null {
  if (!bannerData || bannerData.processingStatus !== 'complete') {
    return null
  }

  const variant = bannerData.variants[size]
  if (!variant) return null

  return variant.webp
}

/**
 * Get the blurhash placeholder string from image data.
 * Returns undefined if no blurhash is available.
 */
export function getImagePlaceholder(imageData: ImageData | null | undefined): string | undefined {
  return imageData?.blurhash
}

/**
 * Check if image processing is currently pending.
 */
export function isImageProcessing(imageData: ImageData | null | undefined): boolean {
  return imageData?.processingStatus === 'pending'
}

/**
 * Check if image processing has failed.
 */
export function isImageFailed(imageData: ImageData | null | undefined): boolean {
  return imageData?.processingStatus === 'failed'
}

/**
 * Profile data with optional avatar fields.
 * This represents the shape of profile data from various sources (useUser, useProfileLookup, etc.)
 */
export interface ProfileWithAvatar {
  avatar_url?: string | null
  avatar_data?: ImageData | unknown | null
}

/**
 * Get the best avatar URL from profile data, preferring optimized avatar_data variants
 * when processing is complete, falling back to legacy avatar_url.
 *
 * @param profile Profile data with avatar fields
 * @param size Desired avatar size variant
 * @returns The best available avatar URL, or undefined if none available
 */
export function getProfileAvatarUrl(
  profile: ProfileWithAvatar | null | undefined,
  size: AvatarSize = 'md'
): string | undefined {
  if (!profile) return undefined

  // Try to get optimized URL from avatar_data first
  const avatarData = profile.avatar_data as ImageData | null | undefined
  const optimizedUrl = getAvatarUrl(avatarData, size)
  if (optimizedUrl) return optimizedUrl

  // Fall back to legacy avatar_url
  return profile.avatar_url ?? undefined
}
