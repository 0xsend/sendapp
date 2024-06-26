import { useEffect, useState, useCallback } from 'react'
import RecoverWithEOA from 'app/features/auth/account-recovery/eoa/RecoverWithEOA'
import { Stack, XStack, YStack, Text, Button, ButtonText, useToastController } from '@my/ui'
import type {
  ChallengeResponse,
  VerifyChallengeRequest,
  ErrorWithMessage,
} from '@my/api/src/routers/account-recovery/types'
import { RecoveryOptions } from '@my/api/src/routers/account-recovery/types'
import { api } from 'app/utils/api'
import { IconError, IconRefresh } from 'app/components/icons'
import { useRouter } from 'solito/router'
import RecoverWithPasskey from 'app/features/auth/account-recovery/passkey/RecoverWithPasskey'
import type { SignMessageErrorType } from '@wagmi/core'

interface Props {
  onClose?: () => void
}

export enum SignState {
  NOT_COMPLETE = 0,
  IN_PROGRESS = 1,
  FAILED = 2,
}

export default function AccountRecovery(props: Props) {
  const toast = useToastController()
  const [error, setError] = useState<ErrorWithMessage>()
  // TODO: frontend: implement signing loading state
  const [signState, setSignState] = useState<SignState>(SignState.NOT_COMPLETE)
  const [challengeData, setChallengeData] = useState<ChallengeResponse>()
  const { mutateAsync: getChallengeMutateAsync } = api.challenge.getChallenge.useMutation({
    retry: false,
  })
  const { mutateAsync: validateSignatureMutateAsync } = api.challenge.validateSignature.useMutation(
    { retry: false }
  )
  const router = useRouter()

  useEffect(() => {
    const loadChallenge = async () => {
      await getChallengeMutateAsync()
        .then((challengeResponse) => {
          setChallengeData(challengeResponse as ChallengeResponse)
        })
        .catch((err) => {
          setError(err)
        })
    }
    loadChallenge()
  }, [getChallengeMutateAsync])

  const onSignSuccess = useCallback(
    async (verifyChallengeRequest: VerifyChallengeRequest) => {
      await validateSignatureMutateAsync({
        ...verifyChallengeRequest,
      })
        .then(() => {
          toast.show('Successfully recovered your account')
          // JWT is set via Set-Cookie header
          router.push('/')
        })
        .catch((err) => {
          setError(err)
        })
    },
    [validateSignatureMutateAsync, router, toast]
  )

  const onSignError = (e: SignMessageErrorType) => {
    setError({
      message: `Failed to sign challenge: ${e.message.split('.')[0]}. Please try again.`,
    })
  }

  const showRecoveryOptions = () => {
    return (
      challengeData && (
        <XStack width="100%" gap="$2" alignItems="center" justifyContent="center">
          <RecoverWithEOA
            challengeData={challengeData}
            signState={signState}
            onSignSuccess={onSignSuccess}
            onSignError={onSignError}
          />

          <RecoverWithPasskey
            onSignSuccess={onSignSuccess}
            onSignError={onSignError}
            challengeData={challengeData}
          />
        </XStack>
      )
    )
  }

  const showHeading = () => {
    return (
      <>
        {/* Icon */}
        {error ? <IconError size={'$4'} color={'$red9Dark'} /> : <IconRefresh size={'$4'} />}

        {/* Heading */}
        <Text fontWeight="bold" textAlign="center">
          {error ? (
            <Text testID="account-recovery-heading-error">Unable to recover account</Text>
          ) : (
            <Text testID="account-recovery-heading">Recover account</Text>
          )}
        </Text>

        {/* Description */}
        <Text textAlign="center">
          {error?.message ? (
            <Text testID="account-recovery-description-error">{error.message}</Text>
          ) : (
            <Text testID="account-recovery-description">
              Recover with the {getRecoveryOptionsStr()} linked to your account.
            </Text>
          )}
        </Text>
      </>
    )
  }

  return (
    <YStack mt={'0'} w={'100%'} h={'100%'} jc={'space-between'} maxWidth={600} mx="auto" pb="$6">
      <Stack flex={1} jc={'center'} alignItems="center" gap="$2">
        {showHeading()}
        {!error && challengeData && showRecoveryOptions()}
      </Stack>

      <Button w={'100%'} theme="accent" onPress={props.onClose}>
        <ButtonText>RETURN</ButtonText>
      </Button>
    </YStack>
  )
}

const getRecoveryOptionsStr = (): string => {
  const recoveryOptions = Object.values(RecoveryOptions)

  if (recoveryOptions.length <= 2) {
    return recoveryOptions.join(' or ')
  }
  return `${recoveryOptions.slice(0, recoveryOptions.length - 1).join(',')} or ${
    recoveryOptions[-1]
  }`
}
