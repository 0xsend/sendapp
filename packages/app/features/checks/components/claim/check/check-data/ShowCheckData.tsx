import { Text, XStack, YStack } from '@my/ui'
import type { SendCheckData, TokenMetadata } from 'app/features/checks/types'
import { SenderData } from 'app/features/checks/components/claim/check/sender-data/SenderData'
import { CheckTokenAmount } from 'app/features/checks/components/claim/check/check-data/CheckTokenAmount'
import { useProfileLookup } from 'app/utils/useProfileLookup'

interface Props {
  sendCheckData: SendCheckData
  tokenMetadata?: TokenMetadata
  senderSendId: string
  onError: (error: Error) => void
}

export const ShowCheckData = (props: Props) => {
  const { data: profileData } = useProfileLookup('sendid', props.senderSendId)

  const showNote = () => {
    const hasNote = !!props.sendCheckData?.note
    if (hasNote) {
      return <Text>{props.sendCheckData.note}</Text>
    }
  }

  return (
    <YStack gap="$3">
      <XStack justifyContent="center" alignItems="center">
        <SenderData profileData={profileData} senderSendId={props.senderSendId} />
        <Text fontSize="$9">{profileData?.name ? ' has sent you' : 'You have received'}</Text>
      </XStack>

      <CheckTokenAmount
        tokenAmount={props.sendCheckData.amount}
        tokenImageUrl={props.tokenMetadata?.imageUrl}
        tokenName={props.tokenMetadata?.name as string}
        tokenIconSize={50}
      />

      {showNote()}
    </YStack>
  )
}
