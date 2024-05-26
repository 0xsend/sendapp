import { assert } from './assert'

/**
 * Converts a Postgres bytea string to a hex string
 * @param str
 * @returns 0x-prefixed hex string
 */
export function byteaToHex(str: `\\x${string}`): `0x${string}` {
  assert(str.startsWith('\\x'), 'Hex string must start with \\x')
  return `0x${str.slice(2)}`
}
