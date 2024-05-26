import type { z } from 'zod'
import type {
  GetChallengeResponseSchema,
  RecoveryEligibilityResponseSchema,
  VerifyChallengeResponseSchema,
} from '@my/api/src/routers/account-recovery/schemas'

export type RecoveryEligibilityResponse = z.infer<typeof RecoveryEligibilityResponseSchema>
export type ChallengeResponse = z.infer<typeof GetChallengeResponseSchema>
export type VerifyChallengeResponse = z.infer<typeof VerifyChallengeResponseSchema>

export type ErrorWithMessage = {
  message: string
} & Record<string, unknown>

export enum RecoveryOptions {
  EOA = 'EOA',
  WEBAUTHN = 'Passkey',
}
