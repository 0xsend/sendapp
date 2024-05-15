import {
  Nav,
  Paragraph,
  ScrollView,
  Separator,
  SideBar,
  SideBarWrapper,
  XStack,
  YStack,
  type YStackProps,
  useMedia,
  Avatar,
  H4,
} from '@my/ui'
import { Link } from '@my/ui'
import { baseMainnet } from '@my/wagmi/chains'
import {
  IconAccount,
  // IconActivity,
  IconHome,
  // IconSLogo,
  IconSendLogo,
  IconX,
} from 'app/components/icons'
import { SideBarNavLink } from 'app/components/sidebar/SideBarNavLink'

import type { ReactElement } from 'react'
import { NavSheet } from '../NavSheet'

import { useUser } from 'app/utils/useUser'
import { ReferralLink } from '../ReferralLink'

const links = [
  {
    icon: <IconHome size={'$1.75'} />,
    text: 'Home',
    href: '/',
  },
  // {
  //   icon: <IconSLogo size={'$1'} />,
  //   text: 'Send',
  //   href: '/send',
  // },
  // {
  //   icon: <IconActivity size={'$1'} />,
  //   text: 'Activity',
  //   href: '/activity',
  // },
  {
    icon: <IconAccount size={'$1'} />,
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
    <SideBar {...props}>
      <Nav display="flex" w="100%" pl={'$7'}>
        <Link href={'/'} display="flex">
          <IconSendLogo size={'$2.5'} color={'$color12'} />
        </Link>
        <YStack gap={'$3.5'} pt={'$10'}>
          {links.map((link) => (
            <SideBarNavLink key={link.href} {...link} />
          ))}
        </YStack>
      </Nav>
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

  if (media.gtLg)
    return (
      <SideBarWrapper
        sidebar={<HomeSideBar bc="$color2" width={234} minWidth={234} pt={80} jc="flex-start" />}
      >
        {children}
      </SideBarWrapper>
    )
  return (
    <>
      <HomeBottomSheet />
      {children}
    </>
  )
}
