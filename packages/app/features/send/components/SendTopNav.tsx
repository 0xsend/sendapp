import { Button, Container, H2, Header, Paragraph, Stack, XStack, Button as ButtonOg } from '@my/ui'
import { IconArrowLeft, IconSendLogo } from 'app/components/icons'
import { useUser } from 'app/utils/useUser'
import AvatarMenuButton from 'app/components/AvatarMenuButton/AvatarMenuButton'
import { useTranslation } from 'react-i18next'
import { usePathname } from 'solito/navigation'
import { useSendScreenParams } from 'app/routers/params'
import { useRouter } from 'solito/router'
import { Platform } from 'react-native'

export function SendTopNav() {
  const { profile } = useUser()
  const path = usePathname()
  const { t } = useTranslation('send')
  const [sendParams] = useSendScreenParams()
  const { back } = useRouter()

  const isTagSend = sendParams?.idType === 'tag'

  const handleBack = () => {
    if (Platform.OS === 'web' || window.history.length > 1) {
      back()
    }
  }

  const isOnSelectRecipient = !(path?.includes('/confirm') || sendParams.recipient)

  return (
    <Header w="100%" $lg={{ py: '$3.5' }}>
      <Container
        $gtLg={{ jc: 'flex-start', pb: '$2', ai: 'flex-start' }}
        ai="center"
        jc="space-between"
        safeAreaProps={{ edges: { bottom: 'off' } }}
      >
        <XStack ai="center" $lg={{ f: 1 }} w="20%" $gtLg={{ display: 'none' }}>
          {!isOnSelectRecipient && !isTagSend && (
            <Button onPress={handleBack}>
              <ButtonOg.Icon>
                <IconArrowLeft
                  size={'$1.5'}
                  color={'$primary'}
                  $theme-light={{ color: '$color12' }}
                />
              </ButtonOg.Icon>
            </Button>
          )}
          <Paragraph fontWeight={'500'} size={isOnSelectRecipient ? '$9' : '$8'} col={'$color12'}>
            {path?.includes('/confirm') ? (
              t('topNav.preview')
            ) : Boolean(sendParams.recipient) && !isTagSend ? (
              t('topNav.enterAmount')
            ) : (
              <IconSendLogo size={'$2.5'} color={'$color12'} />
            )}
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
            {path?.includes('/confirm')
              ? t('topNav.preview')
              : Boolean(sendParams.recipient) && !isTagSend
                ? t('topNav.enterAmount')
                : t('topNav.default')}
          </H2>
        </Stack>
      </Container>
    </Header>
  )
}
