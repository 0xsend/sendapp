import {
  BottomSheet,
  Button,
  ButtonIcon,
  Nav,
  SheetProps,
  SideBar,
  SideBarWrapper,
  XStack,
  YStack,
  YStackProps,
  useMedia,
} from '@my/ui'
import { Link } from '@my/ui'
import {
  IconActivity,
  IconDashboard,
  IconDistributions,
  IconGear,
  IconSLogo,
  IconSendLogo,
  IconTelegramLogo,
  IconXLogo,
} from 'app/components/icons'
import { SideBarFooterLink } from 'app/components/sidebar/SideBarFooterLink'
import { SideBarNavLink } from 'app/components/sidebar/SideBarNavLink'
import { telegram as telegramSocial, twitter as twitterSocial } from 'app/data/socialLinks'

import { useNav } from 'app/routers/params'

const HomeSideBar = ({ ...props }: YStackProps) => {
  return (
    <SideBar
      {...props}
      alignItems={'flex-start'}
      h={'100%'}
      m={0}
      pl={'$7'}
      width={208}
      minWidth={208}
    >
      <Link href={'/'} marginTop={'$10'}>
        <IconSendLogo size={'$2.5'} color={'$color12'} />
      </Link>
      <Nav display="flex" flex={1} pt={'$12'}>
        <YStack gap={'$4'} alignItems="stretch" w={'100%'} f={1}>
          <SideBarNavLink icon={<IconDashboard size={'$1'} />} text={'home'} href={'/'} />
          <SideBarNavLink
            icon={<IconActivity size={'$1'} />}
            text={'activity'}
            href={'/activity'}
          />
          <SideBarNavLink
            icon={<IconDistributions size={'$1'} />}
            text={'distributions'}
            href={'/distributions'}
          />
          <SideBarNavLink icon={<IconGear size={'$1'} />} text={'settings'} href={'/settings'} />
          <SideBarNavLink
            icon={<IconSLogo size={'$1'} />}
            text={'leaderboard'}
            href={'/leaderboard'}
            hoverStyle={{ cursor: 'not-allowed' }}
          />
        </YStack>
      </Nav>
      {/* <YStack gap="$4" alignItems="center">
        <IconSendLogo size={'$4'} />
        <XStack gap="$2">
          <SideBarFooterLink
            icon={<IconXLogo />}
            href={twitterSocial}
            target="_blank"
            borderRadius={9999}
          />
          <SideBarFooterLink
            icon={<IconTelegramLogo />}
            href={telegramSocial}
            target="_blank"
            borderRadius={9999}
          />
        </XStack>
      </YStack> */}
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
    <BottomSheet open={nav === 'home'} onOpenChange={onOpenChange}>
      <Link href={'/'} marginTop={'$4'}>
        <IconSendLogo size={'$2.5'} color={'$color12'} />
      </Link>
      <Nav display="flex" flex={2} justifyContent={'center'} alignItems="center">
        <YStack gap={'$4'} alignItems="stretch" justifyContent="center">
          <SideBarNavLink icon={<IconDashboard size={'$1'} />} text={'home'} href={'/'} />
          <SideBarNavLink
            icon={<IconActivity size={'$1'} />}
            text={'activity'}
            href={'/activity'}
          />
          <SideBarNavLink
            icon={<IconDistributions size={'$1'} />}
            text={'distributions'}
            href={'/distributions'}
          />
          <SideBarNavLink
            icon={<IconDistributions size={'$1'} />}
            text={'settings'}
            href={'/settings'}
          />
          <SideBarNavLink
            icon={<IconSLogo size={'$1'} />}
            text={'leaderboard'}
            href={'/leaderboard'}
            disabled={true}
            hoverStyle={{ cursor: 'not-allowed' }}
          />
        </YStack>
      </Nav>
      {/* <YStack gap="$4" py="$4" alignItems="center">
        <IconSendLogo size={'$4'} />
        <XStack gap="$2">
          <SideBarFooterLink
            icon={<IconXLogo />}
            href={twitterSocial}
            target="_blank"
            borderRadius={9999}
          />
          <SideBarFooterLink
            icon={<IconTelegramLogo />}
            href={telegramSocial}
            target="_blank"
            borderRadius={9999}
          />
        </XStack>
      </YStack> */}
    </BottomSheet>
  )
}

export const HomeSideBarWrapper = ({ children }: { children?: React.ReactNode }) => {
  const media = useMedia()

  if (media.gtMd)
    return (
      <SideBarWrapper
        sidebar={
          <HomeSideBar
            $theme-dark={{ backgroundColor: '#081619' }}
            borderTopLeftRadius={0}
            borderBottomLeftRadius={0}
            borderTopRightRadius={'$7'}
            borderBottomRightRadius={'$7'}
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
