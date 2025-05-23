import { IconArrowUp, IconDeviceReset, IconHome, IconWorldSearch } from 'app/components/icons'
import { Button, LinearGradient, LinkableButton, XStack, Card } from '@my/ui'
import { usePathname } from 'app/utils/usePathname'
import { useHoverStyles } from 'app/utils/useHoverStyles'
import { useScrollDirection } from 'app/provider/scroll'

const TABS = [
  {
    Icon: IconHome,
    href: '/',
  },
  {
    Icon: IconArrowUp,
    href: '/send',
  },
  {
    Icon: IconWorldSearch,
    href: '/explore',
  },
  {
    Icon: IconDeviceReset,
    href: '/activity',
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
        colors={['rgba(0,0,0,0)', '$color0', '$color0']}
        overflow={'visible'}
        ai={'center'}
      >
        <Card elevate fd="row" gap="$7" br={'$6'} ai={'center'} jc={'center'} py={'$3'} px="$7">
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
                backgroundColor={isActiveRoute ? hoverStyles.backgroundColor : 'transparent'}
                hoverStyle={{
                  backgroundColor: isActiveRoute ? hoverStyles.backgroundColor : 'transparent',
                }}
                pressStyle={{
                  backgroundColor: isActiveRoute ? hoverStyles.backgroundColor : 'transparent',
                  borderColor: 'transparent',
                }}
                focusStyle={{
                  backgroundColor: isActiveRoute ? hoverStyles.backgroundColor : 'transparent',
                }}
                p={'$2'}
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
        </Card>
      </LinearGradient>
    </XStack>
  )
}
