import { type Address, checksumAddress, isAddress } from 'viem'
import { z } from 'zod'

/**
 * Zod schema for 0x prefixed hex strings
 */
export const hex = z
  .string()
  .regex(/^0x[0-9a-fA-F]+$/i)
  .refine((v): v is `0x${string}` => true)

/**
 * Zod schema for Ethereum addresses
 */
export const address = hex
  .refine((v): v is Address => isAddress(v))
  .transform((v) => checksumAddress(v))
