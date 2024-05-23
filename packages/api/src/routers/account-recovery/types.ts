import type { z } from 'zod'
import type {
  ChallengeResponseSchema,
  RecoveryEligibilityResponseSchema,
  VerifyChallengeResponseSchema,
} from '@my/api/src/routers/account-recovery/schemas'

export type RecoveryEligibilityResponse = z.infer<typeof RecoveryEligibilityResponseSchema>
export type ChallengeResponse = z.infer<typeof ChallengeResponseSchema>
export type VerifyChallengeResponse = z.infer<typeof VerifyChallengeResponseSchema>

export enum RecoveryOptions {
  EOA = 'EOA',
  WEBAUTHN = 'Webauthn',
}
