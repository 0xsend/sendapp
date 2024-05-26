import { TRPCError } from '@trpc/server'
import debug from 'debug'
import { SUPABASE_SUBDOMAIN, supabaseAdmin } from 'app/utils/supabase/admin'
import { createTRPCRouter, publicProcedure } from '../../trpc'
import { z } from 'zod'
import {
  type ChallengeResponse,
  type VerifyChallengeResponse,
  RecoveryOptions,
} from '@my/api/src/routers/account-recovery/types'
import {
  getChallenge,
  getChainAddress,
  getPasskey,
  isChallengeExpired,
  generateChallenge,
} from 'app/utils/account-recovery'
import { mintAuthenticatedJWTToken } from 'app/utils/jwt'
import { verifyMessage } from 'viem'

const logger = debug('api:routers:account-recovery')

const GetChallengeRequestSchema = z.object({
  recoveryType: z.nativeEnum(RecoveryOptions),
  identifier: z.string(),
})

export const GetChallengeResponseSchema = z.object({
  id: z.string(),
  challenge: z.string(),
  created_at: z.string(),
  expires_at: z.string(),
})

const VerifyChallengeRequestSchema = z.object({
  recoveryType: z.nativeEnum(RecoveryOptions),
  identifier: z.string(),
  signature: z.string(),
})

export const VerifyChallengeResponseSchema = z.object({
  jwt: z.string(),
})

export const accountRecoveryRouter = createTRPCRouter({
  getChallenge: publicProcedure.input(GetChallengeRequestSchema).mutation(async ({ input }) => {
    const { recoveryType, identifier } = input

    const userId = await getUserIdByIdentifier(recoveryType, identifier)

    const { data: challengeData, error: challengeError } = await supabaseAdmin
      .rpc('upsert_challenges', {
        user_id: userId,
        challenge: generateChallenge(),
      })
      .single()

    if (challengeError || !challengeData) {
      logger('getChallenge:cant-upsert-challenge')
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: formatErr('Cannot retrieve challenge: Internal server error'),
        cause: challengeError.message,
      })
    }

    return challengeData as ChallengeResponse
  }),
  verifyChallenge: publicProcedure
    .input(VerifyChallengeRequestSchema)
    .mutation(async ({ input, ctx }): Promise<VerifyChallengeResponse> => {
      const { recoveryType, identifier, signature } = input

      // TODO: base64 decode signature

      if (!recoveryType || !identifier || !signature) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Recovery type, identifier and signature required',
        })
      }

      // Identify user from identifier
      const userId = await getUserIdByIdentifier(recoveryType, identifier)

      // Retrieve challenge for user
      const { data: challengeData, error: getChallengeError } = await getChallenge(userId)
      if (getChallengeError || !challengeData) {
        logger('verifyChallenge:invalid-user-or-challenge')
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: formatErr('Could not retrieve challenge'),
          cause: getChallengeError.message,
        })
      }

      // Validate challenge isn't expired
      isChallengeExpired(challengeData.id, logger)
        .then((expired) => {
          if (expired) {
            logger?.('verifyChallenge:challenge-not-found-or-expired')
            throw new TRPCError({
              code: 'NOT_FOUND',
              message: formatErr('Challenge expired'),
              cause: 'Challenge expired',
            })
          }
        })
        .catch((error) => {
          logger?.('verifyChallenge:challenge-not-found-or-expired')
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: formatErr(error),
            cause: 'Internal server error',
          })
        })

      // Verify signature with user's chain address
      const challengeVerified = await verifyChallenge(
        recoveryType,
        identifier,
        signature,
        challengeData
      )

      // Handle unauthorized requests
      if (!challengeVerified) {
        logger('verifyChallenge:challenge_failed_verification')
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: formatErr(
            'Unauthorized. Ensure that you are signing with the address you signed up with'
          ),
          cause: 'Signature failed verification',
        })
      }

      const jwt = mintAuthenticatedJWTToken(userId)
      const encodedJwt = encodeURIComponent(JSON.stringify([jwt, null, null, null, null, null]))

      ctx.res.setHeader('Set-Cookie', `sb-${SUPABASE_SUBDOMAIN}-auth-token=${encodedJwt}; Path=/`)
      return {
        jwt,
      }
    }),
})

const getUserIdByIdentifier = async (
  recoveryType: RecoveryOptions,
  identifier: string
): Promise<string> => {
  if (!recoveryType || !identifier) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Recovery type and identifier required',
    })
  }

  let userId = ''
  if (recoveryType === RecoveryOptions.EOA) {
    userId = await getUserIdByChainAddress(identifier)
  } else if (recoveryType === RecoveryOptions.WEBAUTHN) {
    userId = await getUserIdByPasskey(identifier)
  }
  if (userId) {
    return userId
  }
  throw new TRPCError({
    code: 'BAD_REQUEST',
    message: formatErr('Unrecognized recovery type'),
    cause: `Unrecognized recovery type: [${recoveryType}]`,
  })
}

const verifyChallenge = async (
  recoveryType: RecoveryOptions,
  identifier: string,
  signature: string,
  challenge: ChallengeResponse
): Promise<boolean> => {
  let verified = false
  if (recoveryType === RecoveryOptions.EOA) {
    verified = await verifyMessage({
      address: identifier as `0x${string}`,
      message: challenge.challenge,
      signature: signature as `0x${string}`,
    })
  } else if (recoveryType === RecoveryOptions.WEBAUTHN) {
    // TODO: implement
    throw new Error('Not implemented')
  } else {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: formatErr('Unrecognized recovery type'),
      cause: `Cannot verify challenge: Unrecognized recovery type: [${recoveryType}]`,
    })
  }
  return verified
}

const getUserIdByChainAddress = async (chainAddress: string): Promise<string> => {
  if (!chainAddress) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: formatErr('Chain address required'),
      cause: 'Chain address not provided',
    })
  }
  const { data: chainAddressData, error: chainAddressError } = await getChainAddress(chainAddress)

  if (chainAddressError || !chainAddressData.user_id) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: formatErr('User not found: Unrecognised chain address'),
      cause: `Could not find associated user to chain address: [${chainAddress}] Error: [${chainAddressError?.message}]`,
    })
  }
  return chainAddressData.user_id
}

const getUserIdByPasskey = async (publicKey: string): Promise<string> => {
  if (!publicKey) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: formatErr('WebAuthn public key required'),
      cause: 'WebAuthn public key not provided',
    })
  }

  const { data: passkeyData, error: passkeyError } = await getPasskey(publicKey)
  if (passkeyError || !passkeyData.user_id) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: formatErr('User not found: Unrecognised passkey credentials'),
      cause: `Could not find associated user to webauthn pubkey: [${publicKey}] Error: [${passkeyError?.message}]`,
    })
  }

  return passkeyData.user_id
}

const formatErr = (reason: string): string => {
  return `${reason}. Please try again.`
}
