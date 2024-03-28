import {
  Sheet,
  Button,
  Nav,
  Paragraph,
  ScrollView,
  Separator,
  type SheetProps,
  SideBar,
  SideBarWrapper,
  XStack,
  YStack,
  type YStackProps,
  useMedia,
  isWeb,
} from '@my/ui'
import { Link } from '@my/ui'
import { baseMainnet } from '@my/wagmi/chains'
import {
  IconAccount,
  IconActivity,
  IconHome,
  IconSLogo,
  IconSendLogo,
  IconX,
} from 'app/components/icons'
import { SideBarNavLink } from 'app/components/sidebar/SideBarNavLink'

import { useNav } from 'app/routers/params'
import type { ReactElement } from 'react'
import { NavSheet } from '../NavSheet'

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

const HomeBottomSheet = ({ open }: SheetProps) => {
  const [nav, setNavParam] = useNav()

  const onOpenChange = () => {
    if (open) setNavParam('home', { webBehavior: 'replace' })
    else setNavParam(undefined, { webBehavior: 'replace' })
  }

  return (
    <NavSheet open={nav === 'home'} onOpenChange={onOpenChange}>
      <Link href={'/'} marginTop={'$4'}>
        <IconSendLogo size={'$2.5'} color={'$color12'} />
      </Link>
      <Nav display="flex" flex={2} height="100%" justifyContent={'center'}>
        <ScrollView gap={'$4'} alignItems="stretch" jc="center" ml="$-5" height="100%">
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

      <XStack pos={'absolute'} top={'$7'} right={'$6'}>
        <Button
          size="$4"
          transparent
          chromeless
          backgroundColor="transparent"
          hoverStyle={{ backgroundColor: 'transparent' }}
          pressStyle={{ backgroundColor: 'transparent' }}
          focusStyle={{ backgroundColor: 'transparent' }}
          circular
          icon={<IconX size="$2" color="$color9" />}
          onPress={onOpenChange}
          theme="accent"
        />
      </XStack>
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
