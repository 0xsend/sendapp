import { type Address, checksumAddress, isAddress } from 'viem'
import { z } from 'zod'

/**
 * Zod schema for 0x prefixed hex strings
 */
export const hex = z
  .string()
  .regex(/^0x[0-9a-fA-F]*$/i)
  .refine((v): v is `0x${string}` => true)

/**
 * Zod schema for Ethereum addresses
 */
export const address = hex
  .refine((v): v is `0x${string}` => isAddress(v))
  .transform((v) => checksumAddress(v))

/**
 * Zod schema for UserOperation v0.7
 */
export const UserOperationSchema = z.object({
  sender: address,
  nonce: z.bigint(),
  factory: address.optional(),
  factoryData: hex.optional(),
  callData: hex,
  callGasLimit: z.bigint(),
  verificationGasLimit: z.bigint(),
  preVerificationGas: z.bigint(),
  maxFeePerGas: z.bigint(),
  maxPriorityFeePerGas: z.bigint(),
  paymaster: address.optional(),
  paymasterVerificationGasLimit: z.bigint().optional(),
  paymasterPostOpGasLimit: z.bigint().optional(),
  paymasterData: hex.optional(),
  signature: hex,
  initCode: z.never().optional(),
  paymasterAndData: z.never().optional(),
})

export type UserOperation = z.infer<typeof UserOperationSchema>

/**
 * Zod schema for SendAccountCall
 */
export const SendAccountCallSchema = z.object({
  dest: address,
  value: z.bigint().refine((v) => v >= 0n),
  data: hex,
})

export type SendAccountCall = z.infer<typeof SendAccountCallSchema>

export const SendAccountCallsSchema = z.array(SendAccountCallSchema).refine((v) => v.length > 0)

export type SendAccountCalls = z.infer<typeof SendAccountCallsSchema>
