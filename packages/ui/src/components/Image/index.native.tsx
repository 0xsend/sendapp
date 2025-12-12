import { Image as ExpoImage, type ImageProps as ExpoImageProps } from 'expo-image'
import type { ImageStyle, StyleProp } from 'react-native'
import { forwardRef } from 'react'
import type { UniversalImageProps } from './types'

export type { UniversalImageProps }

export const FastImage = forwardRef<ExpoImage, UniversalImageProps>(
  (
    {
      src,
      alt,
      width,
      height,
      contentFit = 'cover',
      contentPosition,
      placeholder = 'empty',
      blurDataURL,
      priority = false,
      loading,
      quality,
      onLoad,
      onError,
      onLoadStart,
      onLoadEnd,
      transition,
      cachePolicy = 'disk',
      unoptimized,
      style,
      borderRadius,
      objectFit,
      fill,
      sizes,
      loader,
      className,
      ...rest
    },
    ref
  ) => {
    let imageSource: ExpoImageProps['source'] = null

    if (src) {
      if (typeof src === 'string') {
        imageSource = src
      } else if (typeof src === 'number') {
        imageSource = src
      } else if (typeof src === 'object' && src !== null) {
        if ('uri' in src) {
          imageSource = src.uri || null
        } else {
          imageSource = src as ExpoImageProps['source']
        }
      }
    }

    let expoPlaceholder: ExpoImageProps['placeholder'] = null

    if (placeholder) {
      if (placeholder === 'blur' && blurDataURL) {
        if (blurDataURL && !blurDataURL.startsWith('data:')) {
          expoPlaceholder = { blurhash: blurDataURL }
        } else {
          expoPlaceholder = null
        }
      } else if (typeof placeholder === 'object' && placeholder !== null) {
        expoPlaceholder = placeholder
      } else if (typeof placeholder === 'string' && !placeholder.startsWith('data:')) {
        expoPlaceholder = { blurhash: placeholder }
      }
    }

    const expoPriority: 'low' | 'normal' | 'high' | null =
      typeof priority === 'boolean' ? (priority ? 'high' : 'normal') : priority || 'normal'

    let expoTransition: ExpoImageProps['transition'] = null
    if (transition) {
      if (typeof transition === 'number') {
        expoTransition = transition
      } else if (typeof transition === 'object') {
        expoTransition = transition as ExpoImageProps['transition']
      }
    }

    const finalContentFit = contentFit || objectFit || 'cover'

    const imageStyle: StyleProp<ImageStyle> = [
      width && { width },
      height && { height },
      borderRadius && { borderRadius },
      style,
    ].filter(Boolean) as StyleProp<ImageStyle>

    const handleLoad = onLoad
      ? (event: Parameters<NonNullable<ExpoImageProps['onLoad']>>[0]) => {
          if (onLoad) {
            onLoad({
              source: {
                width: event?.source?.width || 0,
                height: event?.source?.height || 0,
                url: (typeof imageSource === 'string' ? imageSource : '') || '',
              },
            })
          }
        }
      : undefined

    const handleError = onError
      ? (event: { error: string }) => {
          if (onError) {
            onError(event)
          }
        }
      : undefined

    return (
      <ExpoImage
        ref={ref}
        source={imageSource}
        alt={alt}
        contentFit={finalContentFit}
        contentPosition={contentPosition as ExpoImageProps['contentPosition']}
        placeholder={expoPlaceholder}
        priority={expoPriority}
        cachePolicy={cachePolicy}
        transition={expoTransition}
        onLoad={handleLoad}
        onError={handleError}
        onLoadStart={onLoadStart}
        onLoadEnd={onLoadEnd}
        style={imageStyle}
        accessibilityLabel={alt}
        {...rest}
      />
    )
  }
)

FastImage.displayName = 'FastImage'
