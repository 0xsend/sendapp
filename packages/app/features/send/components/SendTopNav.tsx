// TopNav.tsx
import {
  H2,
  Header,
  Stack,
  useMedia,
  Button as ButtonOg,
  Container,
  Separator,
  type ButtonProps,
} from '@my/ui'
import { useNav, useRecipient } from 'app/routers/params'
import { useThemeSetting } from '@tamagui/next-theme'
import { IconHamburger } from 'app/components/icons'
import { SettingsBottomSheet } from 'app/features/account/settings/SettingsBottomSheet'

export function SendTopNav() {
  const [nav, setNavParam] = useNav()
  const [recipient] = useRecipient()

  const media = useMedia()

  const handleHomeBottomSheet = () => {
    setNavParam(nav ? undefined : 'home', { webBehavior: 'replace' })
  }

  const { resolvedTheme } = useThemeSetting()
  const iconColor = resolvedTheme?.startsWith('dark') ? '$primary' : '$black'

  return (
    <Header w="100%" pb="$6">
      <Container
        $gtLg={{ jc: 'flex-start', pb: '$2', ai: 'flex-start' }}
        ai="center"
        jc="space-between"
        $lg={{ py: '$6' }}
      >
        <Stack display={media.lg ? 'flex' : 'none'} jc="center" $gtLg={{ fd: 'row' }}>
          <Button
            $gtLg={{ disabled: true, opacity: 0 }} // We need the button to be there for layout purposes
            onPress={handleHomeBottomSheet}
            icon={<IconHamburger size={'$2.5'} color={iconColor} />}
          />
        </Stack>
        <Stack>
          <H2
            fontWeight={'300'}
            $theme-light={{ col: '$gray10Light' }}
            $theme-dark={{ col: '$gray8Light' }}
            lineHeight={32}
            display={'flex'}
            als={'center'}
          >
            {recipient ? 'Enter Amount' : 'Select Recipient'}
          </H2>
        </Stack>
        <Stack />
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
      theme="accent"
      {...props}
    />
  )
}
