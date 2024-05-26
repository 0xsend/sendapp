import type { z } from 'zod'
import type { GetChallengeResponseSchema } from '@my/api/src/routers/account-recovery/router'

export type ChallengeResponse = z.infer<typeof GetChallengeResponseSchema>

export type ErrorWithMessage = {
  message: string
} & Record<string, unknown>

export enum RecoveryOptions {
  EOA = 'EOA',
  WEBAUTHN = 'Passkey',
}
