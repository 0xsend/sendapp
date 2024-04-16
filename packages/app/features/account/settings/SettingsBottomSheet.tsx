import { Nav, Paragraph, ScrollView, YStack } from '@my/ui'

import { SettingsLinks } from './SettingsLinks'
import { NavSheet } from 'app/components/NavSheet'

export const SettingsBottomSheet = () => {
  return (
    <NavSheet navId={'settings'}>
      <Paragraph pb={'$6'} fontSize={'$8'} fontWeight={'700'} color={'$color12'}>
        Settings
      </Paragraph>

      <Nav display="flex" flex={2} justifyContent={'center'} pb={'$2'}>
        <ScrollView height="100%">
          <YStack gap={'$6'} alignItems="stretch" justifyContent="center">
            <SettingsLinks />
          </YStack>
        </ScrollView>
      </Nav>
    </NavSheet>
  )
}
