import { z } from 'zod'
import { RecoveryOptions } from '@my/api/src/routers/account-recovery/types'

export const PhoneNumberSchema = z.object({ phoneNumberInput: z.string() })

export const GetChallengeRequestSchema = z.object({
  recoveryType: z.nativeEnum(RecoveryOptions),
  identifier: z.string(),
})

export const GetChallengeResponseSchema = z.object({
  id: z.string(),
  challenge: z.string(),
  created_at: z.string(),
  expires_at: z.string(),
})

export const VerifyChallengeRequestSchema = z.object({
  recoveryType: z.nativeEnum(RecoveryOptions),
  identifier: z.string(),
  signature: z.string(),
})

export const VerifyChallengeResponseSchema = z.object({
  jwt: z.string(),
})

export const RecoveryEligibilityResponseSchema = z.object({
  eligible: z.boolean(),
  recoveryOptions: z.array(z.nativeEnum(RecoveryOptions)),
  error: z.optional(z.string()),
})
