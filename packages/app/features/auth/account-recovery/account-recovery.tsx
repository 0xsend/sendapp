import type {
  ChallengeResponse,
  ErrorWithMessage,
  VerifyChallengeRequest,
} from '@my/api/src/routers/account-recovery/types'
import { RecoveryOptions } from '@my/api/src/routers/account-recovery/types'
import { Button, ButtonText, Paragraph, Stack, XStack, YStack } from '@my/ui'
import type { SignMessageErrorType } from '@wagmi/core'
import { IconError, IconRefresh } from 'app/components/icons'
import RecoverWithEOA from 'app/features/auth/account-recovery/eoa/RecoverWithEOA'
import RecoverWithPasskey from 'app/features/auth/account-recovery/passkey/RecoverWithPasskey'
import { api } from 'app/utils/api'
import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'solito/router'

interface Props {
  onClose?: () => void
}

export enum SignState {
  NOT_COMPLETE = 0,
  IN_PROGRESS = 1,
  FAILED = 2,
}

export default function AccountRecovery(props: Props) {
  const [error, setError] = useState<ErrorWithMessage>()
  const [signState] = useState<SignState>(SignState.NOT_COMPLETE)
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
          // JWT is set via Set-Cookie header
          router.push('/')
        })
        .catch((err) => {
          setError(err)
        })
    },
    [validateSignatureMutateAsync, router]
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
        {error ? (
          <Paragraph testID="account-recovery-heading-error">Unable to recover account</Paragraph>
        ) : (
          <Paragraph testID="account-recovery-heading">Recover account</Paragraph>
        )}

        {/* Description */}

        {error?.message ? (
          <Paragraph testID="account-recovery-description-error">{error.message}</Paragraph>
        ) : (
          <Paragraph testID="account-recovery-description">
            Recover with the {getRecoveryOptionsStr()} linked to your account.
          </Paragraph>
        )}
      </>
    )
  }

  return (
    <YStack mt={'0'} w={'100%'} h={'100%'} jc={'space-between'} maxWidth={600} mx="auto" pb="$6">
      <Stack flex={1} jc={'center'} alignItems="center" gap="$4">
        {showHeading()}
        {!error && challengeData && showRecoveryOptions()}
      </Stack>

      <Button w={'100%'} theme="red_active" onPress={props.onClose} br="$4">
        <ButtonText textTransform="uppercase" theme="red">
          Cancel
        </ButtonText>
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
