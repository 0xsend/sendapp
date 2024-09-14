import { Card, Separator, XStack, YStack } from '@my/ui'
import { SettingsLinks } from './SettingsLinks'

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
  return (
    <YStack pb={'$size.3.5'} f={1} pt={'$size.0.9'} $gtLg={{ pt: 0 }}>
      <Card width={'100%'} p={'$size.3.5'}>
        <XStack f={1}>
          <YStack
            // this file is web-only so we can safely use CSS
            style={{
              transition: '200ms ease width',
            }}
            width="$size.16"
            display="none"
            $gtLg={{ display: 'flex' }}
          >
            <YStack width={'100%'} gap={'$4'}>
              <YStack jc={'space-between'} zIndex={4} flex={1} width={'100%'}>
                <YStack h={'inherit'} gap={'$size.1.5'} width={'100%'}>
                  <SettingsLinks />
                </YStack>
              </YStack>
            </YStack>
          </YStack>
          <Separator display="none" $gtLg={{ display: 'flex' }} vertical />
          <YStack f={1} ai="center" $gtLg={{ ml: '$size.8' }}>
            <YStack width="100%">{children}</YStack>
          </YStack>
        </XStack>
      </Card>
    </YStack>
  )
}
