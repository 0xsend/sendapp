import type { Hex } from 'viem'

// Base58 alphabet (Bitcoin style - no 0, O, I, l to avoid confusion)
const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'

/**
 * Encode bytes to Base58 string
 */
function encodeBase58(bytes: Uint8Array): string {
  // Convert bytes to a big integer
  let num = 0n
  for (const byte of bytes) {
    num = num * 256n + BigInt(byte)
  }

  // Convert to base58
  let result = ''
  while (num > 0n) {
    const remainder = Number(num % 58n)
    num = num / 58n
    result = BASE58_ALPHABET[remainder] + result
  }

  // Add leading '1's for each leading zero byte
  for (const byte of bytes) {
    if (byte === 0) {
      result = `1${result}`
    } else {
      break
    }
  }

  return result || '1'
}

/**
 * Decode Base58 string to bytes
 */
function decodeBase58(str: string): Uint8Array {
  // Convert from base58 to big integer
  let num = 0n
  for (const char of str) {
    const index = BASE58_ALPHABET.indexOf(char)
    if (index === -1) {
      throw new Error(`Invalid Base58 character: ${char}`)
    }
    num = num * 58n + BigInt(index)
  }

  // Convert to bytes
  const bytes: number[] = []
  while (num > 0n) {
    bytes.unshift(Number(num % 256n))
    num = num / 256n
  }

  // Add leading zeros for each leading '1'
  for (const char of str) {
    if (char === '1') {
      bytes.unshift(0)
    } else {
      break
    }
  }

  return new Uint8Array(bytes)
}

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
 * Format: XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX
 */
export function encodeCheckCode(privateKey: Hex): string {
  // Remove 0x prefix and convert to bytes
  const hexStr = privateKey.slice(2)
  const bytes = new Uint8Array(hexStr.length / 2)
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = Number.parseInt(hexStr.slice(i * 2, i * 2 + 2), 16)
  }

  const base58 = encodeBase58(bytes)
  return formatWithDashes(base58, 4)
}

/**
 * Decode a human-readable check code back to a private key
 */
export function decodeCheckCode(code: string): Hex | null {
  try {
    const base58 = unformat(code)
    const bytes = decodeBase58(base58)

    // Pad to 32 bytes if needed
    const paddedBytes = new Uint8Array(32)
    paddedBytes.set(bytes, 32 - bytes.length)

    // Convert to hex
    const hexStr = Array.from(paddedBytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')

    return `0x${hexStr}` as Hex
  } catch {
    return null
  }
}

/**
 * Check if a string looks like a valid check code
 */
export function isValidCheckCodeFormat(code: string): boolean {
  const cleaned = unformat(code)
  // Should be ~44 chars of base58
  if (cleaned.length < 40 || cleaned.length > 50) return false
  // All chars should be valid base58
  return [...cleaned].every((c) => BASE58_ALPHABET.includes(c))
}
