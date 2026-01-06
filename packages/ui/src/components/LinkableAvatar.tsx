import { type AvatarProps, Avatar } from 'tamagui'
import type { LinkProps } from './Link'
import { Link, useLink } from 'solito/link'
import { memo } from 'react'

export type LinkableAvatarProps = AvatarProps & LinkProps

export const LinkableAvatar = memo(
  ({
    href = '',
    replace,
    scroll,
    shallow,
    children,
    ...props
  }: { children: React.ReactNode } & LinkProps & AvatarProps) => {
    const linkProps = useLink({ href, replace, scroll, shallow })
    return (
      <Link href={linkProps.href} role={linkProps.accessibilityRole}>
        <Avatar {...props}>{children}</Avatar>
      </Link>
    )
  }
)

LinkableAvatar.displayName = 'LinkableAvatar'
