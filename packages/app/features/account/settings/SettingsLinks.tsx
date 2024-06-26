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
      text: 'Notification',
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
      href: '/account/settings/privacy',
      disabled: true,
    },
    {
      text: 'Support',
      href: '/account/settings/support',
    },
    {
      text: 'Backup',
      href: '/account/settings/backup',
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
