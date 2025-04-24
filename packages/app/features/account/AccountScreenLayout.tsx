import { ScrollView, useMedia, XStack, YStack } from '@my/ui'
import type { ReactNode } from 'react'
import { AccountLinks } from 'app/features/account/components/AccountLinks'
import { BOTTOM_NAV_BAR_HEIGHT } from 'app/components/BottomTabBar/BottomNavBar'
import { AccountHeader } from 'app/features/account/components/AccountHeader'

export type SettingsLayoutProps = {
  children?: ReactNode
}

export const AccountScreenLayout = ({ children }: SettingsLayoutProps) => {
  const media = useMedia()

  if (media.gtLg) {
    return <DesktopAccountLayout>{children}</DesktopAccountLayout>
  }

  return <MobileAccountLayout>{children}</MobileAccountLayout>
}

const DesktopAccountLayout = ({ children }: SettingsLayoutProps) => {
  return (
    <XStack w={'100%'} gap={'$3.5'} pb={'$3.5'}>
      <ScrollView testID={'settings-links'} showsVerticalScrollIndicator={false} maxWidth={'49%'}>
        <AccountHeader mb={'$3.5'} />
        <AccountLinks />
      </ScrollView>
      <ScrollView testID={'settings-links'} showsVerticalScrollIndicator={false} maxWidth={'49%'}>
        {children}
      </ScrollView>
    </XStack>
  )
}

const MobileAccountLayout = ({ children }: SettingsLayoutProps) => {
  return (
    <YStack w={'100%'} gap={'$3.5'}>
      <YStack
        w={'100%'}
        testID={'settings-links'}
        display={children ? 'none' : 'flex'}
        pb={BOTTOM_NAV_BAR_HEIGHT}
      >
        <AccountHeader mb={'$3.5'} />
        <AccountLinks />
      </YStack>
      <YStack
        w={'100%'}
        testID={'settings-links'}
        display={children ? 'flex' : 'none'}
        pb={BOTTOM_NAV_BAR_HEIGHT}
      >
        {children}
      </YStack>
    </YStack>
  )
}
