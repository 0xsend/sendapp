import { SettingsNavLink } from './SettingsNavLink'
import { useSupabase } from 'app/utils/supabase/useSupabase'
import type { PropsWithChildren } from 'react'
import { Fade, YGroup, YStack } from '@my/ui'
import {
  IconAccount,
  IconIdCard,
  IconInfoCircle,
  IconKey,
  IconLogout,
  IconQuestionCircle,
} from 'app/components/icons'
import { RowLabel } from 'app/components/layout/RowLabel'

const iconProps = {
  size: '$1.5',
  color: '$primary',
  '$theme-light': {
    color: '$color12',
  },
}

const SETTINGS_LINKS = {
  Account: [
    {
      text: 'Profile',
      href: '/account/settings/edit-profile',
      icon: <IconAccount {...iconProps} />,
    },
    {
      text: 'Personal Information',
      href: '/account/settings/personal-info',
      icon: <IconIdCard {...iconProps} />,
    },
    {
      text: 'Passkeys',
      href: '/account/settings/backup',
      icon: <IconKey {...iconProps} />,
    },
  ],
  Support: [
    {
      text: 'Learn more about Send',
      href: 'https://support.send.app/en/',
      icon: <IconInfoCircle {...iconProps} />,
      target: '_blank',
    },
    {
      text: 'Contact Support',
      href: 'https://support.send.app/en/collections/10273227-reach-out',
      icon: <IconQuestionCircle {...iconProps} />,
      target: '_blank',
    },
  ],
}

export function SettingsLinks(): JSX.Element {
  const supabase = useSupabase()

  return (
    <YStack gap={'$5'}>
      {Object.entries(SETTINGS_LINKS).map(([category, links]) => {
        return (
          <YStack key={category} gap={'$3.5'}>
            <RowLabel>{category}</RowLabel>
            <LinksGroup>
              {links.map((link) => (
                <YGroup.Item key={link.href}>
                  <SettingsNavLink {...link} />
                </YGroup.Item>
              ))}
            </LinksGroup>
          </YStack>
        )
      })}
      <LinksGroup>
        <YGroup.Item key="logout">
          <SettingsNavLink
            href=""
            text="Sign out"
            icon={<IconLogout {...iconProps} />}
            onPress={() => supabase.auth.signOut()}
          />
        </YGroup.Item>
      </LinksGroup>
    </YStack>
  )
}

const LinksGroup = ({ children }: PropsWithChildren) => {
  return (
    <Fade>
      <YGroup bc={'$color1'} p={'$2'} $gtLg={{ p: '$3.5' }}>
        {children}
      </YGroup>
    </Fade>
  )
}
