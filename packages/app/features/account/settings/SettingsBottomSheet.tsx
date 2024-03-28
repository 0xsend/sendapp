import { Button, H2, Nav, Paragraph, ScrollView, type SheetProps, XStack, YStack } from '@my/ui'

import { useNav } from 'app/routers/params'
import { IconX } from 'app/components/icons'
import { SettingsLinks } from './SettingsLinks'
import { NavSheet } from 'app/components/NavSheet'

export const SettingsBottomSheet = ({ open }: SheetProps) => {
  const [nav, setNavParam] = useNav()

  const onOpenChange = () => {
    if (open) setNavParam('settings', { webBehavior: 'replace' })
    else setNavParam(undefined, { webBehavior: 'replace' })
  }

  return (
    <NavSheet open={nav === 'settings'} onOpenChange={onOpenChange}>
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

      <XStack pos={'absolute'} top={'$5'} right={'$6'}>
        <Button
          size="$4"
          transparent
          chromeless
          backgroundColor="transparent"
          hoverStyle={{ backgroundColor: 'transparent' }}
          pressStyle={{ backgroundColor: 'transparent' }}
          focusStyle={{ backgroundColor: 'transparent' }}
          circular
          icon={<IconX size="$2" color="$color9" />}
          onPress={onOpenChange}
          theme="accent"
        />
      </XStack>
    </NavSheet>
  )
}
