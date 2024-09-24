import { Link, Paragraph, type LinkProps, Separator, useSheet } from '@my/ui'
import { usePathname } from 'app/utils/usePathname'
import type { ReactElement } from 'react'
import { useThemeSetting } from '@tamagui/next-theme'

export function SettingsNavLink({
  text,
  ...props
}: { text: string } & Omit<LinkProps, 'children'>): ReactElement {
  const location = usePathname()
  const sheet = useSheet()
  const href = props.href.toString().split('?')[0]
  const isActiveRoute = href
    ? href === '/account'
      ? location === href
      : location.includes(href as string)
    : false // no href is never active

  const { resolvedTheme } = useThemeSetting()
  const iconActiveColor = resolvedTheme?.startsWith('dark') ? '$primary' : '$color12'

  return (
    <Link
      hoverStyle={
        props.disabled ? {} : { opacity: 1, backgroundColor: 'transparent', borderWidth: 0 }
      }
      cursor={props.disabled ? 'not-allowed' : 'pointer'}
      disabled={props.disabled}
      {...props}
      href={props.disabled ? '' : props.href}
    >
      <Paragraph
        f={1}
        fontWeight={isActiveRoute ? '600' : '400'}
        color={isActiveRoute ? iconActiveColor : '$color10'}
        pl="$4"
        fontSize={'$5'}
      >
        {text}
      </Paragraph>
      {isActiveRoute && !sheet.open && (
        <Separator
          vertical
          borderColor="$primary"
          $theme-light={{ borderColor: '$color12' }}
          pos="absolute"
          right={-1.5}
          top={-2}
          bottom={0}
          height="$2"
          borderWidth={1}
        />
      )}
    </Link>
  )
}
