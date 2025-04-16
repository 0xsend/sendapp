import { XStack } from 'tamagui'
import {
  IconArrowUp,
  IconChart,
  IconDeviceReset,
  IconHome,
  IconWorldSearch,
} from 'app/components/icons'
import { Button, LinearGradient, LinkableButton } from '@my/ui'
import { usePathname } from 'app/utils/usePathname'
import { useHoverStyles } from 'app/utils/useHoverStyles'
import { useScrollDirection } from 'app/provider/scroll'

const TABS = [
  {
    Icon: IconHome,
    href: '/',
  },
  {
    Icon: IconDeviceReset,
    href: '/activity',
  },
  {
    Icon: IconArrowUp,
    href: '/send',
  },
  {
    Icon: IconChart,
    href: '/invest',
  },
  {
    Icon: IconWorldSearch,
    href: '/explore',
  },
]

export const BOTTOM_NAV_BAR_HEIGHT = 120

export const BottomNavBar = () => {
  const location = usePathname()
  const parts = location.split('/').filter(Boolean)
  const hoverStyles = useHoverStyles()
  const { direction } = useScrollDirection()

  return (
    <XStack
      $platform-web={{
        position: 'fixed',
      }}
      bottom={direction === 'down' ? -BOTTOM_NAV_BAR_HEIGHT : 0}
      left={0}
      right={0}
      zIndex={100}
      height={BOTTOM_NAV_BAR_HEIGHT}
      animation="200ms"
      animateOnly={['bottom']}
      $gtLg={{ display: 'none' }}
    >
      <LinearGradient
        start={[0, 0]}
        end={[0, 1]}
        p={'$3.5'}
        fullscreen
        colors={['transparent', '$color0', '$color0']}
        overflow={'visible'}
        ai={'center'}
      >
        <XStack
          bc={'$color1'}
          w={'100%'}
          h={'100%'}
          br={'$6'}
          ai={'center'}
          jc={'space-between'}
          p={'$4'}
          shadowColor={'#000000'}
          shadowOffset={{ width: 0, height: -5 }}
          shadowOpacity={0.3}
          shadowRadius={60}
          $gtSm={{ jc: 'space-around', maxWidth: 736 }}
          $gtMd={{ maxWidth: 896 }}
        >
          {TABS.map((tab) => {
            const isActiveRoute =
              location === tab.href.toString() ||
              parts.includes(tab.href.toString()) ||
              tab.href.toString().startsWith(`/${parts[0]}`)

            return (
              <LinkableButton
                key={tab.href}
                href={tab.href}
                chromeless
                backgroundColor={isActiveRoute ? hoverStyles.background : 'transparent'}
                hoverStyle={{
                  backgroundColor: isActiveRoute ? hoverStyles.background : 'transparent',
                }}
                pressStyle={{
                  backgroundColor: isActiveRoute ? hoverStyles.background : 'transparent',
                  borderColor: 'transparent',
                }}
                focusStyle={{
                  backgroundColor: isActiveRoute ? hoverStyles.background : 'transparent',
                }}
                p={'$3'}
                br={'$3'}
                height={'auto'}
              >
                <Button.Icon>
                  <tab.Icon
                    size={'$1.5'}
                    color={isActiveRoute ? '$primary' : '$silverChalice'}
                    $theme-light={{ color: isActiveRoute ? '$color12' : '$darkGrayTextField' }}
                  />
                </Button.Icon>
              </LinkableButton>
            )
          })}
        </XStack>
      </LinearGradient>
    </XStack>
  )
}
