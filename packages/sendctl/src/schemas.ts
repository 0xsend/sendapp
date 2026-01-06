import { z } from 'zod'

/**
 * JSON-RPC 2.0 response schemas for runtime validation
 */

/** JSON-RPC error object */
export const JsonRpcErrorSchema = z.object({
  code: z.number().optional(),
  message: z.string(),
  data: z.unknown().optional(),
})

/** JSON-RPC success response (e.g., eth_chainId) */
export const JsonRpcSuccessSchema = z.object({
  jsonrpc: z.literal('2.0'),
  id: z.union([z.number(), z.string(), z.null()]),
  result: z.unknown(),
})

/** JSON-RPC error response */
export const JsonRpcErrorResponseSchema = z.object({
  jsonrpc: z.literal('2.0'),
  id: z.union([z.number(), z.string(), z.null()]),
  error: JsonRpcErrorSchema,
})

/** Combined JSON-RPC response (success or error) */
export const JsonRpcResponseSchema = z.union([JsonRpcSuccessSchema, JsonRpcErrorResponseSchema])

/** eth_chainId response - result is hex string */
export const ChainIdResponseSchema = JsonRpcSuccessSchema.extend({
  result: z.string().regex(/^0x[0-9a-fA-F]+$/, 'Invalid hex chain ID'),
})

/** eth_getCode response - result is hex string or "0x" for no code */
export const GetCodeResponseSchema = JsonRpcSuccessSchema.extend({
  result: z.string().regex(/^0x([0-9a-fA-F]*)?$/, 'Invalid hex bytecode'),
})

/** eth_getBalance response - result is hex string */
export const GetBalanceResponseSchema = JsonRpcSuccessSchema.extend({
  result: z.string().regex(/^0x[0-9a-fA-F]+$/, 'Invalid hex balance'),
})

export type JsonRpcError = z.infer<typeof JsonRpcErrorSchema>
export type JsonRpcSuccess = z.infer<typeof JsonRpcSuccessSchema>
export type JsonRpcErrorResponse = z.infer<typeof JsonRpcErrorResponseSchema>
export type JsonRpcResponse = z.infer<typeof JsonRpcResponseSchema>
export type ChainIdResponse = z.infer<typeof ChainIdResponseSchema>
export type GetCodeResponse = z.infer<typeof GetCodeResponseSchema>
export type GetBalanceResponse = z.infer<typeof GetBalanceResponseSchema>
