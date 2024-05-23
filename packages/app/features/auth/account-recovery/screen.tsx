import { useCallback, useEffect, useMemo, useState } from 'react'
import RecoverWithEOA from 'app/features/auth/account-recovery/eoa/RecoverWithEOA'
import type { SignMessageErrorType } from '@wagmi/core'
import type { SignMessageData, SignMessageVariables } from 'wagmi/query'
import { Stack, XStack, YStack, Text, Button, ButtonText } from '@my/ui'
import type { ChallengeResponse } from '@my/api/src/routers/account-recovery/types'
import { RecoveryOptions } from '@my/api/src/routers/account-recovery/types'
import { api } from 'app/utils/api'
import { Spinner } from '@my/ui'
import { IconError, IconRefresh } from 'app/components/icons'
import { useThemeSetting } from 'app/provider/theme'
import { IconArrowLeft } from 'app/components/icons'
import { useRouter } from 'solito/router'

interface Props {
  phoneNumber: string
  onClose?: () => void
}

// TODO: move recovery/ dir into signin / auth folder, this is part of sign-in flow
export enum SignState {
  NOT_COMPLETE = 0,
  IN_PROGRESS = 1,
  FAILED = 2,
}

export default function AccountRecoveryScreen(props: Props) {
  const [challenge, setChallenge] = useState<ChallengeResponse>()
  const [signState, setSignState] = useState<SignState>(SignState.NOT_COMPLETE)

  const { data, isLoading, isSuccess, error } = api.challenge.getRecoveryEligibility.useQuery(
    {
      phoneNumberInput: props.phoneNumber,
    },
    {
      retry: false,
    }
  )
  const challengeMutation = api.challenge.getChallenge.useMutation({ retry: false })
  const verifyChallengeMutation = api.challenge.verifyChallenge.useMutation({ retry: false })
  const router = useRouter()
  const { resolvedTheme } = useThemeSetting()
  const iconColor = resolvedTheme?.startsWith('dark') ? '$primary' : '$black'

  useEffect(() => {
    if (data?.recoveryOptions) {
      // Retrieve challenge if there are recovery options
      challengeMutation
        .mutateAsync({ phoneNumberInput: props.phoneNumber })
        .then((challengeResponse) => {
          setChallenge(challengeResponse as ChallengeResponse)
        })
        .catch((error) => {
          // TODO: handle TRPClientErrors
          throw error
        })
    } else {
      // Unable to determine account recovery ilegibility
      handleIneligible(error)
    }
  }, [props.phoneNumber, data?.recoveryOptions, challengeMutation, error])

  const handleIneligible = useCallback((error) => {
    // Process account recovery if eligible for recovery
    // TODO: show options
    console.log(error)
  }, [])

  const onSignSuccess = useCallback(
    (data: SignMessageData, variables: SignMessageVariables, context: unknown) => {
      if (challenge) {
        const { account } = variables
        const address = account as `0x${string}`
        verifyChallengeMutation
          .mutateAsync({ signature: data, address })
          .then((jwt) => {
            // JWT is set via Set-Cookie header
            router.push('/')
          })
          .catch((err) => {
            // TODO: handle errors
            throw err
          })
      } else {
        // TODO: handle no challenge
      }
    },
    [challenge, router, verifyChallengeMutation]
  )

  const onSignError = useCallback(
    (error: SignMessageErrorType, variables: SignMessageVariables, context: unknown) => {
      // TODO: handle failed error

      // TODO: should reset state
      // e.g. for EOAs, allow user to reconnect wallet
      // e.g. for webauthn, reset
      console.log(error)
    },
    []
  )

  const showRecoveryOptions = useMemo(() => {
    return (
      challenge && (
        <XStack width="100%" gap="$2" alignItems="center" justifyContent="center">
          {data?.recoveryOptions.includes(RecoveryOptions.EOA) && (
            <RecoverWithEOA
              challenge={challenge}
              signState={signState}
              onSignSuccess={onSignSuccess}
              onSignError={onSignError}
            />
          )}

          {data?.recoveryOptions.includes(RecoveryOptions.WEBAUTHN) && (
            <Button flexBasis={0} flexGrow={1}>
              <ButtonText>Webauthn</ButtonText>
            </Button>
          )}
        </XStack>
      )
    )
  }, [data?.recoveryOptions, challenge, onSignSuccess, onSignError, signState])

  const showError = useMemo(() => {
    return (
      <>
        <Text fontWeight="bold" textAlign="center">
          Unable to recover account
        </Text>
        {error?.message && <Text textAlign="center">{error.message}</Text>}
      </>
    )
  }, [error])

  const showHeading = useMemo(() => {
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
          {error?.message ? (
            error.message
          ) : data?.recoveryOptions ? (
            `Recover with the ${getRecoveryOptionsStr(
              data?.recoveryOptions
            )} credentials linked to your account.`
          ) : (
            <Spinner size="small" color="$color11" />
          )}
        </Text>
      </>
    )
  }, [error, data])

  return (
    <YStack mt={'0'} w={'100%'} h={'100%'} jc={'space-between'}>
      <Stack flex={1} jc={'center'} alignItems="center" gap="$2">
        {isLoading && <Spinner size="large" color="$color11" />}
        {showHeading}
        {isSuccess && data?.recoveryOptions && showRecoveryOptions}
      </Stack>

      <Button
        w={'100%'}
        backgroundColor={'$primary'}
        hoverStyle={{ backgroundColor: '$primary' }}
        pressStyle={{ backgroundColor: '$primary' }}
        focusStyle={{ backgroundColor: '$primary' }}
        onPress={props.onClose}
        icon={<IconArrowLeft size={'$1'} color={iconColor} />}
      >
        <ButtonText>Return</ButtonText>
      </Button>
    </YStack>
  )
}

const getRecoveryOptionsStr = (recoveryOptions?: RecoveryOptions[]): string => {
  if (!recoveryOptions) {
    return ''
  }
  if (recoveryOptions.length <= 2) {
    return recoveryOptions.join(' or ')
  }
  return `${recoveryOptions.slice(0, recoveryOptions.length - 1).join(',')} or ${
    recoveryOptions[-1]
  }`
}
