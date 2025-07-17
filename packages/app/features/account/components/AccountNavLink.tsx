import { Link, type LinkProps, Paragraph, XStack } from '@my/ui'
import type { ReactElement, ReactNode } from 'react'
import { useHoverStyles } from 'app/utils/useHoverStyles'
import { ChevronRight } from '@tamagui/lucide-icons'
import { Linking, Platform, Pressable } from 'react-native'

export function AccountNavLink({
  text,
  icon,
  href,
  ...props
}: { text: string; icon: ReactNode } & Omit<LinkProps, 'children'>): ReactElement {
  // Convert href to string for checking if it's external
  const hrefString = typeof href === 'string' ? href : href.pathname || ''
  const isExternalLink = hrefString.startsWith('http://') || hrefString.startsWith('https://')

  // Handle external links
  if (isExternalLink && Platform.OS !== 'web') {
    return (
      <Pressable onPress={() => Linking.openURL(hrefString)}>
        <LinkContent icon={icon} text={text} />
      </Pressable>
    )
  }

  return (
    <Link href={href} {...props}>
      <LinkContent icon={icon} text={text} />
    </Link>
  )
}

const LinkContent = ({ text, icon }: { text: string; icon: ReactNode }) => {
  const hoverStyles = useHoverStyles()

  return (
    <XStack
      ai="center"
      jc="space-between"
      gap="$4"
      p="$3.5"
      br={'$4'}
      w={'100%'}
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
  )
}
