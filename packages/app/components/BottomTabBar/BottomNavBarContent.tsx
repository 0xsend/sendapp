import { Button, Card, LinearGradient, LinkableButton, useTheme } from '@my/ui'
import { useHoverStyles } from 'app/utils/useHoverStyles'
import type { NamedExoticComponent } from 'react'
import type { IconProps } from '@tamagui/helpers-icon'
import { Platform } from 'react-native'

type Tab = {
  Icon: NamedExoticComponent<IconProps>
  key: string
  href: string
}

export const BottomNavBarContent = ({
  tabs,
  currentRoute,
}: {
  tabs: Tab[]
  currentRoute: string
}) => {
  const theme = useTheme()
  const hoverStyles = useHoverStyles()

  return (
    <LinearGradient
      start={[0, 0]}
      end={[0, 1]}
      colors={[`${theme.background.val}00`, '$background']}
      display={'flex'}
      flex={1}
      ai={'center'}
      jc={'center'}
      overflow={'visible'}
    >
      <Card
        elevation={Platform.OS === 'android' ? undefined : 5}
        fd="row"
        gap="$7"
        br={'$6'}
        ai={'center'}
        jc={'center'}
        py={'$3'}
        px="$7"
      >
        {tabs.map((tab) => {
          const isActiveRoute = currentRoute === tab.key

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
                  color={isActiveRoute ? '$color12' : '$silverChalice'}
                  $theme-light={{ color: isActiveRoute ? '$color12' : '$darkGrayTextField' }}
                />
              </Button.Icon>
            </LinkableButton>
          )
        })}
      </Card>
    </LinearGradient>
  )
}
