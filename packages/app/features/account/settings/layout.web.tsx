import { Container, Separator, XStack, YStack, useMedia } from '@my/ui'
import { settingsLinks } from './SettingsBottomSheet'
import { SettingsNavLink } from './SettingsNavLink'

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
  const media = useMedia()

  return (
    <Container>
      {media.gtLg ? (
        <XStack f={1} pt={'$4'}>
          <YStack
            backgroundColor="$color1"
            // this file is web-only so we can safely use CSS
            style={{
              transition: '200ms ease width',
            }}
            width="$14"
          >
            <YStack width={'100%'} gap={'$4'}>
              <YStack jc={'space-between'} zIndex={4} flex={1} width={'100%'}>
                <YStack h={'inherit'} gap={'$6'} width={'100%'}>
                  {settingsLinks.map((link) => (
                    <SettingsNavLink key={link.href} {...link} />
                  ))}
                </YStack>
              </YStack>
            </YStack>
          </YStack>
          <Separator vertical />
          <YStack f={1} ai="center" ml="$8">
            <YStack width="100%">{children}</YStack>
          </YStack>
        </XStack>
      ) : (
        <YStack width="100%">{children}</YStack>
      )}
    </Container>
  )
}
