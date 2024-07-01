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
  const iconActiveColor = resolvedTheme?.startsWith('dark') ? '$primary' : '$green3Light'
  const iconInActiveColor = resolvedTheme?.startsWith('dark') ? '$gray5Light' : '$color12'

  return (
    <Link
      hoverStyle={
        props.disabled ? {} : { opacity: 1, backgroundColor: 'transparent', borderWidth: 0 }
      }
      cursor={props.disabled ? 'not-allowed' : 'pointer'}
      opacity={isActiveRoute ? 1 : 0.63}
      disabled={props.disabled}
      {...props}
      href={props.disabled ? '' : props.href}
    >
      <Paragraph
        f={1}
        $md={{ fontSize: '$5' }}
        fontWeight={isActiveRoute ? 'bold' : '300'}
        color={isActiveRoute ? iconActiveColor : iconInActiveColor}
        pl="$4"
      >
        {text}
      </Paragraph>
      {isActiveRoute && !sheet.open && (
        <Separator
          vertical
          borderColor="$greenBackground"
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
