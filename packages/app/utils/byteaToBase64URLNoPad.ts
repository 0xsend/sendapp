import { base64, base64urlnopad } from '@scure/base'
import { assert } from './assert'
import { byteaToBytes } from './byteaToBytes'

/**
 * Converts a Postgres bytea string to a base64 URL no pad string
 * @param str
 * @returns base64 string
 */
export function byteaToBase64URLNoPad(str: `\\x${string}`): string {
  assert(str.startsWith('\\x'), 'Hex string must start with \\x')
  return base64urlnopad.encode(byteaToBytes(str))
}
