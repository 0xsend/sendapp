import { type AvatarProps, Avatar } from 'tamagui'
import type { LinkProps } from './Link'
import { Link } from 'solito/link'
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
    return (
      <Link href={href}>
        <Avatar {...props}>{children}</Avatar>
      </Link>
    )
  }
)

LinkableAvatar.displayName = 'LinkableAvatar'
