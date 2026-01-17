import { Image } from 'expo-image'
import { YStack, type YStackProps } from 'tamagui'

export interface BlurhashPlaceholderProps extends Omit<YStackProps, 'children'> {
  /** Blurhash string to render */
  blurhash: string
  /** Width of the decoded image (not used on native, expo-image handles it) */
  decodeWidth?: number
  /** Height of the decoded image (not used on native, expo-image handles it) */
  decodeHeight?: number
  /** Punch factor for contrast (not used on native) */
  punch?: number
}

/**
 * Renders a blurhash preview image using expo-image on native.
 * expo-image has built-in blurhash decoding support.
 */
export function BlurhashPlaceholder({
  blurhash,
  decodeWidth,
  decodeHeight,
  punch,
  ...props
}: BlurhashPlaceholderProps) {
  if (!blurhash) return null

  return (
    <YStack position="absolute" inset={0} overflow="hidden" {...props}>
      <Image source={{ blurhash }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
    </YStack>
  )
}
