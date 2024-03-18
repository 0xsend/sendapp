import { Container, Separator, XStack, YStack, useMedia } from '@my/ui'
import { settingsLinks } from 'app/components/settings/SettingsBottomSheet'
import { SettingsNavLink } from 'app/components/settings/SettingsNavLink'

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

export const SettingsLayout = ({ children }: SettingsLayoutProps) => {
  // const { isLoading, user } = useUser()
  // if (isLoading || !user) {
  //   return <FullscreenSpinner />
  // }
  const media = useMedia()

  return (
    <Container>
      {media.gtLg ? (
        <XStack separator={<Separator vertical />} f={1} gap={'$size.8'} pt={'$4'}>
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
        <YStack width="100%">{children}</YStack>
      )}
    </Container>
  )
}
