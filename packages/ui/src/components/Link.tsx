import { Link as SolitoLink, type LinkProps as SolitoLinkProps } from 'solito/link'
import { SizableText, styled, type TextProps } from 'tamagui'

export type LinkProps = Omit<SolitoLinkProps, 'passHref' | 'as'> &
  TextProps & {
    target?: string
    rel?: string
    title?: string
  }

const StyledLink = styled(SolitoLink, {
  name: 'Link',
  role: 'link',
})

export const Link = ({
  href = '',
  replace,
  scroll,
  shallow,
  prefetch,
  locale,
  children,
  ...props
}: LinkProps) => {
  const linkProps = { href, replace, scroll, shallow, prefetch, locale }
  return (
    <StyledLink {...linkProps}>
      <SizableText tag="span" {...props}>
        {children}
      </SizableText>
    </StyledLink>
  )
}
