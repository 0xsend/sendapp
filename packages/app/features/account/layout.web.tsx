import { Container, Link, Paragraph, Separator, XStack, YStack } from '@my/ui'

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

export const SettingsLayout = ({ children, isAccountHome = false }: SettingsLayoutProps) => {
  // const { isLoading, user } = useUser()
  // if (isLoading || !user) {
  //   return <FullscreenSpinner />
  // }

  const settingsLinks = [
    {
      label: 'Edit Profile',
      href: '/account/settings/edit-profile',
    },
    {
      label: 'Personal Information',
      href: '/account',
    },
    {
      label: 'Notification',
      href: '/account',
    },
    {
      label: 'Security',
      href: '/account',
    },
    {
      label: 'Privacy',
      href: '/account',
    },
    {
      label: 'Support',
      href: '/account',
    },
  ]

  return (
    <Container>
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
                  <Link href={link.href} key={link.label}>
                    <Paragraph fontSize={16} fontWeight={'300'}>
                      {link.label}
                    </Paragraph>
                  </Link>
                ))}
              </YStack>
            </YStack>
          </YStack>
        </YStack>
        <YStack f={1} ai="center">
          <YStack width="100%">{children}</YStack>
        </YStack>
      </XStack>
    </Container>
  )
}
