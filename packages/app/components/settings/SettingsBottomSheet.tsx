import { BottomSheet, Link, Nav, Paragraph, SheetProps, YStack } from '@my/ui'
import { useNav } from 'app/routers/params'
import { SettingsNavLink } from './SettingsNavLink'

export const settingsLinks = [
  {
    text: 'Edit Profile',
    href: '/account/settings/edit-profile',
  },
  {
    text: 'Personal Information',
    href: '/account/settings/info',
  },
  {
    text: 'Notification',
    href: '/account/notification',
  },
  {
    text: 'Security',
    href: '/account/security',
  },
  {
    text: 'Privacy',
    href: '/account/privacy',
  },
  {
    text: 'Support',
    href: '/account/support',
  },
]

export const SettingsBottomSheet = ({ open }: SheetProps) => {
  const [nav, setNavParam] = useNav()

  const onOpenChange = () => {
    if (open) setNavParam('settings', { webBehavior: 'replace' })
    else setNavParam(undefined, { webBehavior: 'replace' })
  }

  return (
    <BottomSheet open={nav === 'settings'} onOpenChange={onOpenChange}>
      <Paragraph marginTop={'$6'} fontSize={'$6'} fontWeight={'700'} color={'$color12'}>
        Settings
      </Paragraph>
      <Nav display="flex" flex={2} justifyContent={'center'} alignItems="center">
        <YStack gap={'$4'} alignItems="stretch" justifyContent="center">
          {settingsLinks.map((link) => (
            <SettingsNavLink key={link.href} {...link} />
          ))}
        </YStack>
      </Nav>
    </BottomSheet>
  )
}
