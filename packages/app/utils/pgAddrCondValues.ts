import { hexToBytea } from 'app/utils/hexToBytea'

/**
 * Returns a string of values to be used in a postgrest WHERE IN clause.
 */
export function pgAddrCondValues(values: `0x${string}`[]) {
  return values.map((a) => `${hexToBytea(a)}`).join(',')
}
