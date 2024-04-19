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
import { IconAccount, IconActivity, IconHome, IconSLogo, IconSendLogo } from 'app/components/icons'
import { SideBarNavLink } from 'app/components/sidebar/SideBarNavLink'

import type { ReactElement } from 'react'
import { NavSheet } from '../NavSheet'

import { useUser } from 'app/utils/useUser'
import { ReferralLink } from '../ReferralLink'

const links = [
  {
    icon: <IconHome size={'$1.75'} />,
    text: 'home',
    href: '/',
  },
  {
    icon: <IconSLogo size={'$1'} />,
    text: 'send',
    href: '/send',
  },
  {
    icon: <IconActivity size={'$1'} />,
    text: 'activity',
    href: '/activity',
  },
  {
    icon: <IconAccount size={'$1'} />,
    text: 'account',
    href: '/account',
  },
  __DEV__ || baseMainnet.id === 84532
    ? {
        icon: <Paragraph px="$1">🔒</Paragraph>,
        text: 'secret shop',
        href: '/secret-shop',
      }
    : undefined,
].filter(Boolean) as { icon: ReactElement; text: string; href: string }[]

const HomeSideBar = ({ ...props }: YStackProps) => {
  return (
    <SideBar {...props}>
      <Nav display="flex" flex={1}>
        <Link href={'/'} display="flex" pl={'$4.5'}>
          <IconSendLogo size={'$2.5'} color={'$color12'} />
        </Link>
        <YStack gap={'$4'} pt={'$10'} alignItems="stretch" w={'100%'} f={1}>
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
        <Avatar size="$4.5">
          <Avatar.Image src={avatarUrl ?? ''} />
          <Avatar.Fallback jc={'center'} delayMs={200}>
            <IconAccount size="$4.5" color="$olive" />
          </Avatar.Fallback>
        </Avatar>
        <YStack gap="$2">
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
        sidebar={
          <HomeSideBar
            $theme-dark={{ backgroundColor: '$charcoal' }}
            $theme-light={{ backgroundColor: '$gray3Light' }}
            width={208}
            minWidth={208}
            btlr={0}
            bblr={0}
            pt={80}
            jc="flex-start"
          />
        }
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
