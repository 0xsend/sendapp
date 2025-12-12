import NextImage, { type ImageProps as NextImageProps } from 'next/image'
import type { CSSProperties } from 'react'
import { forwardRef } from 'react'
import type { UniversalImageProps } from './types'

export type { UniversalImageProps }

export const FastImage = forwardRef<HTMLImageElement, UniversalImageProps>(
  (
    {
      src,
      alt = '',
      width,
      height,
      contentFit,
      objectFit,
      placeholder = 'empty',
      blurDataURL,
      priority = false,
      loading = 'lazy',
      quality = 75,
      sizes,
      onLoad,
      onError,
      onLoadStart,
      onLoadEnd,
      transition,
      unoptimized = false,
      loader,
      style,
      className,
      borderRadius,
      fill,
      contentPosition,
      cachePolicy,
      ...rest
    },
    ref
  ) => {
    let imageSrc: string | NextImageProps['src'] = src as string

    if (typeof src === 'object' && src !== null && 'uri' in src) {
      imageSrc = src.uri || ''
    }

    // If src is a number (static import), use it directly
    if (typeof src === 'number') {
      imageSrc = src as unknown as NextImageProps['src']
    }

    const finalObjectFit = objectFit || contentFit || 'cover'

    let nextPlaceholder: 'blur' | 'empty' = placeholder === 'blur' ? 'blur' : 'empty'
    let nextBlurDataURL = blurDataURL

    if (typeof placeholder === 'string' && placeholder.startsWith('data:image')) {
      nextPlaceholder = 'blur'
      nextBlurDataURL = placeholder
    }

    const transitionStyle: CSSProperties = transition
      ? {
          transition: `opacity ${transition}ms ease-in-out`,
        }
      : {}

    const combinedStyle: CSSProperties = {
      ...transitionStyle,
      ...(borderRadius ? { borderRadius } : {}),
      ...(finalObjectFit ? { objectFit: finalObjectFit } : {}),
      ...(style as CSSProperties),
    }

    if (fill) {
      return (
        <NextImage
          ref={ref}
          src={imageSrc}
          alt={alt}
          fill
          placeholder={nextPlaceholder}
          blurDataURL={nextBlurDataURL}
          priority={typeof priority === 'boolean' ? priority : priority === 'high'}
          loading={loading}
          quality={quality}
          sizes={sizes}
          onLoad={onLoad as NextImageProps['onLoad']}
          onError={onError as NextImageProps['onError']}
          unoptimized={unoptimized}
          loader={loader}
          style={combinedStyle}
          className={className}
          {...rest}
        />
      )
    }

    if (!width || !height) {
      console.warn('FastImage requires width and height props when not using fill prop')
    }

    return (
      <NextImage
        ref={ref}
        src={imageSrc}
        alt={alt}
        width={width || 0}
        height={height || 0}
        placeholder={nextPlaceholder}
        blurDataURL={nextBlurDataURL}
        priority={typeof priority === 'boolean' ? priority : priority === 'high'}
        loading={loading}
        quality={quality}
        sizes={sizes}
        onLoad={onLoad as NextImageProps['onLoad']}
        onError={onError as NextImageProps['onError']}
        unoptimized={unoptimized}
        loader={loader}
        style={combinedStyle}
        className={className}
        {...rest}
      />
    )
  }
)

FastImage.displayName = 'FastImage'
