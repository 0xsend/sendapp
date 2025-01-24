import { useState, useEffect } from 'react'
import QRCode, { type QRCodeToStringOptions as QRCodeOptions } from 'qrcode'

interface UseQRCodeResult {
  qrCodeUrl: string
  error: Error | null
  logoOverlay?: {
    uri: string
    size: number
    position: {
      top: string
      left: string
      transform: string
    }
  }
}

export function useQRCode(
  text: string | undefined,
  options: QRCodeOptions & { logo?: { path: string; size?: number } }
): UseQRCodeResult {
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!text) return

    const generateQRCode = async () => {
      try {
        const svgString = await QRCode.toString(text, {
          type: 'svg',
          width: options.width ?? 240,
          margin: options.margin ?? 1,
          errorCorrectionLevel: options.errorCorrectionLevel ?? 'H',
          color: {
            dark: options.color?.dark ?? '#000000',
            light: options.color?.light ?? '#ffffff',
          },
        })

        setQrCodeUrl(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to generate QR code'))
        console.error('QR code generation error:', err)
      }
    }

    generateQRCode()
  }, [
    text,
    options.width,
    options.margin,
    options.errorCorrectionLevel,
    options.color?.dark,
    options.color?.light,
  ])

  const logoOverlay = options.logo
    ? {
        uri: options.logo.path,
        size: options.logo.size ?? 36,
        position: {
          top: '50%',
          left: '50%',
          transform: 'translate(-18px, -18px)',
        },
      }
    : undefined

  return { qrCodeUrl, error, logoOverlay }
}
