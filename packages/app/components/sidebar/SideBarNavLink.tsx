import { Link, type LinkProps } from '@my/ui'
import type { ReactElement } from 'react'
import { cloneElement, isValidElement } from 'react'
import { usePathname } from 'app/utils/usePathname'
import { useHoverStyles } from 'app/utils/useHoverStyles'
import type { IconProps } from '@tamagui/helpers-icon'

export function SideBarNavLink({
  icon,
  text,
  ...props
}: { icon?: ReactElement<IconProps>; text: string } & Omit<LinkProps, 'children'>): ReactElement {
  const location = usePathname()
  const parts = location.split('/').filter(Boolean)
  const isActiveRoute =
    location === props.href.toString() ||
    parts.includes(props.href.toString()) ||
    props.href.toString().startsWith(`/${parts[0]}`)
  const hoverStyles = useHoverStyles()

  const renderedIcon =
    icon && isValidElement(icon)
      ? cloneElement(icon, {
          color: isActiveRoute ? '$color12' : '$lightGrayTextField',
          '$theme-light': { color: isActiveRoute ? '$color12' : '$darkGrayTextField' },
        })
      : null

  return (
    <Link
      fontSize={'$7'}
      gap="$3.5"
      display="flex"
      alignItems="center"
      px={'$3.5'}
      py={'$4'}
      br={'$4'}
      bc={isActiveRoute ? hoverStyles.backgroundColor : 'transparent'}
      hoverStyle={hoverStyles}
      color={isActiveRoute ? '$color12' : '$lightGrayTextField'}
      $theme-light={{ color: isActiveRoute ? '$color12' : '$darkGrayTextField' }}
      {...props}
      href={props.disabled ? '' : props.href}
    >
      {renderedIcon}
      {text}
    </Link>
  )
}
