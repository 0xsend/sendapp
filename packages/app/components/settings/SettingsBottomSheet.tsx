import { BottomSheet, Link, Nav, Paragraph, SheetProps, XStack, YStack } from '@my/ui'
import { useNav } from 'app/routers/params'
import { SettingsNavLink } from './SettingsNavLink'
import { IconX } from '../icons'

export const settingsLinks = [
  {
    text: 'Edit Profile',
    href: '/account/settings/edit-profile',
  },
  {
    text: 'Personal Information',
    href: '/account/settings/personal-info',
  },
  {
    text: 'Notification',
    href: '/account/settings/notification',
  },
  {
    text: 'Security',
    href: '/account/settings/security',
  },
  {
    text: 'Privacy',
    href: '/account/settings/privacy',
  },
  {
    text: 'Support',
    href: '/account/settings/support',
  },
]

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
          {settingsLinks.map((link) => (
            <SettingsNavLink key={link.href} {...link} />
          ))}
        </YStack>
      </Nav>
      <XStack pos={'absolute'} top={'$5'} right={'$6'} onPress={onOpenChange}>
        <IconX color={'$color05'} />
      </XStack>
    </BottomSheet>
  )
}
