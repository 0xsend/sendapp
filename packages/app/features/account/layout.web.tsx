import {
  BottomSheet,
  Container,
  Link,
  Nav,
  Paragraph,
  Separator,
  SheetProps,
  XStack,
  YStack,
  useMedia,
} from '@my/ui'
import { SettingsNavLink } from 'app/components/settings/SettingsNavLink'
import { useNav } from 'app/routers/params'

export type SettingsLayoutProps = {
  /**
   * web-only
   */
  isAccountHome?: boolean
  /**
   * web-only
   */
  children?: React.ReactNode
}

const settingsLinks = [
  {
    text: 'Edit Profile',
    href: '/account/settings/edit-profile',
  },
  {
    text: 'Personal Information',
    href: '/account',
  },
  {
    text: 'Notification',
    href: '/account',
  },
  {
    text: 'Security',
    href: '/account',
  },
  {
    text: 'Privacy',
    href: '/account',
  },
  {
    text: 'Support',
    href: '/account',
  },
]

const SettingsBottomSheet = ({ open }: SheetProps) => {
  const [nav, setNavParam] = useNav()

  const onOpenChange = () => {
    if (open) setNavParam('settings', { webBehavior: 'replace' })
    else setNavParam(undefined, { webBehavior: 'replace' })
  }

  return (
    <BottomSheet open={nav === 'settings'} onOpenChange={onOpenChange}>
      <Link href={'/'} marginTop={'$6'}>
        <Paragraph fontSize={'$6'} fontWeight={'700'} color={'$color12'}>
          Settings
        </Paragraph>
      </Link>
      <Nav display="flex" flex={2} justifyContent={'center'} alignItems="center">
        <YStack gap={'$4'} alignItems="stretch" justifyContent="center">
          {settingsLinks.map((link) => (
            <SettingsNavLink key={link.href} {...link} />
          ))}
        </YStack>
      </Nav>
    </BottomSheet>
  )
}

export const SettingsLayout = ({ children, isAccountHome = false }: SettingsLayoutProps) => {
  // const { isLoading, user } = useUser()
  // if (isLoading || !user) {
  //   return <FullscreenSpinner />
  // }
  const media = useMedia()

  return (
    <Container>
      {media.gtLg ? (
        <XStack separator={<Separator vertical />} f={1} gap={'$size.8'}>
          <YStack
            backgroundColor="$color1"
            // this file is web-only so we can safely use CSS
            style={{
              transition: '200ms ease width',
            }}
          >
            <YStack width={'100%'} gap={'$space.6'}>
              <YStack jc={'space-between'} zIndex={4}>
                <YStack h={'inherit'} gap={'$6'}>
                  {settingsLinks.map((link) => (
                    <SettingsNavLink key={link.href} {...link} />
                  ))}
                </YStack>
              </YStack>
            </YStack>
          </YStack>
          <YStack f={1} ai="center">
            <YStack width="100%">{children}</YStack>
          </YStack>
        </XStack>
      ) : (
        <>
          <SettingsBottomSheet />
          {children}
        </>
      )}
    </Container>
  )
}
