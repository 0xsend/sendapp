/**
 * Returns optimized image source URI with progressive fallbacks.
 * Supports primary URI, fallback URI, and default banner generation.
 * Designed to work with Avatar component which handles cross-platform caching.
 *
 * @param uri - Primary image URI
 * @param fallbackUri - Optional fallback URI (e.g., avatar_url for banners)
 * @param sendid - Optional sendid for default banner generation
 * @returns Optimized image source URI
 */
export function getImageSource(
  uri?: string | null,
  fallbackUri?: string | null,
  sendid?: number | null
): string {
  // Return primary URI if available
  if (uri) {
    return uri
  }

  // Return fallback URI if available
  if (fallbackUri) {
    return fallbackUri
  }

  // Generate progressive default banner image if sendid is available
  if (sendid !== null && sendid !== undefined) {
    const imageIndex = ((sendid ?? 0) % 3) + 1
    return `https://ghassets.send.app/app_images/auth_image_${imageIndex}.jpg`
  }

  // Return empty string as final fallback
  return ''
}

/**
 * Returns platform-specific image props for a given URI.
 * This helper provides optimized source configuration for cross-platform usage.
 *
 * @param uri - Primary image URI
 * @returns Platform-specific image props object
 */
export function imagePropsForUri(uri?: string | null) {
  if (!uri) {
    return {}
  }

  // Return platform-specific props
  return {
    source: {
      uri,
    },
  }
}
