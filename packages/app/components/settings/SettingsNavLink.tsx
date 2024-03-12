import { Button, ButtonIcon, ButtonText, Link, type LinkProps } from '@my/ui'
import { usePathname } from 'app/utils/usePathname'
import { type ReactElement } from 'react'
import { useThemeSetting } from '@tamagui/next-theme'

export function SettingsNavLink({
  text,
  ...props
}: { text: string } & Omit<LinkProps, 'children'>): ReactElement {
  const location = usePathname()
  const isActiveRoute =
    props.href === '/account'
      ? location === props.href.toString()
      : location.includes(props.href.toString())

  const { resolvedTheme } = useThemeSetting()
  const iconActiveColor = resolvedTheme?.startsWith('dark') ? '$primary' : '$color12'
  const iconInActiveColor = resolvedTheme?.startsWith('dark') ? '$color' : '$color12'

  return (
    <Link
      {...props}
      href={props.disabled ? '' : props.href}
      hoverStyle={{ scale: '105%', opacity: 1, backgroundColor: 'transparent', borderWidth: 0 }}
      opacity={isActiveRoute ? 1 : 0.63}
      disabled={props.disabled}
    >
      <ButtonText
        f={1}
        fontFamily="$mono"
        fontWeight={isActiveRoute ? 'bold' : '300'}
        color={isActiveRoute ? iconActiveColor : iconInActiveColor}
      >
        {text}
      </ButtonText>
    </Link>
  )
}
