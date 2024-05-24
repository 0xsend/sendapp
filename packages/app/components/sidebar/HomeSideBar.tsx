import {
  Avatar,
  H4,
  Link,
  Nav,
  Paragraph,
  ScrollView,
  Separator,
  SideBar,
  XStack,
  YStack,
  useMedia,
  type YStackProps,
} from '@my/ui'
import { baseMainnet } from '@my/wagmi/chains'
import {
  IconAccount,
  IconActivity,
  IconHome,
  IconSendLogo,
  IconDeviceReset,
} from 'app/components/icons'
import { SideBarNavLink } from 'app/components/sidebar/SideBarNavLink'

import type { ReactElement } from 'react'
import { NavSheet } from '../NavSheet'

import { useUser } from 'app/utils/useUser'
import { ReferralLink } from '../ReferralLink'

const links = [
  {
    icon: <IconHome size={'$1.75'} color={'inherit'} />,
    text: 'Home',
    href: '/',
  },
  {
    icon: <IconActivity size={'$1'} color={'inherit'} />,
    text: 'Send',
    href: '/send',
  },
  {
    icon: <IconDeviceReset size={'$1'} color={'inherit'} />,
    text: 'Activity',
    href: '/activity',
  },
  {
    icon: <IconAccount size={'$1'} color={'inherit'} />,
    text: 'Account',
    href: '/account',
  },
  __DEV__ || baseMainnet.id === 84532
    ? {
        icon: <Paragraph px="$1">🔒</Paragraph>,
        text: 'Secret shop',
        href: '/secret-shop',
      }
    : undefined,
].filter(Boolean) as { icon: ReactElement; text: string; href: string }[]

const HomeSideBar = ({ ...props }: YStackProps) => {
  return (
    <SideBar {...props} ai={'flex-start'} pl="$7">
      <Link href={'/'}>
        <IconSendLogo color={'$color12'} size={'$2.5'} />
      </Link>

      <YStack gap={'$7'} pt={'$10'} jc={'space-between'}>
        {links.map((link) => (
          <SideBarNavLink key={link.href} {...link} />
        ))}
      </YStack>
    </SideBar>
  )
}

const HomeBottomSheet = () => {
  const { profile } = useUser()
  const avatarUrl = profile?.avatar_url

  return (
    <NavSheet navId="home">
      <XStack gap="$4" ai="center">
        <Avatar size="$4.5" br={'$3'}>
          <Avatar.Image src={avatarUrl ?? ''} />
          <Avatar.Fallback jc={'center'} delayMs={200}>
            <IconAccount size="$4.5" color="$olive" />
          </Avatar.Fallback>
        </Avatar>
        <YStack>
          <H4>{profile?.name ?? `#${profile?.send_id}`}</H4>
          <ReferralLink p={0} />
        </YStack>
      </XStack>
      <Nav display="flex" flex={2} height="100%">
        <ScrollView gap={'$4'} alignItems="stretch" ml="$-5" height="100%">
          {links.map((link, idx) => (
            <YStack
              key={link.href}
              gap={'$4'}
              alignItems="stretch"
              justifyContent="center"
              f={1}
              pl={'$5'}
              h={'$7'}
            >
              <SideBarNavLink key={link.href} {...link} />
              {idx !== links.length - 1 && (
                <Separator
                  width="100%"
                  pos={'absolute'}
                  left="$-6"
                  bottom="$0"
                  borderColor="$decay"
                />
              )}
            </YStack>
          ))}
        </ScrollView>
      </Nav>
    </NavSheet>
  )
}

export const HomeSideBarWrapper = ({ children }: { children?: React.ReactNode }) => {
  const media = useMedia()

  return (
    <XStack overflow="hidden" height={'100%'}>
      {media.gtLg && <HomeSideBar width={234} minWidth={234} pt={80} jc="flex-start" />}
      {children}
      <HomeBottomSheet />
    </XStack>
  )
}
