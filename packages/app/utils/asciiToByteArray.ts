/**
 * Converts an ASCII-compatible string to a Uint8Array.
 * Only accepts characters with code points <= 255 (single-byte characters).
 * Throws an error when encountering characters with code points > 255.
 *
 * @param str - The ASCII-compatible string to convert
 * @returns A Uint8Array representation of the string
 */
export function asciiToByteArray(str: string) {
  const bytes = new Uint8Array(str.length)

  for (let i = 0; i < str.length; ++i) {
    const codePoint = str.charCodeAt(i)

    if (codePoint > 255) {
      throw new Error(
        `Character at index ${i} has code point ${codePoint}, which exceeds the valid range for Uint8Array (0-255)`
      )
    }

    bytes[i] = codePoint
  }

  return bytes
}
