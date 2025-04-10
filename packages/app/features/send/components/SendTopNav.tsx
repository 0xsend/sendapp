import {
  Button as ButtonOg,
  Container,
  H2,
  Header,
  isWeb,
  Paragraph,
  Stack,
  XStack,
  type ButtonProps,
} from '@my/ui'
import { IconArrowLeft } from 'app/components/icons'
import { useSendScreenParams } from 'app/routers/params'
import { usePathname } from 'app/utils/usePathname'
import { useRouter } from 'solito/router'

export function SendTopNav() {
  const [sendParams] = useSendScreenParams()
  const { back } = useRouter()

  const path = usePathname()

  const handleBack = () => {
    if (isWeb || window.history.length > 1) {
      back()
    }
  }

  return (
    <Header w="100%" $lg={{ pt: '$3' }}>
      <Container
        $gtLg={{ jc: 'flex-start', pb: '$2', ai: 'flex-start' }}
        ai="center"
        jc="space-between"
        safeAreaProps={{ edges: ['top'] }}
      >
        <XStack ai="center" $lg={{ f: 1 }} w="20%" $gtLg={{ display: 'none' }}>
          <Button onPress={handleBack}>
            <ButtonOg.Icon>
              <IconArrowLeft
                size={'$1.5'}
                $theme-dark={{ color: '$primary' }}
                $theme-light={{ color: '$color12' }}
                color={'$color12'}
              />
            </ButtonOg.Icon>
          </Button>
          <Paragraph size={'$8'} col={'$color10'}>
            {(() => {
              switch (true) {
                case path.includes('/confirm'):
                  return 'Preview and Send'
                case Boolean(sendParams.recipient):
                  return 'Enter Amount'
                default:
                  return 'Select Recipient'
              }
            })()}
          </Paragraph>
        </XStack>
        <Stack $lg={{ display: 'none' }} jc="center">
          <H2
            fontWeight={'300'}
            $theme-light={{ col: '$gray10Light' }}
            $theme-dark={{ col: '$gray8Light' }}
            lineHeight={32}
            display={'flex'}
            $lg={{ als: 'flex-end' }}
          >
            {' '}
            {(() => {
              switch (true) {
                case path.includes('/confirm'):
                  return 'Preview and Send'
                case Boolean(sendParams.recipient):
                  return 'Enter Amount'
                default:
                  return 'Select Recipient'
              }
            })()}
          </H2>
        </Stack>
      </Container>
    </Header>
  )
}

function Button(props: ButtonProps) {
  return (
    <ButtonOg
      bc="transparent"
      chromeless
      circular
      jc={'flex-start'}
      ai={'center'}
      bw={0}
      hoverStyle={{
        backgroundColor: 'transparent',
      }}
      pressStyle={{
        backgroundColor: 'transparent',
      }}
      focusStyle={{
        backgroundColor: 'transparent',
      }}
      theme="green_active"
      {...props}
    />
  )
}
