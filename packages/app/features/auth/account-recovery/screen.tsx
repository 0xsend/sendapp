import { useCallback, useState } from 'react'
import RecoverWithEOA from 'app/features/auth/account-recovery/eoa/RecoverWithEOA'
import type { SignMessageErrorType } from '@wagmi/core'
import type { SignMessageData, SignMessageVariables } from 'wagmi/query'
import { Stack, XStack, YStack, Text, Button, ButtonText } from '@my/ui'
import type { ChallengeResponse } from '@my/api/src/routers/account-recovery/types'
import { RecoveryOptions } from '@my/api/src/routers/account-recovery/types'
import { api } from 'app/utils/api'
import { IconError, IconRefresh } from 'app/components/icons'
import { useRouter } from 'solito/router'
import type { ErrorWithMessage } from '@my/api/src/routers/account-recovery/types'

interface Props {
  onClose?: () => void
}

export enum SignState {
  NOT_COMPLETE = 0,
  IN_PROGRESS = 1,
  FAILED = 2,
}

export default function AccountRecoveryScreen(props: Props) {
  const [error, setError] = useState<ErrorWithMessage>()
  // TODO: implement loading state
  const [signState, setSignState] = useState<SignState>(SignState.NOT_COMPLETE)

  const challengeMutation = api.challenge.getChallenge.useMutation({ retry: false })
  const verifyChallengeMutation = api.challenge.verifyChallenge.useMutation({ retry: false })
  const router = useRouter()

  const getChallenge = async (
    recoveryType: RecoveryOptions,
    identifier?: string | `0x${string}`
  ) => {
    if (!identifier) {
      setError({
        message: 'Unable to identify user. Please try again.',
      })
    } else {
      return challengeMutation
        .mutateAsync({ recoveryType, identifier })
        .then((challengeResponse) => {
          return challengeResponse as ChallengeResponse
        })
        .catch((err) => {
          setError(err)
        })
    }
  }

  const onSignSuccess = (
    data: SignMessageData,
    variables: SignMessageVariables,
    context: unknown
  ) => {
    const { account } = variables
    const address = account as string

    verifyChallengeMutation
      .mutateAsync({ recoveryType: RecoveryOptions.EOA, signature: data, identifier: address })
      .then(() => {
        // JWT is set via Set-Cookie header
        router.push('/')
      })
      .catch((err) => {
        setError(err)
      })
  }

  const onSignError = (
    error: SignMessageErrorType,
    variables: SignMessageVariables,
    context: unknown
  ) => {
    setError({
      message: 'Failed to sign challenge. Please try again.',
    })
  }

  const showRecoveryOptions = () => {
    return (
      <XStack width="100%" gap="$2" alignItems="center" justifyContent="center">
        <RecoverWithEOA
          getChallenge={getChallenge}
          signState={signState}
          onSignSuccess={onSignSuccess}
          onSignError={onSignError}
        />

        <Button width="50%">
          <ButtonText>PASSKEY</ButtonText>
        </Button>
      </XStack>
    )
  }

  const showHeading = () => {
    return (
      <>
        {/* Icon */}
        {error ? <IconError size={'$4'} color={'$red9Dark'} /> : <IconRefresh size={'$4'} />}

        {/* Heading */}
        <Text fontWeight="bold" textAlign="center">
          {error ? 'Unable to recover account' : 'Recover account'}
        </Text>

        {/* Description */}
        <Text textAlign="center">
          {error?.message || `Recover with the ${getRecoveryOptionsStr()} linked to your account.`}
        </Text>
      </>
    )
  }

  return (
    <YStack mt={'0'} w={'100%'} h={'100%'} jc={'space-between'}>
      <Stack flex={1} jc={'center'} alignItems="center" gap="$2">
        {showHeading()}
        {!error && showRecoveryOptions()}
      </Stack>

      <Button
        w={'100%'}
        backgroundColor={'$primary'}
        hoverStyle={{ backgroundColor: '$primary' }}
        pressStyle={{ backgroundColor: '$primary' }}
        focusStyle={{ backgroundColor: '$primary' }}
        onPress={props.onClose}
      >
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
