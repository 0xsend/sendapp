import { XStack, Text } from '@my/ui'
import { TokenIcon } from 'app/features/checks/components/claim/check/check-data/TokenIcon'

interface Props {
  tokenAmount: bigint
  tokenName: string
  tokenIconSize: number
  tokenImageUrl?: string
}

export const CheckTokenAmount = (props: Props) => {
  const showTokenIcon = () => {
    if (props.tokenImageUrl) {
      return (
        <TokenIcon
          tokenImageUrl={props.tokenImageUrl}
          tokenName={props.tokenName}
          tokenIconSize={props.tokenIconSize}
        />
      )
    }
  }
  return (
    <XStack gap="$3" justifyContent="center" alignItems="center">
      {showTokenIcon()}
      <Text fontSize="$9" fontWeight="bold">
        {props.tokenAmount.toLocaleString()} {props.tokenName}
      </Text>
    </XStack>
  )
}
