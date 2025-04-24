import { Link, type LinkProps, Paragraph, XStack } from '@my/ui'
import type { ReactElement, ReactNode } from 'react'
import { useHoverStyles } from 'app/utils/useHoverStyles'
import { ChevronRight } from '@tamagui/lucide-icons'

export function AccountNavLink({
  text,
  icon,
  ...props
}: { text: string; icon: ReactNode } & Omit<LinkProps, 'children'>): ReactElement {
  const hoverStyles = useHoverStyles()

  return (
    <Link {...props}>
      <XStack
        ai="center"
        jc="space-between"
        gap="$4"
        p="$3.5"
        br={'$4'}
        $gtLg={{ p: '$5' }}
        hoverStyle={hoverStyles}
      >
        <XStack gap="$3.5" ai="center">
          {icon}
          <Paragraph size={'$5'}>{text}</Paragraph>
        </XStack>
        <ChevronRight
          size={'$1'}
          color={'$lightGrayTextField'}
          $theme-light={{ color: '$darkGrayTextField' }}
        />
      </XStack>
    </Link>
  )
}
