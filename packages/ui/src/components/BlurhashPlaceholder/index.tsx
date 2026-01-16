import { decode } from 'blurhash'
import { useEffect, useRef } from 'react'
import { YStack, type YStackProps } from 'tamagui'

export interface BlurhashPlaceholderProps extends Omit<YStackProps, 'children'> {
  /** Blurhash string to render */
  blurhash: string
  /** Width of the decoded image (default: 32) */
  decodeWidth?: number
  /** Height of the decoded image (default: 32) */
  decodeHeight?: number
  /** Punch factor for contrast (default: 1) */
  punch?: number
}

/**
 * Renders a blurhash preview image using canvas on web.
 * The canvas is stretched to fill the container.
 */
export function BlurhashPlaceholder({
  blurhash,
  decodeWidth = 32,
  decodeHeight = 32,
  punch = 1,
  ...props
}: BlurhashPlaceholderProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current || !blurhash) return

    try {
      const pixels = decode(blurhash, decodeWidth, decodeHeight, punch)
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      canvas.width = decodeWidth
      canvas.height = decodeHeight

      const imageData = ctx.createImageData(decodeWidth, decodeHeight)
      imageData.data.set(pixels)
      ctx.putImageData(imageData, 0, 0)
    } catch {
      // Invalid blurhash - fail silently
    }
  }, [blurhash, decodeWidth, decodeHeight, punch])

  if (!blurhash) return null

  return (
    <YStack position="absolute" inset={0} overflow="hidden" {...props}>
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }}
      />
    </YStack>
  )
}
