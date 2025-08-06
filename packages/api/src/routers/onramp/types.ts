import { z } from 'zod'

export const GetSessionTokenRequestSchema = z.object({
  addresses: z.array(
    z.object({
      address: z.string(),
      blockchains: z.array(z.string()),
    })
  ),
  assets: z.array(z.string()).optional(),
})
