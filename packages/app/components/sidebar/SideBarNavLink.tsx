import { Link, Theme, type LinkProps } from '@my/ui'
import { usePathname } from 'app/utils/usePathname'
import type { ReactElement } from 'react'

export function SideBarNavLink({
  icon,
  text,
  ...props
}: { icon?: ReactElement; text: string } & Omit<LinkProps, 'children'>): ReactElement {
  const location = usePathname()
  const parts = location.split('/').filter(Boolean)
  const isActiveRoute =
    location === props.href.toString() ||
    parts.includes(props.href.toString()) ||
    props.href.toString().startsWith(`/${parts[0]}`)

  return (
    <Theme name={isActiveRoute ? 'green' : null}>
      <Link
        {...props}
        href={props.disabled ? '' : props.href}
        $theme-dark={{ color: isActiveRoute ? '$color9' : '$color10' }}
        $theme-light={{ color: isActiveRoute ? '$color12' : '$color10' }}
        hoverStyle={{
          position: 'relative',
          left: '2%',
          scale: '105%',
          color: '$color12',
        }}
        fontSize={'$7'}
        f={1}
        fontWeight={isActiveRoute ? '400' : '300'}
        gap="$3"
        display="flex"
        alignItems="center"
      >
        {icon}
        {text}
      </Link>
    </Theme>
  )
}
