import { AccountNavLink } from './AccountNavLink'
import { useSupabase } from 'app/utils/supabase/useSupabase'
import type { PropsWithChildren, ReactNode } from 'react'
import { Button, type ColorTokens, Fade, type SizeTokens, YGroup, YStack } from '@my/ui'
import {
  IconAccount,
  IconDollar,
  IconFingerprint,
  IconIdCard,
  IconInfoCircle,
  IconLogout,
  IconQuestionCircle,
  IconSlash,
  IconStarOutline,
} from 'app/components/icons'
import { RowLabel } from 'app/components/layout/RowLabel'

const iconProps = {
  size: '$1.5' as SizeTokens,
  color: '$primary' as ColorTokens,
  '$theme-light': {
    color: '$color12' as ColorTokens,
  },
}

const ACCOUNT_LINKS: {
  [category: string]: {
    text: string
    href: string
    icon: ReactNode
    target?: string
  }[]
} = {
  Settings: [
    {
      text: 'Profile',
      href: '/account/edit-profile',
      icon: <IconAccount {...iconProps} />,
    },
    {
      text: 'Personal Information',
      href: '/account/personal-info',
      icon: <IconIdCard {...iconProps} />,
    },
    {
      text: 'Passkeys',
      href: '/account/backup',
      icon: <IconFingerprint {...iconProps} />,
    },
    {
      text: 'Sendtags',
      href: '/account/sendtag',
      icon: <IconSlash {...iconProps} />,
    },
    {
      text: 'Rewards',
      href: '/explore/rewards',
      icon: <IconStarOutline {...iconProps} />,
    },
    {
      text: 'Friends',
      href: '/account/affiliate',
      icon: <IconDollar {...iconProps} scale={1.2} />,
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

export function AccountLinks(): JSX.Element {
  const supabase = useSupabase()

  return (
    <YStack gap={'$5'}>
      {Object.entries(ACCOUNT_LINKS).map(([category, links]) => {
        return (
          <YStack key={category} gap={'$3.5'}>
            <RowLabel>{category}</RowLabel>
            <LinksGroup>
              {links.map((link) => (
                <YGroup.Item key={link.href}>
                  <AccountNavLink {...link} />
                </YGroup.Item>
              ))}
            </LinksGroup>
          </YStack>
        )
      })}
      <Button theme="green" onPress={() => supabase.auth.signOut()} py={'$5'} br={'$4'}>
        <Button.Icon>
          <IconLogout {...iconProps} color={'$black'} />
        </Button.Icon>
        <Button.Text ff={'$mono'} fontWeight={'500'} tt="uppercase" size={'$5'} color={'$black'}>
          sign out
        </Button.Text>
      </Button>
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
