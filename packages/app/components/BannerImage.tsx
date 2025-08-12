import { Image, isWeb, type ImageProps } from '@my/ui'
import { imagePropsForUri } from 'app/utils/imagePropsForUri'
import { useEffect } from 'react'

export interface BannerImageProps extends Omit<ImageProps, 'source'> {
  uri: string
  prefetch?: boolean // Optional flag to enable native prefetching
}

export function BannerImage({ uri, prefetch = false, ...props }: BannerImageProps) {
  const platformProps = imagePropsForUri(uri)

  // Optional native prefetch - primes disk cache before first paint
  useEffect(() => {
    if (!isWeb && prefetch && uri) {
      // Dynamically import Image from react-native only on native platforms
      import('react-native')
        .then(({ Image: RNImage }) => {
          RNImage.prefetch(uri).catch(() => {
            // Silently ignore prefetch failures to avoid any behavioral changes
          })
        })
        .catch(() => {
          // Silently ignore import failures
        })
    }
  }, [uri, prefetch])

  return <Image objectFit="cover" borderRadius="$5" {...platformProps} {...props} />
}
