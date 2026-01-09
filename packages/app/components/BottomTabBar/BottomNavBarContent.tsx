import { Button, Card, LinearGradient, LinkableButton, useTheme } from '@my/ui'
import { useHoverStyles } from 'app/utils/useHoverStyles'
import { useMemo, type NamedExoticComponent } from 'react'
import type { IconProps } from '@tamagui/helpers-icon'
import { useIsActiveRoute } from './contexts'

type Tab = {
  Icon: NamedExoticComponent<IconProps>
  key: string
  href: string
  label?: string
}

export const BottomNavBarContent = ({
  tabs,
}: {
  tabs: Tab[]
}) => {
  const theme = useTheme()
  const hoverStyles = useHoverStyles()

  return (
    <LinearGradient
      start={[0, 0]}
      end={[0, 1]}
      colors={[`${theme.background.val}00`, '$background']}
      display="flex"
      flex={1}
      ai="center"
      jc="center"
      px="$3"
      overflow="visible"
    >
      <Card
        fs={1}
        elevation={5}
        fd="row"
        gap="$7"
        br="$6"
        ai="center"
        jc="center"
        py="$3"
        px="$7"
        maw="100%"
        $xxs={{
          gap: '$5',
        }}
        $platform-ios={{
          elevation: 5,
          shadowOpacity: 0.1,
        }}
      >
        {tabs.map((tab) => {
          return <EachButton key={tab.href} tab={tab} hoverStyles={hoverStyles} />
        })}
      </Card>
    </LinearGradient>
  )
}

const EachButton = ({
  tab,
  hoverStyles,
}: { tab: Tab; hoverStyles: ReturnType<typeof useHoverStyles> }) => {
  const isActiveRoute = useIsActiveRoute(tab.key)
  const LinkableButtonInteractionProps = useMemo(() => {
    return {
      hoverStyle: {
        backgroundColor: isActiveRoute ? hoverStyles.backgroundColor : 'transparent',
      },
      pressStyle: {
        backgroundColor: isActiveRoute ? hoverStyles.backgroundColor : 'transparent',
        borderColor: 'transparent',
      },
      focusStyle: {
        backgroundColor: isActiveRoute ? hoverStyles.backgroundColor : 'transparent',
      },
    } as const
  }, [isActiveRoute, hoverStyles])

  return (
    <LinkableButton
      prefetch
      key={tab.href}
      href={tab.href}
      chromeless
      backgroundColor={isActiveRoute ? hoverStyles.backgroundColor : 'transparent'}
      {...LinkableButtonInteractionProps}
      p={'$2'}
      br={'$3'}
      height={'auto'}
      aria-label={tab.label}
      accessibilityLabel={tab.label}
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
}
