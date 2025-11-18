import { Container, H2, Header, Paragraph, Stack, XStack } from '@my/ui'
import { IconSendLogo } from 'app/components/icons'
import { useUser } from 'app/utils/useUser'
import AvatarMenuButton from 'app/components/AvatarMenuButton/AvatarMenuButton'

export function SendTopNav() {
  const { profile } = useUser()

  return (
    <Header w="100%" $lg={{ py: '$3.5' }}>
      <Container
        $gtLg={{ jc: 'flex-start', pb: '$2', ai: 'flex-start' }}
        ai="center"
        jc="space-between"
        safeAreaProps={{ edges: { bottom: 'off' } }}
      >
        <XStack ai="center" $lg={{ f: 1 }} w="20%" $gtLg={{ display: 'none' }}>
          <Paragraph fontWeight="500" size="$8" col="$color12">
            <IconSendLogo size="$2.5" color="$color12" />
          </Paragraph>
          {profile && (
            <XStack ml={'auto'}>
              <AvatarMenuButton profile={profile} />
            </XStack>
          )}
        </XStack>
        <Stack $lg={{ display: 'none' }} jc="center">
          <H2
            fontWeight={'500'}
            col="$color12"
            lineHeight={32}
            display={'flex'}
            $lg={{ als: 'flex-end' }}
          >
            Send
          </H2>
        </Stack>
      </Container>
    </Header>
  )
}
