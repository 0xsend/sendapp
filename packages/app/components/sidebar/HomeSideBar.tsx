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
import { IconAccount, IconDeviceReset, IconHome, IconSendLogo } from 'app/components/icons'
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
      <XStack gap="$4" ai="center" bg={'$color1'} p={'$4'} borderRadius={'$6'} mb={'$4'}>
        <LinkableAvatar size="$7" br={'$4'} href={`/profile/${profile?.send_id}`}>
          <Avatar.Image src={avatarUrl ?? ''} />
          <Avatar.Fallback jc={'center'} delayMs={200}>
            <IconAccount size="$4.5" color="$olive" />
          </Avatar.Fallback>
        </LinkableAvatar>
        <YStack gap={'$2'}>
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
                <YStack
                  w={'100%'}
                  p={'$4'}
                  borderRadius={'$4'}
                  hoverStyle={{
                    backgroundColor: '$color2',
                  }}
                >
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
