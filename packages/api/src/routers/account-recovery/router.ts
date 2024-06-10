import { TRPCError } from '@trpc/server'
import debug from 'debug'
import { SUPABASE_SUBDOMAIN } from 'app/utils/supabase/admin'
import { createTRPCRouter, publicProcedure } from '../../trpc'
import { z } from 'zod'
import {
  type ChallengeResponse,
  type VerifyChallengeResponse,
  RecoveryOptions,
  RecoveryEOAPreamble,
} from '@my/api/src/routers/account-recovery/types'
import {
  getChallengeById,
  getChainAddress,
  getPasskey,
  isChallengeExpired,
} from 'app/utils/account-recovery'
import { mintAuthenticatedJWTToken } from 'app/utils/jwt'
import { verifyMessage, hexToBytes } from 'viem'
import { verifySignature } from 'app/utils/userop'
import { COSEECDHAtoXY } from 'app/utils/passkeys'
import { byteaToHex } from 'app/utils/byteaToHex'
import { supabaseAdmin } from 'app/utils/supabase/admin'

const logger = debug('api:routers:account-recovery')

export const GetChallengeResponseSchema = z.object({
  id: z.number(),
  challenge: z.string(),
  created_at: z.string(),
  expires_at: z.string(),
})

export const ValidateSignatureRequestSchema = z.object({
  recoveryType: z.nativeEnum(RecoveryOptions),
  identifier: z.string(),
  challengeId: z.number(),
  signature: z.string(),
})

export const ValidateSignatureResponseSchema = z.object({
  jwt: z.string(),
})

export const accountRecoveryRouter = createTRPCRouter({
  getChallenge: publicProcedure.mutation(async () => {
    const { data: challengeData, error: challengeError } = await supabaseAdmin
      .rpc('insert_challenge')
      .single()

    if (challengeError || !challengeData) {
      logger(`getChallenge:cant-insert-challenge: [${challengeError}]`)
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: formatErr('Cannot generate challenge: Internal server error'),
        cause: challengeError?.message,
      })
    }
    const challengeResponse = challengeData as ChallengeResponse
    challengeResponse.challenge = byteaToHex(challengeResponse.challenge as `\\x${string}`)
    return challengeResponse
  }),
  validateSignature: publicProcedure
    .input(ValidateSignatureRequestSchema)
    .mutation(async ({ input, ctx }): Promise<VerifyChallengeResponse> => {
      const { recoveryType, identifier, signature, challengeId } = input

      const { data: challengeData, error: getChallengeError } = await getChallengeById(challengeId)

      if (getChallengeError || !challengeData) {
        logger(`verifyChallenge:invalid-user-or-challenge: [${getChallengeError}]`)
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: formatErr('Challenge not found'),
          cause: getChallengeError?.message,
        })
      }

      // validate challenge isn't expired
      await isChallengeExpired(challengeData.id, logger)
        .then((expired) => {
          if (expired) {
            logger('verifyChallenge:challenge-not-found-or-expired')
            throw new TRPCError({
              code: 'NOT_FOUND',
              message: formatErr('Challenge expired'),
              cause: 'Challenge expired',
            })
          }
        })
        .catch((error) => {
          logger('verifyChallenge:challenge-not-found-or-expired')
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: formatErr(error),
            cause: 'Internal server error',
          })
        })

      // verify signature with user's identifier
      const signatureVerified = await verifyRecoverySignature(
        recoveryType,
        identifier,
        signature as `0x${string}`,
        challengeData
      )

      // handle unauthorized requests
      if (!signatureVerified) {
        logger('api:accountRecoveryRouter:verifyChallenge:signature-failed-verification')
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: formatErr(
            `Unauthorized. Ensure that you are signing with the ${recoveryType} you signed up with`
          ),
          cause: 'Signature failed verification',
        })
      }

      // identify user from identifier
      const userId = await getUserIdByIdentifier(recoveryType, identifier)
      const jwt = mintAuthenticatedJWTToken(userId)
      const encodedJwt = encodeURIComponent(JSON.stringify([jwt, null, null, null, null, null]))

      console.log(`Account recovered - Recovery type: [${recoveryType}]. User: [${userId}].`)
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
    userId = await getUserIdByPasskeyName(identifier)
  } else {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: `Unrecognized recovery type: [${recoveryType}]`,
    })
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

const verifyRecoverySignature = async (
  recoveryType: RecoveryOptions,
  identifier: string,
  signature: `0x${string}`,
  challengeData: ChallengeResponse
): Promise<boolean> => {
  let verified = false
  if (recoveryType === RecoveryOptions.EOA) {
    verified = await verifyMessage({
      address: identifier as `0x${string}`,
      message: RecoveryEOAPreamble + byteaToHex(challengeData.challenge),
      signature: signature,
    })
  } else if (recoveryType === RecoveryOptions.WEBAUTHN) {
    const { data: passkeyData, error: passkeyError } = await getPasskey(identifier)
    if (!passkeyData || passkeyError) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: formatErr('Unrecognized passkey'),
      })
    }

    const pubkey = COSEECDHAtoXY(hexToBytes(byteaToHex(passkeyData.public_key)))

    // SendVerifier.sol expects hex value (`0x<hex>`) rather than hex string (`/x<hex>`)
    // challengeData.challenge = `0x${challengeData.challenge.slice(2)}`

    verified = await verifySignature(
      byteaToHex(challengeData.challenge as `\\x${string}`),
      signature,
      pubkey
    )
  } else {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: formatErr('Unrecognized recovery type'),
      cause: `Cannot verify challenge: Unrecognized recovery type: [${recoveryType}]`,
    })
  }
  return verified
}

/**
 * Get user ID via chain address (`chain_addresses` table lookup)
 *
 * @param {string} chainAddress - chain address linked to user's account
 * @returns  {Promise<string>} - user id
 */
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
      message: formatErr('Unrecognized chain address'),
      cause: `Could not find associated user to chain address: [${chainAddress}] Error: [${chainAddressError?.message}]`,
    })
  }
  return chainAddressData.user_id
}

/**
 * Get user ID via passkey name
 *
 * Passkey names are in the format <userId>.<keySlot>
 *
 * @param {string} passkeyName - passkey name in the format <userId>.<keySlot>
 * @returns  {Promise<string>} - user id
 */
const getUserIdByPasskeyName = async (passkeyName: string): Promise<string> => {
  if (!passkeyName) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: formatErr('Passkey name required'),
      cause: 'Passkey name not provided',
    })
  }

  const { data: passkeyData, error: passkeyError } = await getPasskey(passkeyName)
  if (passkeyError || !passkeyData.user_id) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: formatErr('User not found: Unrecognized passkey credentials'),
      cause: `Could not find associated user to passkey name: [${passkeyName}] Error: [${passkeyError?.message}]`,
    })
  }

  return passkeyData.user_id
}
/**
 * User readable error helper
 *
 * @param {string} reason - error reason
 * @returns  {string}
 */
const formatErr = (reason: string): string => {
  return `${reason}. Please try again.`
}
