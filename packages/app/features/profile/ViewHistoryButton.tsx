import { Paragraph } from '@my/ui'
import { useSendScreenParams } from 'app/routers/params'

export default function ViewHistoryButton({ sendId }: { sendId?: number | null }) {
  const [sendParams, setSendParams] = useSendScreenParams()

  const onPress = () => {
    setSendParams({
      ...sendParams,
      recipient: sendId?.toString() ?? '',
      idType: 'sendid',
    })
  }

  return (
    <Paragraph
      textDecorationLine="underline"
      onPress={onPress}
      als="flex-start"
      fontSize={'$5'}
      color="$color10"
      cursor="pointer"
    >
      View History
    </Paragraph>
  )
}
