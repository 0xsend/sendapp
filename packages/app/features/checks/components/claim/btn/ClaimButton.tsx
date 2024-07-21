import { Button, ButtonText, XStack } from '@my/ui'
import { CheckValue } from 'app/features/checks/components/claim/check/check-data/CheckValue'

export interface ClaimSendCheckBtnProps {
  tokenId?: number
  tokenAmount?: bigint
}

interface Props extends ClaimSendCheckBtnProps {
  onPress: () => void
}

export const ClaimButton = (props: Props) => {
  const showCheckValue = () => {
    return (
      props.tokenAmount &&
      props.tokenId && <CheckValue tokenId={props.tokenId} tokenAmount={props.tokenAmount} />
    )
  }
  return (
    <Button onPress={props.onPress} backgroundColor="$primary">
      <XStack justifyContent="center" alignItems="center" gap="$2">
        <ButtonText fontSize="$6">CLAIM</ButtonText>
        {showCheckValue()}
      </XStack>
    </Button>
  )
}
