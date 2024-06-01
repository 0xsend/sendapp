import { isHex } from 'viem'
import { assert } from './assert'

/**
 * Converts a hex string to a Postgres bytea string.
 * @see https://www.postgresql.org/docs/16/functions-binarystring.html#ENCODE-FORMAT-HEX
 * @param str
 * @returns `\\x${string}`
 */
export function hexToBytea(str: `0x${string}`): `\\x${string}` {
  assert(isHex(str), 'Hex string must start with 0x')
  return `\\x${str.slice(2).toLowerCase()}`
}
