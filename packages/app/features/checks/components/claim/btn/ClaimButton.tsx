import { Button, ButtonText, Spinner, XStack } from '@my/ui'
import { CheckValue } from 'app/features/checks/components/claim/check/check-data/CheckValue'
import { useState } from 'react'

export interface ClaimSendCheckBtnProps {
  tokenId?: number
  tokenAmount?: bigint
}

interface Props extends ClaimSendCheckBtnProps {
  onPress: () => void
}

export const ClaimButton = (props: Props) => {
  const [loading, setLoading] = useState<boolean>(false)
  const onPress = () => {
    setLoading(true)
    props.onPress()
  }

  const showCheckValue = () => {
    return (
      props.tokenAmount &&
      props.tokenId && <CheckValue tokenId={props.tokenId} tokenAmount={props.tokenAmount} />
    )
  }
  return (
    <Button onPress={onPress} backgroundColor="$primary">
      <XStack justifyContent="center" alignItems="center" gap="$2">
        {!loading && (
          <>
            <ButtonText fontSize="$6">CLAIM</ButtonText>
            {showCheckValue()}
          </>
        )}
        {loading && <Spinner size="large" color="$primary" />}
      </XStack>
    </Button>
  )
}
