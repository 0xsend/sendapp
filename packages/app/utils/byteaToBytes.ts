import { base16 } from '@scure/base'
import { assert } from './assert'

export function byteaToBytes(str: `\\x${string}`): Uint8Array {
  assert(str.startsWith('\\x'), 'Hex string must start with \\x')
  return base16.decode(str.slice(2).toUpperCase())
}
