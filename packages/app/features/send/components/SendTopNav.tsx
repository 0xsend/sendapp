import {
  Button as ButtonOg,
  Container,
  H2,
  Header,
  Separator,
  Stack,
  usePwa,
  XStack,
  type ButtonProps,
} from '@my/ui'
import { IconArrowLeft } from 'app/components/icons'
import { SettingsBottomSheet } from 'app/features/account/settings/SettingsBottomSheet'
import { useSendScreenParams } from 'app/routers/params'
import { usePathname } from 'app/utils/usePathname'
import { useRouter } from 'solito/router'

export function SendTopNav() {
  const [sendParams] = useSendScreenParams()
  const { isPwa } = usePwa()
  const { push } = useRouter()
  const path = usePathname()
  const parts = path.split('/').filter(Boolean)

  const handleBack = () => {
    // pop to the base path if subroute. e.g. /account/settings/edit-profile -> /account
    // else, go to home page
    const newPath = parts.slice(0, -1).join('/')
    push(`/${newPath}`)
  }

  return (
    <Header w="100%" pb="$6">
      <Container
        $gtLg={{ jc: 'flex-start', pb: '$2', ai: 'flex-start' }}
        ai="center"
        jc="space-between"
        safeAreaPadding={isPwa && 't'}
        $lg={{ pt: !isPwa && '$5', pb: '$5' }}
      >
        <Button
          onPress={handleBack}
          $gtLg={{ display: 'none' }}
          icon={
            <IconArrowLeft size={'$2.5'} color={'$primary'} $theme-light={{ color: '$color12' }} />
          }
        />
        <Stack $lg={{ f: 1 }}>
          <H2
            fontWeight={'300'}
            $theme-light={{ col: '$gray10Light' }}
            $theme-dark={{ col: '$gray8Light' }}
            lineHeight={32}
            display={'flex'}
            als={'center'}
          >
            {sendParams.recipient ? 'Enter Amount' : 'Select Recipient'}
          </H2>
        </Stack>
        <XStack w={0} h={0} $lg={{ f: 1 }} />
      </Container>

      <Separator w={'100%'} borderColor="$decay" $gtLg={{ display: 'none' }} />

      <SettingsBottomSheet />
    </Header>
  )
}

function Button(props: ButtonProps) {
  return (
    <ButtonOg
      bc="transparent"
      chromeless
      circular
      jc={'center'}
      ai={'center'}
      hoverStyle={{
        backgroundColor: 'transparent',
        borderColor: '$background',
      }}
      pressStyle={{
        backgroundColor: 'transparent',
      }}
      focusStyle={{
        backgroundColor: 'transparent',
      }}
      theme="green"
      {...props}
    />
  )
}
