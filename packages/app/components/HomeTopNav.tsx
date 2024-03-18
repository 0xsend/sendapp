import { Button, H2, Header, Paragraph, XStack, Stack, useMedia, Link, Container } from '@my/ui'
import { useNav } from 'app/routers/params'
import { useThemeSetting } from '@tamagui/next-theme'
import { IconArrowLeft, IconGear, IconHamburger, IconQr, IconSendLogo } from 'app/components/icons'
import { usePathname } from 'app/utils/usePathname'
import { useRouter } from 'solito/router'
import { SettingsBottomSheet } from './settings/SettingsBottomSheet'

export function HomeTopNav({
  header,
  subheader,
  submenuHeader,
}: { header: string; subheader?: string; submenuHeader?: string }) {
  const [nav, setNavParam] = useNav()
  const path = usePathname()
  const { push } = useRouter()

  const handleHomeBottomSheet = () => {
    setNavParam(nav ? undefined : 'home', { webBehavior: 'replace' })
  }

  const handleSettingsBottomSheet = () => {
    setNavParam(nav ? undefined : 'settings', { webBehavior: 'replace' })
  }

  const handleBack = () => {
    const newPath = path.split('/').slice(0, -1).join('/')
    push(newPath)
  }

  const { resolvedTheme } = useThemeSetting()
  const iconColor = resolvedTheme?.startsWith('dark') ? '$primary' : '$black'

  const media = useMedia()

  const isSubRoute = path.split('/').length - 1 > 1

  return (
    <>
      {media.lg ? <SettingsBottomSheet /> : <></>}
      <Header
        w="100%"
        mb={'$6'}
        $lg={{ borderBottomColor: '$gray11Light', borderBottomWidth: '$1', py: '$4' }}
      >
        <Container>
          <XStack
            w={'100%'}
            $gtLg={{ jc: 'flex-start', pb: '$2' }}
            jc="space-between"
            ai="center"
            fd="row"
          >
            {isSubRoute ? (
              <Stack ai={'center'} onPress={handleBack}>
                <IconArrowLeft size={'$2.5'} color={iconColor} />
              </Stack>
            ) : (
              <Stack ai={'center'} $gtLg={{ display: 'none' }} onPress={handleHomeBottomSheet}>
                <IconHamburger size={'$2.5'} color={iconColor} />
              </Stack>
            )}
            {header === 'Home' && media.md ? (
              <XStack>
                <IconSendLogo size={'$2.5'} color={'$color12'} />
              </XStack>
            ) : media.gtLg || (media.lg && submenuHeader === '') ? (
              <H2 fontWeight={'300'} color={'$color05'} lineHeight={32}>
                {header}
              </H2>
            ) : (
              <H2 fontSize={'$8'} fontWeight={'300'} color={'$color05'} lineHeight={'$5'}>
                {submenuHeader}
              </H2>
            )}
            {path.includes('/account') ? (
              <Stack ai={'center'} $gtLg={{ display: 'none' }} onPress={handleSettingsBottomSheet}>
                <IconGear size={'$2.5'} color={iconColor} />
              </Stack>
            ) : (
              <Link href={'#'} $gtLg={{ display: 'none' }}>
                <Stack ai={'center'}>
                  <IconQr size={'$2.5'} color={iconColor} />
                </Stack>
              </Link>
            )}
          </XStack>
        </Container>
        {subheader && (
          <Paragraph
            fontWeight={'400'}
            fontSize={'$5'}
            fontFamily={'$mono'}
            lineHeight={24}
            px="$6"
            py="$3"
            $gtSm={{ py: '$6' }}
            $gtLg={{ ml: '$7', pb: '$4', pt: '$0' }}
            $theme-light={{ col: '$gray10Light' }}
            $theme-dark={{ col: '$gray10Dark' }}
          >
            {subheader}
          </Paragraph>
        )}
      </Header>
    </>
  )
}
