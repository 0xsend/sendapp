import { TRPCError } from '@trpc/server'
import debug from 'debug'
import { SUPABASE_SUBDOMAIN, supabaseAdmin } from 'app/utils/supabase/admin'
import { createTRPCRouter, publicProcedure } from '../../trpc'
import {
  PhoneNumberSchema,
  VerifyChallengeRequestSchema,
  RecoveryEligibilityResponseSchema,
} from '@my/api/src/routers/account-recovery/schemas'
import {
  type ChallengeResponse,
  type VerifyChallengeResponse,
  type RecoveryEligibilityResponse,
  RecoveryOptions,
} from '@my/api/src/routers/account-recovery/types'
import {
  getChallenge,
  isChallengeExpired,
  challengeUserMessage,
} from 'app/utils/account-recovery/challenge'
import { mintAuthenticatedJWTToken } from 'app/utils/jwt'
import { verifyMessage } from 'viem'

const logger = debug('api:routers:account-recovery')

export const accountRecoveryRouter = createTRPCRouter({
  // Checks user's eligibility for account recovery
  // Users can only recover their account if they have an associated EOA (legacy) / webauthn keys.
  getRecoveryEligibility: publicProcedure
    .input(PhoneNumberSchema)
    .query(async ({ input }): Promise<RecoveryEligibilityResponse> => {
      if (!input.phoneNumberInput) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: formatErr('Phone number required'),
        })
      }

      // Retrieve user from phone number
      const { data: userData, error: getUserError } = await getUserByPhoneNumber(
        input.phoneNumberInput
      )

      if (!userData || getUserError) {
        logger('getRecoveryEligibility:user-not-found')
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: formatErr(`User with phone number (${input.phoneNumberInput}) not found`),
        })
      }

      const { data: chainAddress } = await supabaseAdmin
        .from('chain_addresses')
        .select('*')
        .eq('user_id', userData.id as string)
      const { data: webauthnCredentials } = await supabaseAdmin
        .from('webauthn_credentials')
        .select('*')
        .eq('user_id', userData.id as string)

      const recoveryOptions: RecoveryOptions[] = []
      if (chainAddress || webauthnCredentials) {
        if (chainAddress) {
          recoveryOptions.push(RecoveryOptions.EOA)
        }
        if (webauthnCredentials) {
          recoveryOptions.push(RecoveryOptions.WEBAUTHN)
        }
        return RecoveryEligibilityResponseSchema.parse({
          eligible: true,
          recoveryOptions: recoveryOptions,
        })
      }
      return RecoveryEligibilityResponseSchema.parse({
        eligible: false,
        recoveryOptions,
        error: formatErr('No linked chain address / webauthn credentials'),
      })
    }),
  getChallenge: publicProcedure.input(PhoneNumberSchema).mutation(async ({ input }) => {
    // Check the phone number was supplied
    const { phoneNumberInput } = input
    if (!phoneNumberInput) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: formatChallengeErr('Phone number required'),
        cause: 'Phone number not provided',
      })
    }
    // Retrieve the corresponding user_id to the tag name
    const { data: userData, error: userDataError } = await getUserByPhoneNumber(phoneNumberInput)

    if (userDataError || !userData?.id) {
      logger('getChallenge:user-not-found')
      const errorMsg = `Could not find user with phone number: [${phoneNumberInput}]`
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: formatChallengeErr(errorMsg),
        cause: `${errorMsg}. ${userDataError?.message}`,
      })
    }

    // Call the create_challenge function with the user_id and the
    // hex encoded hashed challenge message
    const { data: challengeData, error: challengeCreationError } = await supabaseAdmin
      .rpc('upsert_auth_challenges', {
        userid: userData.id,
        challenge: challengeUserMessage(userData.id, phoneNumberInput),
      })
      .single()

    // If the result is null throw an error
    if (challengeCreationError) {
      logger('getChallenge:cant-create-challenge')
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: formatChallengeErr('Internal server error'),
        cause: challengeCreationError.message,
      })
    }

    // Return the JSON result object
    return challengeData as ChallengeResponse
  }),
  verifyChallenge: publicProcedure
    .input(VerifyChallengeRequestSchema)
    .mutation(async ({ input, ctx }): Promise<VerifyChallengeResponse> => {
      const { address, signature } = input
      if (!address || !signature) {
        logger('verifyChallenge:bad-request-address-signature-required')
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: formatVerifyErr(
            `${
              !address && !signature ? 'Address and Signature' : !address ? 'Address' : 'Signature'
            } Required`
          ),
          cause: 'Address or signature not provided.',
        })
      }

      const { data: userData, error: getUserIdError } = await supabaseAdmin
        .from('chain_addresses')
        .select('*')
        .eq('address', address)
        .single()

      if (getUserIdError || !userData?.user_id) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: formatVerifyErr('Unrecognised chain address'),
          cause: `Could not find associated user to chain address: [${getUserIdError?.message}]`,
        })
      }

      const userId = userData.user_id

      // Retrieve challenge for user
      const { data: challengeData, error: getChallengeError } = await getChallenge(userId)
      if (getChallengeError || !challengeData) {
        logger('verifyChallenge:invalid-user-or-challenge')
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: formatVerifyErr('Could not retrieve challenge'),
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
              message: formatVerifyErr('Challenge expired'),
              cause: 'Challenge expired',
            })
          }
        })
        .catch((error) => {
          logger?.('verifyChallenge:challenge-not-found-or-expired')
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: formatVerifyErr(error),
            cause: 'Internal server error',
          })
        })

      // Verify signature with user's chain address
      const challengeVerified = await verifyMessage({
        address: address as `0x${string}`,
        message: challengeData.challenge,
        signature: signature as `0x${string}`,
      })

      // Handle unauthorized requests
      if (!challengeVerified) {
        logger('verifyChallenge:challenge_failed_verification')
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: formatVerifyErr(
            'Unauthorized. Ensure that you are signing with the address you signed up with'
          ),
          cause: 'Signature failed verification',
        })
      }

      const jwt = mintAuthenticatedJWTToken(userId)
      const encodedJwt = encodeURIComponent(JSON.stringify([jwt, null, null, null, null, null]))

      // TODO: what is the right form here?
      ctx.res.setHeader('Set-Cookie', `sb-${SUPABASE_SUBDOMAIN}-auth-token=${encodedJwt}`)
      // supabaseAdmin.auth.getUser(jwt).then((res) => console.log(res.data)).catch((err) => console.log(err))
      return {
        jwt,
      }
    }),
})

// TODO: isolate logic, move to seperate file
const getUserByPhoneNumber = async (phoneNumber: string) => {
  return await supabaseAdmin.from('users').select('*').eq('phone', phoneNumber).single()
}

const formatChallengeErr = (reason: string): string => {
  return `Unable to retrieve challenge. ${formatErr(reason)}`
}

const formatVerifyErr = (reason: string): string => {
  return `Unable to verify account. ${formatErr(reason)}`
}

const formatErr = (reason: string): string => {
  return `${reason}. Please try again.`
}
