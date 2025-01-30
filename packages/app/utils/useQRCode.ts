import { type UseQueryResult, useQuery } from '@tanstack/react-query'
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
): UseQueryResult<UseQRCodeResult> {
  return useQuery({
    queryKey: ['qrcode', text, JSON.stringify(options)],
    queryFn: async () => {
      if (!text) {
        throw new Error('Text is required for QR code generation')
      }

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

      const qrCodeUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`

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

      return {
        qrCodeUrl,
        error: null,
        logoOverlay,
      }
    },
    enabled: !!text,
  })
}
