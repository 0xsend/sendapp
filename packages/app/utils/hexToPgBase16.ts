import { isHex } from 'viem'
import { assert } from './assert'

/**
 * Converts a hex string to a Postgres base16 string
 * @param str
 * @returns 0x-prefixed hex string
 */
export function hexToPgBase16(str: `0x${string}`): `\\x${string}` {
  assert(isHex(str), 'Hex string must start with 0x')
  return `\\x${str.slice(2)}`
}
