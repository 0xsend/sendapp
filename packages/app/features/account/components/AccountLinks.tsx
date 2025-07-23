import { AccountNavLink } from './AccountNavLink'
import { useSupabase } from 'app/utils/supabase/useSupabase'
import type { PropsWithChildren, ReactNode } from 'react'
import { type ColorTokens, Fade, PrimaryButton, type SizeTokens, YGroup, YStack } from '@my/ui'
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
  IconXLogo,
} from 'app/components/icons'
import { RowLabel } from 'app/components/layout/RowLabel'
import useIntercom from 'app/utils/intercom/useIntercom'

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
    key: string
    href?: string
    icon: ReactNode
    target?: string
    onPress?: () => void
  }[]
} = {
  Settings: [
    {
      text: 'Profile',
      key: 'account-link-profile',
      href: '/account/edit-profile',
      icon: <IconAccount {...iconProps} />,
    },
    {
      text: 'Personal Information',
      key: 'account-link-personal-info',
      href: '/account/personal-info',
      icon: <IconIdCard {...iconProps} />,
    },
    {
      text: 'Link In Bio',
      key: 'account-link-link-in-bio',
      href: '/account/link-in-bio',
      icon: <IconXLogo {...iconProps} />,
    },
    {
      text: 'Passkeys',
      key: 'account-link-passkeys',
      href: '/account/backup',
      icon: <IconFingerprint {...iconProps} />,
    },
    {
      text: 'Sendtags',
      key: 'account-link-sendtags',
      href: '/account/sendtag',
      icon: <IconSlash {...iconProps} />,
    },
    {
      text: 'Rewards',
      key: 'account-link-rewards',
      href: '/rewards',
      icon: <IconStarOutline {...iconProps} />,
    },
    {
      text: 'Referrals',
      key: 'account-link-referrals',
      href: '/account/affiliate',
      icon: <IconDollar {...iconProps} scale={1.2} />,
    },
  ],
  Support: [
    {
      text: 'Learn more about Send',
      key: 'account-link-learn-more',
      href: 'https://support.send.app/en/',
      icon: <IconInfoCircle {...iconProps} />,
      target: '_blank',
    },
  ],
}

export function AccountLinks(): JSX.Element {
  const supabase = useSupabase()
  const { openChat } = useIntercom()

  const _links = {
    ...ACCOUNT_LINKS,
    Support: [
      ...(ACCOUNT_LINKS.Support || []),
      {
        text: 'Live Chat Support',
        key: 'account-link-live-chat-support',
        icon: <IconQuestionCircle {...iconProps} />,
        onPress: openChat,
      },
    ],
  }

  return (
    <YStack gap={'$5'} pb={'$3.5'}>
      {Object.entries(_links).map(([category, links]) => {
        return (
          <YStack key={category} gap={'$3.5'}>
            <RowLabel>{category}</RowLabel>
            <LinksGroup>
              {links.map(({ key, ...props }) => (
                <YGroup.Item key={key}>
                  <AccountNavLink {...props} />
                </YGroup.Item>
              ))}
            </LinksGroup>
          </YStack>
        )
      })}
      <PrimaryButton onPress={() => supabase.auth.signOut()}>
        <PrimaryButton.Icon>
          <IconLogout {...iconProps} color={'$black'} />
        </PrimaryButton.Icon>
        <PrimaryButton.Text>sign out</PrimaryButton.Text>
      </PrimaryButton>
    </YStack>
  )
}

const LinksGroup = ({ children }: PropsWithChildren) => {
  return (
    <Fade>
      <YGroup elevation={'$0.75'} bc={'$color1'} p={'$2'} $gtLg={{ p: '$3.5' }}>
        {children}
      </YGroup>
    </Fade>
  )
}
