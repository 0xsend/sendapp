import { base64 } from '@scure/base'
import { assert } from './assert'
import { byteaToBytes } from './byteaToBytes'

/**
 * Converts a Postgres bytea string to a base64 string
 * @param str
 * @returns base64 string
 */
export function byteaToBase64(str: `\\x${string}`): string {
  assert(str.startsWith('\\x'), 'Hex string must start with \\x')
  return base64.encode(byteaToBytes(str))
}
