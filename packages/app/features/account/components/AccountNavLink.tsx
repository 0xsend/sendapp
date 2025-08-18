import { Link, Paragraph, XStack } from '@my/ui'
import type { ReactElement, ReactNode } from 'react'
import { useHoverStyles } from 'app/utils/useHoverStyles'
import { ChevronRight } from '@tamagui/lucide-icons'
import { Linking, Platform, Pressable } from 'react-native'
import { useLink } from 'solito/link'

export function AccountNavLink({
  text,
  icon,
  href,
  onPress,
  ...props
}: {
  text: string
  href?: string
  icon: ReactNode
  target?: string
  onPress?: () => void
}): ReactElement | null {
  if (onPress) {
    return (
      <Pressable onPress={onPress}>
        <LinkContent icon={icon} text={text} />
      </Pressable>
    )
  }

  if (!href) {
    return null
  }

  const isExternalLink = href.startsWith('http://') || href.startsWith('https://')

  // Handle external links
  if (isExternalLink && Platform.OS !== 'web') {
    return (
      <Pressable onPress={() => Linking.openURL(href)}>
        <LinkContent icon={icon} text={text} />
      </Pressable>
    )
  }

  if (Platform.OS === 'web') {
    return (
      <Link href={href} {...props}>
        <LinkContent icon={icon} text={text} />
      </Link>
    )
  }

  return <NativeAccountNavLink icon={icon} text={text} href={href} />
}

const NativeAccountNavLink = ({
  text,
  icon,
  href,
}: {
  text: string
  icon: ReactNode
  href: string
}) => {
  const linkProps = useLink({ href })
  return (
    <XStack {...linkProps}>
      <LinkContent icon={icon} text={text} />
    </XStack>
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
