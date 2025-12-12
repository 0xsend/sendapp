/**
 * Unified Image component props that work across web and native
 * This ensures type consistency between platform implementations
 */
export interface UniversalImageProps {
  /**
   * Image source - can be a URL string, static import, or ImageSource object
   */
  src?: string | number | { uri?: string; blurhash?: string; thumbhash?: string } | null
  /**
   * Alternative text for accessibility
   */
  alt?: string
  /**
   * Image width in pixels
   */
  width?: number
  /**
   * Image height in pixels
   */
  height?: number
  /**
   * How the image should be resized to fit its container
   * Maps to Next.js objectFit and Expo contentFit
   */
  contentFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down'
  /**
   * Position of the image within its container
   */
  contentPosition?: string | { x?: number | string; y?: number | string }
  /**
   * Placeholder to show while loading
   * Can be 'blur', 'empty', or a data URL string
   */
  placeholder?: 'blur' | 'empty' | string | { blurhash?: string; thumbhash?: string }
  /**
   * Blur data URL for blur placeholder (Next.js)
   * or blurhash string (Expo)
   */
  blurDataURL?: string
  /**
   * Priority loading - should be used for above-the-fold images
   * On web: boolean
   * On native: 'low' | 'normal' | 'high' | boolean
   */
  priority?: 'low' | 'normal' | 'high' | boolean
  /**
   * Loading behavior - 'lazy' or 'eager'
   */
  loading?: 'lazy' | 'eager'
  /**
   * Image quality (1-100)
   */
  quality?: number
  /**
   * Sizes attribute for responsive images (web only)
   */
  sizes?: string
  /**
   * Callback when image loads successfully
   */
  onLoad?: (event?: { source?: { width?: number; height?: number; url?: string } }) => void
  /**
   * Callback when image fails to load
   */
  onError?: (error?: { error?: string } | Error) => void
  /**
   * Callback when image starts loading
   */
  onLoadStart?: () => void
  /**
   * Callback when image load completes (success or failure)
   */
  onLoadEnd?: () => void
  /**
   * Transition duration in milliseconds or transition config object
   */
  transition?: number | { duration?: number; effect?: string; timing?: string }
  /**
   * Cache policy
   */
  cachePolicy?: 'none' | 'disk' | 'memory' | 'memory-disk'
  /**
   * Whether to disable optimization (useful for SVGs, small images)
   */
  unoptimized?: boolean
  /**
   * Custom loader function (web only)
   */
  loader?: (props: { src: string; width: number; quality?: number }) => string
  /**
   * Additional styles
   */
  style?: Record<string, unknown> | Array<Record<string, unknown>>
  /**
   * CSS class name (web only)
   */
  className?: string
  /**
   * Border radius
   */
  borderRadius?: number | string
  /**
   * Object fit (web only, maps to contentFit)
   */
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down'
  /**
   * Fill parent container (web only)
   */
  fill?: boolean
  /**
   * All other platform-specific props
   */
  [key: string]: unknown
}
