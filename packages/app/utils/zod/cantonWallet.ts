import { z } from 'zod'

export const CantonWalletSchema = z.object({
  address: z
    .string()
    .min(1, 'Canton wallet address is required')
    .regex(
      /^cantonwallet-[^:]+::[a-fA-F0-9]+$/,
      'Invalid Canton wallet address format. Expected: cantonwallet-username::hash'
    ),
})

export type CantonWalletFormData = z.infer<typeof CantonWalletSchema>
