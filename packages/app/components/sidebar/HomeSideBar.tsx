import {
  BottomSheet,
  Nav,
  SheetProps,
  SideBar,
  SideBarWrapper,
  YStack,
  YStackProps,
  useMedia,
} from '@my/ui'
import { Link } from '@my/ui'
import { IconAccount, IconActivity, IconHome, IconSLogo, IconSendLogo } from 'app/components/icons'
import { SideBarNavLink } from 'app/components/sidebar/SideBarNavLink'

import { useNav } from 'app/routers/params'

const HomeSideBar = ({ ...props }: YStackProps) => {
  return (
    <SideBar {...props}>
      <Link href={'/'}>
        <IconSendLogo size={'$2.5'} color={'$color12'} />
      </Link>
      <Nav display="flex" flex={1} pt={'$10'}>
        <YStack gap={'$4'} alignItems="stretch" w={'100%'} f={1}>
          <SideBarNavLink icon={<IconHome size={'$1.75'} />} text={'Home'} href={'/'} />
          <SideBarNavLink icon={<IconSLogo size={'$1'} />} text={'Send'} href={'/send'} />
          <SideBarNavLink
            icon={<IconActivity size={'$1'} />}
            text={'Activity'}
            href={'/activity'}
          />
          <SideBarNavLink icon={<IconAccount size={'$1'} />} text={'Account'} href={'/account'} />
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
    <BottomSheet open={nav === 'home'} onOpenChange={onOpenChange}>
      <Link href={'/'} marginTop={'$4'}>
        <IconSendLogo size={'$2.5'} color={'$color12'} />
      </Link>
      <Nav display="flex" flex={2} justifyContent={'center'} alignItems="center">
        <YStack gap={'$4'} alignItems="stretch" justifyContent="center">
          <SideBarNavLink icon={<IconHome size={'$1.75'} />} text={'Home'} href={'/'} />
          <SideBarNavLink icon={<IconSLogo size={'$1'} />} text={'Send'} href={'/send'} />
          <SideBarNavLink
            icon={<IconActivity size={'$1'} />}
            text={'Activity'}
            href={'/activity'}
          />
          <SideBarNavLink icon={<IconAccount size={'$1'} />} text={'Account'} href={'/account'} />
        </YStack>
      </Nav>
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
            $theme-light={{ backgroundColor: '#f5f5f5' }}
            width={208}
            minWidth={208}
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
