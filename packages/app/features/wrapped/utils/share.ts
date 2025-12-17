import { Share } from 'react-native'
import type { WrappedData } from '../types'

/**
 * Generates shareable text for wrapped data
 */
export function generateWrappedShareText(data: WrappedData): string {
  const lines = ['Just wrapped up 2025 on @Send! 💚', '']

  // Add send score rank if available
  if (data.sendScoreRank !== null) {
    lines.push(`• Number #${data.sendScoreRank.toLocaleString()} sender`)
  }

  // Add transactions count
  lines.push(`• ${data.totalTransfers.toLocaleString()} transactions`)

  // Add unique recipients
  lines.push(`• ${data.uniqueRecipients.toLocaleString()} people sent with`)

  lines.push('')
  lines.push('Get your Send Wrapped at send.app')

  return lines.join('\n')
}

/**
 * Opens native share sheet with wrapped data
 * Works on both web and native platforms
 */
export async function shareWrappedToTwitter(data: WrappedData): Promise<void> {
  const text = generateWrappedShareText(data)

  await Share.share({
    message: text,
  }).catch(() => null)
}
