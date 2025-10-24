import { useState, useCallback } from 'react'
import { useLink, type LinkProps as SolitoLinkProps } from 'solito/link'
import { SizableText, styled, View, type TextProps, type ViewProps } from 'tamagui'
import { usePrefetch } from '../hooks/usePrefetch'

export type LinkProps = Omit<SolitoLinkProps, 'passHref' | 'as'> &
  TextProps & {
    target?: string
    rel?: string
    title?: string
    containerProps?: ViewProps
    prefetch?: boolean
    /** default true */
    prefetchOnHover?: boolean
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
  locale,
  children,
  target,
  containerProps,
  prefetch: prefetchProp,
  prefetchOnHover = true,
  ...props
}: LinkProps) => {
  const hrefString = href?.toString()
  const linkProps = useLink({ href, replace, scroll, shallow })
  // Store href in state to prevent prefetching a different href when component is reused in a recycler list
  const [prefetch, setPrefetch] = useState({ prefetch: !!prefetchProp, href: hrefString })
  usePrefetch(prefetch.prefetch && hrefString === prefetch.href ? hrefString : undefined)
  const handleMouseEnter = useCallback(() => {
    if (prefetchOnHover) {
      setPrefetch({ prefetch: true, href: hrefString })
    }
  }, [prefetchOnHover, hrefString])
  return (
    <StyledLink onMouseEnter={handleMouseEnter} target={target} {...linkProps} {...containerProps}>
      <SizableText tag="span" {...props}>
        {children}
      </SizableText>
    </StyledLink>
  )
}
