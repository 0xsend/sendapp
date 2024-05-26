import { byteaToHex } from 'app/utils/byteaToHex'
import { z } from 'zod'

/**
 * Zod schema for parsing and validating ethereum addresses from a Postgresql bytea column.
 */ byteaToHex
export const byteaEthAddress = z.string().regex(/^\\x[a-fA-F0-9]{40}$/)

/**
 * Zod schema for converting a Postgresql bytea Ethereum address column to a 0x-prefixed hex string.
 */
export const byteaToHexEthAddress = byteaEthAddress.transform((v) =>
  byteaToHex(v as `\\x${string}`)
)

/**
 * Zod schema for parsing and validating transaction hashes from a Postgresql bytea column.
 */
export const byteaTxHash = z.string().regex(/^\\x[a-fA-F0-9]{64}$/)

/**
 * Zod schema for converting a Postgresql bytea transaction hash column to a 0x-prefixed hex string.
 */
export const byteaToHexTxHash = byteaTxHash.transform((v) => byteaToHex(v as `\\x${string}`))
