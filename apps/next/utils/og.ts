/**
 * Shared utilities for OpenGraph image generation
 */

// Simple font cache to avoid re-downloading
export const fontCache = new Map<string, ArrayBuffer>()

/**
 * Load a Google Font with specific weight, optimized for the given text
 * Uses per-request subsetting via the text= parameter for optimal performance
 * @see https://developers.google.com/fonts/docs/css2#optimize_your_font_requests
 */
export async function loadGoogleFont(
  font: string,
  weight: number,
  text: string
): Promise<ArrayBuffer> {
  // Include the exact glyph subset in the cache key.
  // Normalizing to a unique+sorted set prevents reusing a smaller subset from a
  // previous request, which caused missing bold glyphs in OG images.
  const normalizedText = Array.from(new Set(text)).sort().join('')
  const cacheKey = `${font}-${weight}-${normalizedText}`

  // Check cache first
  if (fontCache.has(cacheKey)) {
    return fontCache.get(cacheKey) as ArrayBuffer
  }

  try {
    const encodedFamily = encodeURIComponent(font).replace(/%20/g, '+')
    const url = `https://fonts.googleapis.com/css2?family=${encodedFamily}:wght@${weight}&text=${encodeURIComponent(normalizedText)}&display=swap`

    const cssResponse = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    })

    if (!cssResponse.ok) {
      throw new Error(`Failed to fetch CSS: ${cssResponse.status}`)
    }

    const css = await cssResponse.text()
    const resource = css.match(/src: url\((.+?)\) format\('(woff2?|opentype|truetype)'\)/)

    if (resource) {
      const fontResponse = await fetch(resource[1], {
        headers: { 'User-Agent': 'Mozilla/5.0' },
      })

      if (fontResponse.ok) {
        const fontData = await fontResponse.arrayBuffer()
        fontCache.set(cacheKey, fontData)
        return fontData
      }
    }
  } catch (error) {
    console.warn(`Font loading failed for ${font}:${weight}:`, error)
  }

  throw new Error(`Failed to load font data for ${font}:${weight}`)
}

/**
 * Safe decode patterned after validateRedirectUrl.ts (decode inside try/catch and fallback)
 * @see apps/next/utils/validateRedirectUrl.ts
 */
export function safeDecode(input: string | undefined | null): string | undefined {
  if (!input) return undefined
  try {
    return decodeURIComponent(input)
  } catch {
    return input || undefined
  }
}
