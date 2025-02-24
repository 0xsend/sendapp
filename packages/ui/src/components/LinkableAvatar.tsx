import { type AvatarProps, Avatar } from 'tamagui'
import type { LinkProps } from './Link'
import { Link, useLink } from 'solito/link'

export type LinkableAvatarProps = AvatarProps & LinkProps

export const LinkableAvatar = ({
  href = '',
  replace,
  scroll,
  shallow,
  children,
  ...props
}: { children: React.ReactNode } & LinkProps & AvatarProps) => {
  const linkProps = useLink({ href, replace, scroll, shallow })
  return (
    <Link {...linkProps}>
      <Avatar {...props}>{children}</Avatar>
    </Link>
  )
}
