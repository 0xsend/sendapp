import type { ClaimSendCheckPayload } from 'app/features/checks/types'
import { ClaimButtonGuest } from 'app/features/checks/components/claim/btn/ClaimButtonGuest'
import { ClaimButtonUser } from 'app/features/checks/components/claim/btn/ClaimButtonUser'
import { ShowCheckData } from 'app/features/checks/components/claim/check/check-data/ShowCheckData'
import { useProfileLookup } from 'app/utils/useProfileLookup'
import { Spinner, YStack, Text, Button, ButtonText, XStack } from '@my/ui'
import { useState } from 'react'
import { useSendCheckData } from 'app/features/checks/utils/useSendCheckData'
import { IconError } from 'app/components/icons'
import { useRouter } from 'next/navigation'
import { useTokenMetadata } from 'app/utils/coin-gecko'

interface Props {
  payload: ClaimSendCheckPayload
  onSuccess: () => void
  onError: (error: Error) => void
}

export const ClaimSendCheck = (props: Props) => {
  const [error, setError] = useState<Error>()

  const { data: sendCheckData, isLoading: sendCheckDataLoading } = useSendCheckData(
    props.payload.ephemeralKeypair.ephemeralAddress
  )
  const { data: tokenData } = useTokenMetadata(sendCheckData?.token as `0x${string}`)
  const { data: profileData } = useProfileLookup('sendid', props.payload.senderSendId)

  const router = useRouter()
  const isError = !!error
  const signedIn = !!profileData

  const showSpinner = () => {
    return (
      <Spinner
        animation="medium"
        enterStyle={{ opacity: 1 }}
        exitStyle={{ opacity: 0 }}
        color="$primary"
        size="large"
      />
    )
  }

  const showError = (error: Error) => {
    return (
      <YStack gap="$4" animation="medium" enterStyle={{ opacity: 1 }} exitStyle={{ opacity: 0 }}>
        <XStack justifyContent="center" alignItems="center" gap="$2">
          <IconError size={50} alignSelf="center" color="red" />
          <Text fontSize="$9" color="$black" textAlign="center">
            Unable to claim check
          </Text>
        </XStack>
        <Text fontSize="$5" color="$darkGrayTextField" textAlign="center">
          {error.message}
        </Text>
        <Button backgroundColor="$primary" onPress={() => router.refresh()}>
          <ButtonText fontSize="$6">Try again</ButtonText>
        </Button>
      </YStack>
    )
  }

  const showCheckData = () => {
    return (
      <>
        {sendCheckData && (
          <ShowCheckData
            sendCheckData={sendCheckData}
            tokenData={tokenData}
            senderSendId={props.payload.senderSendId}
            onError={props.onError}
          />
        )}
        {signedIn ? (
          <ClaimButtonUser
            onError={onError}
            onSuccess={props.onSuccess}
            payload={props.payload}
            tokenId={tokenData?.id}
            tokenAmount={sendCheckData?.amount}
          />
        ) : (
          <ClaimButtonGuest tokenId={tokenData?.id} tokenAmount={sendCheckData?.amount} />
        )}
      </>
    )
  }

  const onError = (error: Error) => {
    setError(error)
  }

  return (
    <YStack gap="$4" mx="auto" my="auto" borderRadius="$6" padding="$6" maxWidth="50%">
      {isError ? showError(error) : sendCheckDataLoading ? showSpinner() : showCheckData()}
    </YStack>
  )
}
