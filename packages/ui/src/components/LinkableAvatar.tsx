import { type AvatarProps, Avatar as AvatarOg, styled } from 'tamagui'
import type { LinkProps } from './Link'
import { useLink } from 'solito/link'

const LinkableAvatarFrame = styled(AvatarOg, {
  name: 'Avatar',
  tag: 'a',
})

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
    <LinkableAvatarFrame {...props} {...linkProps}>
      {children}
    </LinkableAvatarFrame>
  )
}
