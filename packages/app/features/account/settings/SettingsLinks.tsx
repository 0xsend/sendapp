import { SettingsNavLink } from './SettingsNavLink'
import { useSupabase } from 'app/utils/supabase/useSupabase'

export function SettingsLinks(): JSX.Element {
  const supabase = useSupabase()
  const settingsLinks = [
    {
      text: 'Edit Profile',
      href: '/account/settings/edit-profile',
    },
    {
      text: 'Personal Information',
      href: '/account/settings/personal-info',
    },
    {
      text: 'Notifications',
      href: '/account/settings/notification',
      disabled: true,
    },
    {
      text: 'Security',
      href: '/account/settings/security',
      disabled: true,
    },
    {
      text: 'Privacy',
      href: 'https://info.send.it/legal/privacy-policy',
    },
    {
      text: 'Backup',
      href: '/account/settings/backup',
    },
    {
      text: 'Support',
      href: '/account/settings/support',
    },
  ]
  return (
    <>
      {settingsLinks.map((link) => (
        <SettingsNavLink key={link.href} {...link} />
      ))}
      <SettingsNavLink key="logout" href="" text="Logout" onPress={() => supabase.auth.signOut()} />
    </>
  )
}
