import { Separator, XStack, YStack } from '@my/ui'
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
    <XStack f={1} pt={'$4'}>
      <YStack
        // this file is web-only so we can safely use CSS
        style={{
          transition: '200ms ease width',
        }}
        width="$14"
        display="none"
        $gtLg={{ display: 'flex' }}
        py={'$4'}
      >
        <YStack width={'100%'} gap={'$4'}>
          <YStack jc={'space-between'} zIndex={4} flex={1} width={'100%'}>
            <YStack h={'inherit'} gap={'$6'} width={'100%'}>
              <SettingsLinks />
            </YStack>
          </YStack>
        </YStack>
      </YStack>
      <Separator display="none" $gtLg={{ display: 'flex' }} vertical />
      <YStack f={1} ai="center" $gtLg={{ ml: '$8' }}>
        <YStack width="100%">{children}</YStack>
      </YStack>
    </XStack>
  )
}
