import { Avatar, type AvatarProps, Spinner, YStack } from 'tamagui'
import { BlurhashPlaceholder } from './BlurhashPlaceholder'

/** Image variant URLs for different formats */
interface VariantUrls {
  webp: string
  jpeg: string
}

/** Structured image data with optimized variants and processing status */
export interface ImageData {
  version: number
  imageId: string
  baseUrl: string
  blurhash: string
  processingStatus: 'pending' | 'complete' | 'failed'
  variants: Record<string, VariantUrls>
}

export interface ProfileAvatarProps extends Omit<AvatarProps, 'children'> {
  /** Legacy avatar URL string */
  avatarUrl?: string
  /** New structured image data with variants and blurhash */
  avatarData?: ImageData | null
}

/**
 * Get the best avatar URL from either new ImageData or legacy URL.
 * Prefers the new format when processing is complete.
 */
function getAvatarUrlFromData(
  avatarData: ImageData | null | undefined,
  legacyUrl: string | undefined,
  size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' = 'md'
): string {
  if (avatarData?.processingStatus === 'complete') {
    const variant = avatarData.variants[size]
    if (variant?.webp) return variant.webp
  }
  return legacyUrl || ''
}

export function ProfileAvatar({ avatarUrl, avatarData, ...props }: ProfileAvatarProps) {
  const isProcessing = avatarData?.processingStatus === 'pending'
  const isFailed = avatarData?.processingStatus === 'failed'
  const resolvedUrl = getAvatarUrlFromData(avatarData, avatarUrl)
  const blurhash = avatarData?.blurhash

  return (
    <Avatar $gtMd={{ size: 133.5 }} size={'$10'} borderRadius={'$3'} {...props}>
      <Avatar.Image $gtMd={{ w: 133.5, h: 133.5 }} w={'$10'} h="$10" src={resolvedUrl} />
      <Avatar.Fallback backgroundColor="$backgroundFocus">
        {/* Render blurhash preview if available */}
        {blurhash && <BlurhashPlaceholder blurhash={blurhash} />}
        {isProcessing && (
          <YStack f={1} jc="center" ai="center" zIndex={1}>
            <Spinner size="small" />
          </YStack>
        )}
        {isFailed && (
          <YStack f={1} jc="center" ai="center" opacity={0.5} zIndex={1}>
            {/* Failed state - show muted placeholder */}
          </YStack>
        )}
      </Avatar.Fallback>
    </Avatar>
  )
}
