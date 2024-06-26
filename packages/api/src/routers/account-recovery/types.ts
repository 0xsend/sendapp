import type { z } from 'zod'
import type {
  GetChallengeResponseSchema,
  ValidateSignatureRequestSchema,
  ValidateSignatureResponseSchema,
} from '@my/api/src/routers/account-recovery/router'

export type ChallengeResponse = z.infer<typeof GetChallengeResponseSchema>
export type VerifyChallengeRequest = z.infer<typeof ValidateSignatureRequestSchema>
export type VerifyChallengeResponse = z.infer<typeof ValidateSignatureResponseSchema>

export type ErrorWithMessage = {
  message: string
} & Record<string, unknown>

export enum RecoveryOptions {
  EOA = 'EOA',
  WEBAUTHN = 'Passkey',
}

export const RecoveryEOAPreamble =
  'I would like to recover my SEND.app account. Please verify my signature: '
