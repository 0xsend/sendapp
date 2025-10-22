import { SizableText, View, type LinkProps } from '@my/ui'
// import { Link as SolitoLink } from 'solito/link'
import Link from 'next/link'
import type { ReactElement } from 'react'
import { cloneElement, isValidElement, useEffect } from 'react'
import { usePathname } from 'app/utils/usePathname'
import { useRouter } from 'next/navigation'

import { useHoverStyles } from 'app/utils/useHoverStyles'
import type { IconProps } from '@tamagui/helpers-icon'
import { Platform } from 'react-native'

export function SideBarNavLink({
  icon,
  text,
  href,
  ...props
}: { icon?: ReactElement<IconProps>; text: string } & Omit<LinkProps, 'children'>): ReactElement {
  const location = usePathname()
  const parts = location.split('/').filter(Boolean)
  const isActiveRoute =
    location === href.toString() ||
    parts.includes(href.toString()) ||
    href.toString().startsWith(`/${parts[0]}`)
  const hoverStyles = useHoverStyles()

  const renderedIcon =
    icon && isValidElement(icon)
      ? cloneElement(icon, {
          color: isActiveRoute ? '$color12' : '$lightGrayTextField',
          '$theme-light': { color: isActiveRoute ? '$color12' : '$darkGrayTextField' },
        })
      : null

  if (Platform.OS === 'web') {
    const router = useRouter()
    useEffect(() => {
      if (href) {
        router.prefetch(href.toString())
      }
    }, [href, router])
  }

  return (
    <Link href={href} prefetch>
      <SizableText
        fd="row"
        fontSize={'$7'}
        testID={`sidebar-nav-${text.toLowerCase()}`}
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
      >
        {renderedIcon}
        {text}
      </SizableText>
    </Link>
  )
}
