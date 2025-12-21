import { base32 } from '@scure/base'
import type { Hex } from 'viem'

/**
 * Format a string with dashes every N characters
 */
function formatWithDashes(str: string, groupSize = 4): string {
  const groups: string[] = []
  for (let i = 0; i < str.length; i += groupSize) {
    groups.push(str.slice(i, i + groupSize))
  }
  return groups.join('-')
}

/**
 * Remove dashes and whitespace from a formatted code
 */
function unformat(code: string): string {
  return code.replace(/[-\s]/g, '')
}

/**
 * Encode a private key to a human-readable check code
 * Uses Base32 (RFC 4648) for all-uppercase output
 * Format: XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XX
 */
export function encodeCheckCode(privateKey: Hex): string {
  // Remove 0x prefix and convert to bytes
  const hexStr = privateKey.slice(2)
  const bytes = new Uint8Array(hexStr.length / 2)
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = Number.parseInt(hexStr.slice(i * 2, i * 2 + 2), 16)
  }

  // Base32 encode (all uppercase A-Z and 2-7, strip padding)
  const encoded = base32.encode(bytes).replace(/=+$/, '')
  return formatWithDashes(encoded, 4)
}

/**
 * Decode a human-readable check code back to a private key
 */
export function decodeCheckCode(code: string): Hex | null {
  try {
    // Remove dashes/spaces and convert to uppercase for case-insensitive decode
    const cleaned = unformat(code).toUpperCase()
    // Add padding back for base32 decoder (must be multiple of 8)
    const padLength = (8 - (cleaned.length % 8)) % 8
    const padded = cleaned + '='.repeat(padLength)
    const bytes = base32.decode(padded)

    if (bytes.length !== 32) return null

    // Convert to hex
    const hexStr = Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')

    return `0x${hexStr}` as Hex
  } catch {
    return null
  }
}

// Base32 alphabet (RFC 4648)
const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

/**
 * Check if a string looks like a valid check code format
 */
export function isValidCheckCodeFormat(code: string): boolean {
  const cleaned = unformat(code).toUpperCase()
  // Base32 of 32 bytes without padding = 52 chars
  if (cleaned.length < 50 || cleaned.length > 54) return false
  // All chars should be valid Base32
  return [...cleaned].every((c) => BASE32_ALPHABET.includes(c))
}
