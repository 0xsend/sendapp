import { BottomSheet, Button, Nav, Paragraph, SheetProps, XStack, YStack } from '@my/ui'
import { useNav } from 'app/routers/params'
import { IconX } from 'app/components/icons'
import { SettingsLinks } from './SettingsLinks'

export const SettingsBottomSheet = ({ open }: SheetProps) => {
  const [nav, setNavParam] = useNav()

  const onOpenChange = () => {
    if (open) setNavParam('settings', { webBehavior: 'replace' })
    else setNavParam(undefined, { webBehavior: 'replace' })
  }

  return (
    <BottomSheet open={nav === 'settings'} onOpenChange={onOpenChange} snapPointsMode="fit">
      <Paragraph pb={'$6'} fontSize={'$6'} fontWeight={'700'} color={'$color12'}>
        Settings
      </Paragraph>
      <Nav display="flex" flex={2} justifyContent={'center'} pb={'$5'}>
        <YStack gap={'$6'} alignItems="stretch" justifyContent="center">
          <SettingsLinks />
        </YStack>
      </Nav>

      <XStack pos={'absolute'} top={'$5'} right={'$6'}>
        <Button size="$4" transparent circular icon={IconX} onPress={onOpenChange} />
      </XStack>
    </BottomSheet>
  )
}
