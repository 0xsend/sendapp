import { ScrollView, useMedia, XStack, YStack } from '@my/ui'
import { SettingsLinks } from './SettingsLinks'
import type { ReactNode } from 'react'

export type SettingsLayoutProps = {
  children?: ReactNode
}

export const SettingsLayout = ({ children }: SettingsLayoutProps) => {
  const media = useMedia()

  if (media.gtLg) {
    return <DesktopSettingsLayout>{children}</DesktopSettingsLayout>
  }

  return <MobileSettingsLayout>{children}</MobileSettingsLayout>
}

const DesktopSettingsLayout = ({ children }: SettingsLayoutProps) => {
  return (
    <XStack w={'100%'} gap={'$3.5'} pb={'$3.5'}>
      <ScrollView testID={'settings-links'} showsVerticalScrollIndicator={false} maxWidth={'49%'}>
        <SettingsLinks />
      </ScrollView>
      <ScrollView testID={'settings-links'} showsVerticalScrollIndicator={false} maxWidth={'49%'}>
        {children}
      </ScrollView>
    </XStack>
  )
}

const MobileSettingsLayout = ({ children }: SettingsLayoutProps) => {
  return (
    <XStack w={'100%'} gap={'$3.5'} pb={'$3.5'}>
      <YStack w={'100%'} testID={'settings-links'} display={children ? 'none' : 'flex'}>
        <SettingsLinks />
      </YStack>
      <YStack w={'100%'} testID={'settings-links'} display={children ? 'flex' : 'none'}>
        {children}
      </YStack>
    </XStack>
  )
}
