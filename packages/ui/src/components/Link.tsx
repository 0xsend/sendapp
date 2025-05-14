import { useLink, type LinkProps as SolitoLinkProps } from 'solito/link'
import { SizableText, styled, View, type TextProps, type ViewProps } from 'tamagui'

export type LinkProps = Omit<SolitoLinkProps, 'passHref' | 'as'> &
  TextProps & {
    target?: string
    rel?: string
    title?: string
    containerProps?: ViewProps
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
  containerProps,
  ...props
}: LinkProps) => {
  const linkProps = useLink({ href, replace, scroll, shallow })
  return (
    <StyledLink target={target} {...linkProps} {...containerProps}>
      <SizableText tag="span" {...props}>
        {children}
      </SizableText>
    </StyledLink>
  )
}
