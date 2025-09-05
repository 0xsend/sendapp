import { Button, useThemeName } from '@my/ui'
import { IconArrowUp } from 'app/components/icons'
import { useRouter } from 'expo-router'

export default function ProfileSendButton({ sendId }: { sendId?: number | null }) {
  const isDark = useThemeName()?.startsWith('dark')
  const router = useRouter()

  const onPress = () => {
    router.push({ pathname: '/send/form', params: { recipient: sendId, idType: 'sendid' } })
  }

  return (
    <Button
      onPress={onPress}
      borderRadius={'$4'}
      jc="center"
      ai="center"
      position="relative"
      bc={isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}
      f={1}
    >
      <Button.Icon>
        <IconArrowUp size={'$1'} color={isDark ? '$primary' : '$color12'} />
      </Button.Icon>
      <Button.Text color="$color12" fontSize={'$4'} fontWeight={'400'} textAlign="center">
        Send
      </Button.Text>
    </Button>
  )
}
