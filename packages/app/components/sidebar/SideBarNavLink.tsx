import { Button, ButtonIcon, ButtonText, Link, type LinkProps } from '@my/ui'
import { usePathname } from 'app/utils/usePathname'
import { type ReactElement } from 'react'
import { useThemeSetting } from '@tamagui/next-theme'

export function SideBarNavLink({
  icon,
  text,
  ...props
}: { icon?: ReactElement; text: string } & Omit<LinkProps, 'children'>): ReactElement {
  const location = usePathname()
  const isActiveRoute =
    props.href === '/'
      ? location === props.href.toString()
      : location.includes(props.href.toString())

  const { resolvedTheme } = useThemeSetting()
  const iconActiveColor = resolvedTheme?.startsWith('dark') ? '$primary' : '$color12'
  const iconInActiveColor = resolvedTheme?.startsWith('dark') ? '$color' : '$color12'

  return (
    <Link {...props} href={props.disabled ? '' : props.href}>
      <Button
        width={'100%'}
        disabled={props.disabled}
        bg={'transparent'}
        hoverStyle={{ scale: '105%', opacity: 1, backgroundColor: 'transparent', borderWidth: 0 }}
        focusStyle={{
          backgroundColor: 'transparent',
          outlineWidth: 0,
        }}
        pressStyle={{
          backgroundColor: 'transparent',
          outlineWidth: 0,
        }}
        color={isActiveRoute ? iconActiveColor : iconInActiveColor}
        opacity={isActiveRoute ? 1 : 0.63}
        gap={'$1.5'}
      >
        <ButtonIcon>{icon}</ButtonIcon>
        <ButtonText f={1} fontFamily="$mono" fontWeight={isActiveRoute ? 'bold' : '300'}>
          {text}
        </ButtonText>
      </Button>
    </Link>
  )
}
