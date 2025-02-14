import { ScrollView, XStack } from '@my/ui'
import { SettingsLinks } from './SettingsLinks'
import type { ReactNode } from 'react'

export type SettingsLayoutProps = {
  children?: ReactNode
}

export const SettingsLayout = ({ children }: SettingsLayoutProps) => {
  return (
    <XStack w={'100%'} gap={'$3.5'} pb={'$3.5'}>
      <ScrollView
        testID={'settings-links'}
        showsVerticalScrollIndicator={false}
        display={children ? 'none' : 'flex'}
        $gtLg={{
          display: 'flex',
          maxWidth: '49%',
        }}
      >
        <SettingsLinks />
      </ScrollView>
      <ScrollView
        testID={'settings-links'}
        showsVerticalScrollIndicator={false}
        display={children ? 'flex' : 'none'}
        $gtLg={{
          maxWidth: '49%',
        }}
      >
        {children}
      </ScrollView>
    </XStack>
  )
}
