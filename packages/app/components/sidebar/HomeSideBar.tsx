import {
  Avatar,
  Link,
  LinkableAvatar,
  Nav,
  Paragraph,
  ScrollView,
  Separator,
  SideBar,
  useMedia,
  XStack,
  YStack,
  type YStackProps,
} from '@my/ui'
import { baseMainnet } from '@my/wagmi/chains'
import {
  IconAccount,
  IconActivity,
  IconDeviceReset,
  IconHome,
  IconSendLogo,
  IconSwap,
  IconGame,
} from 'app/components/icons'
import { SideBarNavLink } from 'app/components/sidebar/SideBarNavLink'

import type { ReactElement } from 'react'
import { NavSheet } from '../NavSheet'

import { useUser } from 'app/utils/useUser'
import { ReferralLink } from '../ReferralLink'
import { useHoverStyles } from 'app/utils/useHoverStyles'

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
    icon: <IconSwap size={'$1'} color={'inherit'} />,
    text: 'Swap',
    href: '/swap',
  },
  {
    icon: <IconGame size={'$1'} color={'inherit'} />,
    text: 'Play',
    href: '/play',
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

// this code can be removed then swaps are no longer behind whitelist
const useActiveLinks = () => {
  const { user } = useUser()
  const isSwapAllowListSet = Boolean(process.env.NEXT_PUBLIC_SWAP_ALLOWLIST)
  const swapEnabledUsers = (process.env.NEXT_PUBLIC_SWAP_ALLOWLIST ?? '').split(',')
  const isSwapEnabled = !isSwapAllowListSet || (user?.id && swapEnabledUsers.includes(user.id))
  const _links = isSwapEnabled ? links : links.filter((link) => link.href !== '/swap')

  return _links
}

const HomeSideBar = ({ ...props }: YStackProps) => {
  // this code can be removed then swaps are no longer behind whitelist
  const links = useActiveLinks()

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
  const hoverStyles = useHoverStyles()
  const avatarUrl = profile?.avatar_url
  // this code can be removed then swaps are no longer behind whitelist
  const links = useActiveLinks()

  return (
    <NavSheet navId="home">
      <XStack gap="$4" ai="center" bg={'$color1'} p={'$4'} borderRadius={'$6'} mb={'$4'}>
        <LinkableAvatar size="$7" br={'$4'} href={`/profile/${profile?.send_id}`}>
          <Avatar.Image src={avatarUrl ?? ''} />
          <Avatar.Fallback jc={'center'} ai={'center'} delayMs={200}>
            <IconAccount size="$4.5" color="$olive" />
          </Avatar.Fallback>
        </LinkableAvatar>
        <YStack flex={1} gap={'$2'}>
          <Paragraph size={'$7'}>{profile?.name ?? `#${profile?.send_id}`}</Paragraph>
          <Separator width="100%" borderColor="$decay" />
          <ReferralLink p={0} />
        </YStack>
      </XStack>
      <Nav display="flex" flex={2} height="100%">
        <ScrollView gap={'$4'} alignItems="stretch" height="100%">
          {links.map((link, idx) => {
            const first = idx === 0
            const last = idx === links.length - 1

            return (
              <YStack
                key={link.href}
                gap={'$4'}
                alignItems="stretch"
                justifyContent="center"
                p={'$2'}
                w={'100%'}
                bg={'$color1'}
                borderTopLeftRadius={first ? '$6' : 0}
                borderTopRightRadius={first ? '$6' : 0}
                borderBottomLeftRadius={last ? '$6' : 0}
                borderBottomRightRadius={last ? '$6' : 0}
                paddingTop={first ? '$2' : 0}
                paddingBottom={last ? '$2' : 0}
              >
                <YStack w={'100%'} p={'$4'} borderRadius={'$4'} hoverStyle={hoverStyles}>
                  <SideBarNavLink key={link.href} hoverStyle={{}} {...link} />
                </YStack>
              </YStack>
            )
          })}
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
