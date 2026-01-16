import { encode, decode } from 'blurhash'
import { Platform } from 'react-native'

/**
 * Generate a blurhash from a base64 image string.
 * On web, uses Canvas API to get pixel data.
 * On native, returns undefined (server will generate it).
 */
export async function generateBlurhash(
  base64Image: string,
  imageType: 'avatar' | 'banner'
): Promise<string | undefined> {
  // On native platforms, let the server generate blurhash
  // Client-side blurhash on mobile requires native modules
  if (Platform.OS !== 'web') {
    return undefined
  }

  return generateBlurhashWeb(base64Image, imageType)
}

/**
 * Web implementation using Canvas API
 */
async function generateBlurhashWeb(
  base64Image: string,
  imageType: 'avatar' | 'banner'
): Promise<string | undefined> {
  try {
    // Create an image element to load the base64 data
    const img = new Image()
    img.crossOrigin = 'anonymous'

    const imageLoaded = new Promise<HTMLImageElement>((resolve, reject) => {
      img.onload = () => resolve(img)
      img.onerror = reject
    })

    // Handle base64 string format
    const dataUrl = base64Image.includes('data:')
      ? base64Image
      : `data:image/jpeg;base64,${base64Image}`

    img.src = dataUrl
    await imageLoaded

    // Create a canvas to get pixel data
    // Use a small size for efficient blurhash calculation
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return undefined

    // Resize to 32x32 for efficient processing
    const size = 32
    canvas.width = size
    canvas.height = size
    ctx.drawImage(img, 0, 0, size, size)

    const imageData = ctx.getImageData(0, 0, size, size)

    // Use different component counts for avatars vs banners
    // Avatars: 4x4 (square), Banners: 6x4 (wider aspect)
    const componentX = imageType === 'banner' ? 6 : 4
    const componentY = 4

    const blurhash = encode(imageData.data, size, size, componentX, componentY)

    return blurhash
  } catch (error) {
    console.warn('Failed to generate blurhash:', error)
    return undefined
  }
}

/**
 * Decode a blurhash to pixel data.
 * Returns Uint8ClampedArray of RGBA values.
 */
export function decodeBlurhash(
  blurhash: string,
  width: number,
  height: number
): Uint8ClampedArray | undefined {
  try {
    if (!blurhash || blurhash.length < 6) return undefined
    return decode(blurhash, width, height)
  } catch (error) {
    console.warn('Failed to decode blurhash:', error)
    return undefined
  }
}

/**
 * Extract the average color from a blurhash string.
 * This is a simplified extraction that gets the DC component.
 */
export function getBlurhashAverageColor(blurhash: string): string | undefined {
  try {
    if (!blurhash || blurhash.length < 6) return undefined
    // Decode to a tiny 1x1 image to get average color
    const pixels = decode(blurhash, 1, 1)
    const r = pixels[0]
    const g = pixels[1]
    const b = pixels[2]
    return `rgb(${r}, ${g}, ${b})`
  } catch (error) {
    console.warn('Failed to extract average color from blurhash:', error)
    return undefined
  }
}
