import { type AvatarProps, Avatar as AvatarOg } from 'tamagui'
import { Link, type LinkProps } from './Link'

export const LinkableAvatar = ({
  href = '',
  replace,
  scroll,
  shallow,
  prefetch,
  locale,
  children,
  ...props
}: { children: React.ReactNode } & LinkProps & AvatarProps) => {
  const linkProps = { href, replace, scroll, shallow, prefetch, locale }
  return (
    <Link {...linkProps}>
      <AvatarOg {...props}>{children}</AvatarOg>
    </Link>
  )
}
