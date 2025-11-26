import { Button, LinkableButton, useThemeName } from '@my/ui'
import { IconArrowUp } from 'app/components/icons'

export default function ProfileSendButton({ sendId }: { sendId?: number | null }) {
  const isDark = useThemeName()?.startsWith('dark')

  return (
    <LinkableButton
      href={{
        pathname: '/send',
        query: { recipient: sendId, idType: 'sendid', m: 1 },
      }}
      borderRadius={'$4'}
      jc="center"
      ai="center"
      position="relative"
      bc={isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}
      f={1}
      testID="profileSendButton"
    >
      <Button.Icon>
        <IconArrowUp size={'$1'} color={isDark ? '$primary' : '$color12'} />
      </Button.Icon>
      <Button.Text color="$color12" fontSize={'$4'} fontWeight={'400'} textAlign="center">
        Send
      </Button.Text>
    </LinkableButton>
  )
}
