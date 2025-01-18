import { useLink, type LinkProps as SolitoLinkProps } from 'solito/link'
import { SizableText, styled, View, type TextProps } from 'tamagui'

export type LinkProps = Omit<SolitoLinkProps, 'passHref' | 'as'> &
  TextProps & {
    target?: string
    rel?: string
    title?: string
  }

const StyledLink = styled(View, {
  name: 'Link',
  role: 'link',
  tag: 'a',
  style: {
    textDecorationLine: 'none',
    color: 'inherit',
  },
})

export const Link = ({
  href = '',
  replace,
  scroll,
  shallow,
  prefetch,
  locale,
  children,
  target,
  ...props
}: LinkProps) => {
  const linkProps = useLink({ href, replace, scroll, shallow })
  return (
    <StyledLink target={target} {...linkProps}>
      <SizableText tag="span" {...props}>
        {children}
      </SizableText>
    </StyledLink>
  )
}
