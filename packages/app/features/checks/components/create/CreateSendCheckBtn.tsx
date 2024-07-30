import { Button, Text, YStack } from '@my/ui'
import { Link } from '@tamagui/lucide-icons'
import { ScreenParams, useSendScreenParams } from 'app/routers/params'

export const CreateSendCheckBtn = () => {
  const [sendParams, setSendParams] = useSendScreenParams()

  const onPress = () => {
    setSendParams(
      {
        ...sendParams,
        screen: ScreenParams.SEND_CHECKS,
      },
      { webBehavior: 'replace' }
    )
  }

  return (
    <Button justifyContent="flex-start" alignItems="center" py="$6" gap="$2" onPress={onPress}>
      <Link />
      <YStack gap="$1">
        <Text fontWeight="bold">Send a check</Text>
        <Text color="$darkGrayTextField">Send money to anyone via a URL</Text>
      </YStack>
    </Button>
  )
}
