import { byteaToHex } from 'app/utils/byteaToHex'
import { checksumAddress } from 'viem'
import { z } from 'zod'

/**
 * Zod schema for parsing and validating ethereum addresses from a Postgresql bytea column.
 */ byteaToHex
export const byteaEthAddress = z
  .string()
  .regex(/^\\x[a-fA-F0-9]{40}$/)
  .refine((v): v is `\\x${string}` => true)

/**
 * Zod schema for converting a Postgresql bytea Ethereum address column to a 0x-prefixed hex string.
 */
export const byteaToHexEthAddress = byteaEthAddress
  .transform((v) => checksumAddress(byteaToHex(v)))
  .refine((v): v is `0x${string}` => true)

/**
 * Zod schema for parsing and validating transaction hashes from a Postgresql bytea column.
 */
export const byteaTxHash = z
  .string()
  .regex(/^\\x[a-fA-F0-9]{64}$/)
  .refine((v): v is `\\x${string}` => true)

/**
 * Zod schema for converting a Postgresql bytea transaction hash column to a 0x-prefixed hex string.
 */
export const byteaToHexTxHash = byteaTxHash
  .transform((v) => byteaToHex(v))
  .refine((v): v is `0x${string}` => true)
