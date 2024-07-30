import type { ClaimSendCheckPayload } from 'app/features/checks/types'
import { ClaimButtonGuest } from 'app/features/checks/components/claim/btn/ClaimButtonGuest'
import { ClaimButtonUser } from 'app/features/checks/components/claim/btn/ClaimButtonUser'
import { ShowCheckData } from 'app/features/checks/components/claim/check/check-data/ShowCheckData'
import { useProfileLookup } from 'app/utils/useProfileLookup'
import { Spinner, YStack, Text, Button, ButtonText, XStack, Card, Label } from '@my/ui'
import { useMemo, useState } from 'react'
import { useSendCheckData } from 'app/features/checks/utils/useSendCheckData'
import { IconError } from 'app/components/icons'
import { useRouter } from 'next/navigation'
import { useCoinGeckoTokenId, useTokenMarketData } from 'app/utils/coin-gecko'
import { checkExists } from 'app/features/checks/utils/checkUtils'
import { GreenSquare } from 'app/features/home/TokenBalanceCard'

interface Props {
  payload: ClaimSendCheckPayload
  onSuccess: () => void
  onError: (error: Error) => void
}

export const ClaimSendCheck = (props: Props) => {
  const [error, setError] = useState<Error>()

  const {
    data: sendCheckData,
    isLoading: sendCheckDataLoading,
    isSuccess,
  } = useSendCheckData(props.payload.ephemeralKeypair.ephemeralAddress, {
    retry: 3,
  })
  const { data: tokenId } = useCoinGeckoTokenId(sendCheckData?.token as `0x${string}`, {
    retry: 3,
  })
  const { data: tokenData } = useTokenMarketData(tokenId)

  const { data: profileData } = useProfileLookup('sendid', props.payload.senderSendId)

  const router = useRouter()
  const isError = !!error
  const signedIn = !!profileData

  useMemo(() => {
    if (isSuccess && !checkExists(sendCheckData)) {
      setError(new Error("Check doesn't exist or has been claimed already."))
    }
  }, [isSuccess, sendCheckData])

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
        <Text fontSize="$7" color="$darkGrayTextField" textAlign="center">
          {error.message ?? 'Please try again'}
        </Text>
        <Button backgroundColor="$primary" onPress={() => router.refresh()}>
          <ButtonText fontSize="$6">Try again</ButtonText>
        </Button>
      </YStack>
    )
  }

  const showHeader = () => {
    return (
      <XStack gap="$2.5" ai="center" jc="center">
        <GreenSquare />
        <Label
          fontSize={'$4'}
          zIndex={1}
          fontWeight={'500'}
          textTransform={'uppercase'}
          col={'$color10'}
        >
          /send Check
        </Label>
      </XStack>
    )
  }

  const showCheckData = () => {
    return (
      <Card
        $lg={{ bc: 'transparent' }}
        px="$12"
        py="$6"
        w={'100%'}
        jc="space-between"
        br={12}
        gap="$6"
        maxWidth={'40%'}
        my="auto"
        mx="auto"
      >
        <YStack gap="$3">
          {showHeader()}
          {sendCheckData && (
            <ShowCheckData
              sendCheckData={sendCheckData}
              tokenMetadata={{
                name: tokenData?.[0]?.name as string,
                imageUrl: tokenData?.[0]?.image as string,
                coinGeckoTokenId: tokenId as string,
              }}
              senderSendId={props.payload.senderSendId}
              onError={props.onError}
            />
          )}
        </YStack>
        {signedIn ? (
          <ClaimButtonUser
            onError={onError}
            onSuccess={props.onSuccess}
            payload={props.payload}
            tokenId={tokenId}
            tokenAmount={sendCheckData?.amount}
          />
        ) : (
          <ClaimButtonGuest tokenId={tokenId} tokenAmount={sendCheckData?.amount} />
        )}
      </Card>
    )
  }

  const onError = (error: Error) => {
    setError(error)
  }

  return isError ? showError(error) : sendCheckDataLoading ? showSpinner() : showCheckData()
}
