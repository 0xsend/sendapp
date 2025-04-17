import {
  Avatar,
  Link,
  LinkableAvatar,
  LinkableButton,
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
  IconArrowUp,
  IconChart,
  IconDeviceReset,
  IconHome,
  IconSendLogo,
  IconWorldSearch,
} from 'app/components/icons'
import { SideBarNavLink } from 'app/components/sidebar/SideBarNavLink'

import type { ReactElement } from 'react'
import { NavSheet } from '../NavSheet'

import { useUser } from 'app/utils/useUser'
import { ReferralLink } from '../ReferralLink'
import { useHoverStyles } from 'app/utils/useHoverStyles'

const links = [
  {
    icon: <IconHome size={'$1'} color={'inherit'} scale={'1.2'} />,
    text: 'Home',
    href: '/',
  },
  {
    icon: <IconDeviceReset size={'$1'} color={'inherit'} scale={'1.2'} />,
    text: 'Activity',
    href: '/activity',
  },
  {
    icon: <IconArrowUp size={'$1'} color={'inherit'} scale={'1.3'} />,
    text: 'Send',
    href: '/send',
  },
  {
    icon: <IconChart size={'$1'} color={'inherit'} />,
    text: 'Invest',
    href: '/invest',
  },
  {
    icon: <IconWorldSearch size={'$1'} color={'inherit'} />,
    text: 'Explore',
    href: '/explore',
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
    <SideBar {...props} ai={'flex-start'} px="$7">
      <Link href={'/'}>
        <IconSendLogo color={'$color12'} size={'$2.5'} />
      </Link>

      <YStack gap={'$7'} pt={'$10'} jc={'space-between'}>
        {links.map((link) => (
          <SideBarNavLink key={link.href} {...link} />
        ))}
      </YStack>
      <DesktopAccountMenuEntry />
    </SideBar>
  )
}

const DesktopAccountMenuEntry = () => {
  const { profile, tags } = useUser()
  const hoverStyles = useHoverStyles()
  const tagToShow = tags?.filter((tag) => tag.status === 'confirmed')[0]

  return (
    <LinkableButton
      href={'/account'}
      width={'100%'}
      jc={'flex-start'}
      px={'$4'}
      py={'$2.5'}
      h={'auto'}
      br={'$6'}
      bc={'$color0'}
      backgroundColor={'$color0'}
      hoverStyle={{ ...hoverStyles, borderColor: 'transparent' }}
      pressStyle={{
        backgroundColor: '$color0',
        borderColor: 'transparent',
      }}
      focusStyle={{
        backgroundColor: '$color0',
      }}
    >
      <Avatar circular={true} size={'$4.5'}>
        <Avatar.Image src={profile?.avatar_url ?? ''} w="100%" h="100%" objectFit="cover" />
        <Avatar.Fallback jc={'center'} ai="center" theme="green_active" bc="$color2">
          <IconAccount size={'$2'} $theme-light={{ color: '$color12' }} />
        </Avatar.Fallback>
      </Avatar>
      <YStack jc={'center'} f={1}>
        <Paragraph size={'$7'} numberOfLines={1} f={1} textOverflow={'ellipsis'}>
          {profile?.name ?? `#${profile?.send_id}`}
        </Paragraph>
        {tagToShow && (
          <Paragraph
            bc={'$color1'}
            size={'$2'}
            width={'max-content'}
            maxWidth={'100%'}
            numberOfLines={1}
            px={'$2'}
            py={'$1.5'}
            textOverflow={'ellipsis'}
            br={'$2'}
          >
            {`/${tagToShow.name}`}
          </Paragraph>
        )}
      </YStack>
    </LinkableButton>
  )
}

const HomeBottomSheet = () => {
  const { profile } = useUser()
  const hoverStyles = useHoverStyles()
  const avatarUrl = profile?.avatar_url

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
      {media.gtLg && <HomeSideBar width={291} minWidth={291} py={80} jc={'space-between'} />}
      {children}
      {!media.gtLg && <HomeBottomSheet />}
    </XStack>
  )
}
