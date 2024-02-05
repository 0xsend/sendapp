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
    <SideBar {...props}>
      <Link href={'/'} marginTop={'$10'}>
        <Button borderRadius={9999} w={'$11'} h={'$11'} bg={'transparent'}>
          {/* TODO: Implement Radial Gradient UI Element. Curently not in TamaGUI */}
          <ButtonIcon>
            <IconSLogo size={'$10'} />
          </ButtonIcon>
        </Button>
      </Link>
      <Nav display="flex" flex={2} justifyContent={'center'} alignItems="center">
        <YStack gap={'$4'} alignItems="stretch" justifyContent="center" w={'100%'} f={1}>
          <SideBarNavLink icon={<IconDashboard size={'$2'} />} text={'Dashboard'} href={'/'} />
          <SideBarNavLink
            icon={<IconActivity size={'$2'} />}
            text={'Activity'}
            href={'/activity'}
          />
          <SideBarNavLink
            icon={<IconDistributions size={'$2'} />}
            text={'Distributions'}
            href={'/distributions'}
          />
          <SideBarNavLink icon={<IconGear size={'$2'} />} text={'Settings'} href={'/settings'} />
          <SideBarNavLink
            icon={<IconSLogo size={'$2'} />}
            text={'Leaderboard'}
            href={'/leaderboard'}
            hoverStyle={{ cursor: 'not-allowed' }}
          />
        </YStack>
      </Nav>
      <YStack gap="$4" alignItems="center">
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
      </YStack>
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
        <Button borderRadius={9999} w={'$11'} h={'$11'} bg={'transparent'}>
          {/* TODO: Implement Radial Gradient UI Element. Curently not in TamaGUI */}
          <ButtonIcon>
            <IconSLogo size={'$10'} />
          </ButtonIcon>
        </Button>
      </Link>
      <Nav display="flex" flex={2} justifyContent={'center'} alignItems="center">
        <YStack gap={'$4'} alignItems="stretch" justifyContent="center">
          <SideBarNavLink icon={<IconDashboard size={'$2'} />} text={'Dashboard'} href={'/'} />
          <SideBarNavLink
            icon={<IconActivity size={'$2'} />}
            text={'Activity'}
            href={'/activity'}
          />
          <SideBarNavLink
            icon={<IconDistributions size={'$2'} />}
            text={'Distributions'}
            href={'/distributions'}
          />
          <SideBarNavLink
            icon={<IconDistributions size={'$2'} />}
            text={'Settings'}
            href={'/settings'}
          />
          <SideBarNavLink
            icon={<IconSLogo size={'$2'} />}
            text={'Leaderboard'}
            href={'/leaderboard'}
            disabled={true}
            hoverStyle={{ cursor: 'not-allowed' }}
          />
        </YStack>
      </Nav>
      <YStack gap="$4" py="$4" alignItems="center">
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
      </YStack>
    </BottomSheet>
  )
}

export const HomeSideBarWrapper = ({ children }: { children?: React.ReactNode }) => {
  const media = useMedia()

  if (media.gtLg) return <SideBarWrapper sidebar={<HomeSideBar />}>{children}</SideBarWrapper>
  return (
    <>
      <HomeBottomSheet />
      {children}
    </>
  )
}
