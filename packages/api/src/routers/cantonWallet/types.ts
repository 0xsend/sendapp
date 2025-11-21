import { z } from 'zod'

/**
 * Canton Wallet Router Types
 *
 * This module defines input and output types for the Canton Wallet tRPC router.
 */

/**
 * Input schema for generatePriorityToken procedure
 * Empty input - userId comes from authenticated session context
 */
export const GeneratePriorityTokenInputSchema = z.object({})

export type GeneratePriorityTokenInput = z.infer<typeof GeneratePriorityTokenInputSchema>

/**
 * Output schema for generatePriorityToken procedure
 */
export interface GeneratePriorityTokenOutput {
  /** Priority token string for Canton Wallet onboarding */
  token: string
  /** Invite URL for Canton Wallet: https://cantonwallet.com/auth/create-account?priorityToken={token} */
  url: string
  /** Whether this is a newly created token (false if existing token was returned) */
  isNew: boolean
}
