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
  useThemeName,
  XStack,
  YStack,
  type YStackProps,
} from '@my/ui'
import { baseMainnet } from '@my/wagmi/chains'
import {
  IconAccount,
  IconArrowUp,
  IconBadgeCheckSolid2,
  IconChart,
  IconClock,
  IconCompass,
  IconHome,
  IconSendLogo,
} from 'app/components/icons'
import { Lock } from '@tamagui/lucide-icons'
import { SideBarNavLink } from 'app/components/sidebar/SideBarNavLink'

import type { ReactElement } from 'react'
import { NavSheet } from '../NavSheet'

import { useHoverStyles } from 'app/utils/useHoverStyles'
import { useUser } from 'app/utils/useUser'
import { ReferralLink } from '../ReferralLink'
import { usePathname } from 'app/utils/usePathname'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

type NavigationLink = { icon: ReactElement; text: string; href: string }

const buildNavigationLinks = (t: (key: string) => string): NavigationLink[] =>
  [
    {
      icon: <IconHome size={'$1'} scale={1.2} />,
      text: t('tabs.home'),
      href: '/',
    },
    {
      icon: <IconClock size={'$1'} scale={1.2} />,
      text: t('tabs.activity'),
      href: '/activity',
    },
    {
      icon: <IconArrowUp size={'$1'} scale={1.3} />,
      text: t('tabs.send'),
      href: '/send',
    },
    {
      icon: <IconChart size={'$1'} scale={1.3} />,
      text: t('tabs.trade'),
      href: '/trade',
    },
    {
      icon: <IconCompass size={'$1'} scale={1.2} />,
      text: t('tabs.explore'),
      href: '/explore',
    },
    __DEV__ || baseMainnet.id === 84532
      ? {
          icon: <Lock size="$1" />,
          text: t('sidebar.secretShop'),
          href: '/secret-shop',
        }
      : undefined,
  ].filter(Boolean) as NavigationLink[]

function HomeSideBar({ ...props }: YStackProps) {
  const { t } = useTranslation('navigation')
  const links = useMemo(() => buildNavigationLinks(t), [t])

  return (
    <SideBar {...props} ai={'flex-start'} px="$7">
      <YStack width={'100%'}>
        <Link href={'/'}>
          <IconSendLogo color={'$color12'} size={'$2.5'} />
        </Link>
        <YStack gap={'$2.5'} pt={'$12'} width={'100%'}>
          {links.map((link) => (
            <SideBarNavLink key={link.href} {...link} />
          ))}
        </YStack>
      </YStack>
      <DesktopAccountMenuEntry />
    </SideBar>
  )
}

HomeSideBar.displayName = 'HomeSideBar'

const DesktopAccountMenuEntry = () => {
  const { profile } = useUser()
  const hoverStyles = useHoverStyles()
  const location = usePathname()
  const parts = location.split('/').filter(Boolean)
  const isActiveRoute =
    location === 'account' || parts.includes('account') || 'account'.startsWith(`/${parts[0]}`)
  const { t } = useTranslation('navigation')
  const theme = useThemeName()
  const isDark = theme.includes('dark')
  const isVerified = Boolean(profile?.verified_at)

  return (
    <LinkableButton
      href={'/account'}
      width={'100%'}
      jc={'flex-start'}
      px={'$3.5'}
      py={'$2.5'}
      h={'auto'}
      br={'$4'}
      bw={0}
      backgroundColor={isActiveRoute ? hoverStyles.backgroundColor : 'transparent'}
      hoverStyle={hoverStyles}
      pressStyle={hoverStyles}
      focusStyle={hoverStyles}
    >
      <XStack position="relative">
        <Avatar circular={true} size={'$3.5'}>
          <Avatar.Image src={profile?.avatar_url ?? ''} w="100%" h="100%" objectFit="cover" />
          <Avatar.Fallback jc={'center'} ai="center" theme="green_active" bc="$color2">
            <IconAccount size={'$2'} $theme-light={{ color: '$color12' }} />
          </Avatar.Fallback>
        </Avatar>
        {isVerified && (
          <XStack zi={100} pos="absolute" bottom={-2} right={-2}>
            <XStack pos="absolute" elevation={'$1'} scale={0.5} br={1000} inset={0} />
            <IconBadgeCheckSolid2
              size="$1"
              scale={0.65}
              color="$neon8"
              $theme-dark={{ color: '$neon7' }}
              // @ts-expect-error - checkColor is not typed
              checkColor={isDark ? '#082B1B' : '#fff'}
            />
          </XStack>
        )}
      </XStack>
      <Paragraph
        size={'$6'}
        color={isActiveRoute ? '$color12' : '$lightGrayTextField'}
        $theme-light={{ color: isActiveRoute ? '$color12' : '$darkGrayTextField' }}
      >
        {t('sidebar.account')}
      </Paragraph>
    </LinkableButton>
  )
}

const HomeBottomSheet = () => {
  const { profile } = useUser()
  const hoverStyles = useHoverStyles()
  const avatarUrl = profile?.avatar_url
  const { t } = useTranslation('navigation')
  const links = useMemo(() => buildNavigationLinks(t), [t])
  const theme = useThemeName()
  const isDark = theme.includes('dark')
  const isVerified = Boolean(profile?.verified_at)

  return (
    <NavSheet navId="home">
      <XStack gap="$4" ai="center" bg={'$color1'} p={'$4'} borderRadius={'$6'} mb={'$4'}>
        <XStack position="relative">
          <LinkableAvatar size="$7" br={'$4'} href={`/profile/${profile?.send_id}`}>
            <Avatar.Image src={avatarUrl ?? ''} />
            <Avatar.Fallback jc={'center'} ai={'center'} delayMs={200}>
              <IconAccount size="$4.5" color="$olive" />
            </Avatar.Fallback>
          </LinkableAvatar>
          {isVerified && (
            <XStack zi={100} pos="absolute" bottom={0} right={0} x="$0.5" y="$0.5">
              <XStack pos="absolute" elevation={'$1'} scale={0.5} br={1000} inset={0} />
              <IconBadgeCheckSolid2
                size="$1"
                scale={0.8}
                color="$neon8"
                $theme-dark={{ color: '$neon7' }}
                // @ts-expect-error - checkColor is not typed
                checkColor={isDark ? '#082B1B' : '#fff'}
              />
            </XStack>
          )}
        </XStack>
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
