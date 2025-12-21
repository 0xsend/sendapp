import { Text, XStack, YStack } from '@my/ui'
import { Paragraph } from 'tamagui'
import type { ReactNode } from 'react'
import { memo } from 'react'
import type { useHoverStyles } from 'app/utils/useHoverStyles'

interface ActivityRowLayoutProps {
  avatar: ReactNode
  title: string
  amount: ReactNode
  subtext?: string | null
  date: ReactNode
  actions?: ReactNode
  onPress?: () => void
  hoverStyle?: ReturnType<typeof useHoverStyles>
}

export const ActivityRowLayout = memo(function ActivityRowLayout({
  avatar,
  title,
  amount,
  subtext,
  date,
  actions,
  onPress,
  hoverStyle,
}: ActivityRowLayoutProps) {
  return (
    <XStack
      width="100%"
      height={102}
      ai="center"
      jc="space-between"
      gap="$4"
      p="$3.5"
      br="$4"
      borderWidth={1}
      borderColor="$color1"
      cursor="pointer"
      hoverStyle={hoverStyle}
      onPress={onPress}
    >
      <XStack gap="$3.5" width="100%" f={1} alignItems="flex-start">
        {avatar}
        <YStack width="100%" f={1} height="auto" overflow="hidden" gap="$1">
          <XStack jc="space-between" gap="$1.5" width="100%">
            <Text color="$color12" fontSize="$5" fontWeight="500">
              {title}
            </Text>
            <Text>&nbsp;</Text>
            <Text color="$color12" fontSize="$5" fontWeight="500" ta="right">
              {amount}
            </Text>
          </XStack>
          {subtext && (
            <Paragraph
              color="$color10"
              size="$4"
              maxWidth="100%"
              overflow="hidden"
              textOverflow="ellipsis"
              numberOfLines={2}
              lineHeight={18}
            >
              {subtext}
            </Paragraph>
          )}
          <XStack jc="space-between" ai="center">
            <Paragraph color="$color10" size="$3" flexShrink={0} display="flex" opacity={0.6}>
              {date}
            </Paragraph>
            {actions}
          </XStack>
        </YStack>
      </XStack>
    </XStack>
  )
})
