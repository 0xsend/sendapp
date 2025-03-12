import { Paragraph, Text, XStack, YStack } from '@my/ui'
import { amountFromActivity, eventNameFromActivity, subtextFromActivity } from 'app/utils/activity'
import {
  isSendAccountReceiveEvent,
  isSendAccountTransfersEvent,
  type Activity,
} from 'app/utils/zod/activity'
import { ActivityAvatar } from '../activity/ActivityAvatar'
import { CommentsTime } from 'app/utils/dateHelper'
import { Link } from 'solito/link'

import { useUser } from 'app/utils/useUser'
import { useHoverStyles } from 'app/utils/useHoverStyles'

// Fixed width and spacing values for consistent layout
const AVATAR_WIDTH = 40
const AVATAR_MARGIN = 14 // equivalent to $3.5 gap
const TEXT_MIN_WIDTH = 70

export function TokenActivityRow({
  activity,
  onPress,
}: {
  activity: Activity
  onPress?: (activity: Activity) => void
}) {
  const { profile } = useUser()
  const { created_at, from_user, to_user } = activity
  const amount = amountFromActivity(activity)
  const date = CommentsTime(new Date(created_at))
  const eventName = eventNameFromActivity(activity)
  const subtext = subtextFromActivity(activity)
  const isERC20Transfer = isSendAccountTransfersEvent(activity)
  const isETHReceive = isSendAccountReceiveEvent(activity)
  const hoverStyles = useHoverStyles()

  return (
    <XStack
      ai="center"
      w="100%"
      mx={0}
      my={0}
      p="$3.5"
      br="$4"
      position="relative"
      left={0}
      right={0}
      cursor={onPress ? 'pointer' : 'default'}
      $gtLg={{ p: '$5' }}
      testID={'TokenActivityRow'}
      hoverStyle={onPress ? hoverStyles : null}
      onPress={() => onPress?.(activity)}
      style={{ boxSizing: 'border-box', maxWidth: '100%', paddingRight: 16, paddingLeft: 16 }}
    >
      <XStack f={1} ai="center" w="100%" position="relative" style={{ maxWidth: '100%' }}>
        <XStack
          width={AVATAR_WIDTH}
          mr={AVATAR_MARGIN}
          minWidth={AVATAR_WIDTH}
          ai="center"
          jc="center"
        >
          <ActivityAvatar activity={activity} />
        </XStack>

        <YStack f={1} gap="$1.5" w="calc(100% - 54px)" style={{ maxWidth: 'calc(100% - 54px)' }}>
          <XStack jc="space-between" ai="center" w="100%">
            <Text
              color="$color12"
              fontSize="$6"
              fontWeight="500"
              flex={1}
              numberOfLines={1}
              style={{ minWidth: 0, maxWidth: `calc(100% - ${TEXT_MIN_WIDTH + 8}px)` }}
            >
              {eventName}
            </Text>
            <Text
              color="$color12"
              fontSize="$6"
              fontWeight="500"
              ml="$2"
              textAlign="right"
              minWidth={TEXT_MIN_WIDTH}
              style={{ flexShrink: 0 }}
            >
              {amount}
            </Text>
          </XStack>

          <XStack jc="space-between" ai="center" w="100%">
            {(isERC20Transfer || isETHReceive) &&
            Boolean(to_user?.send_id) &&
            Boolean(from_user?.send_id) ? (
              <Link
                href={`/profile/${
                  profile?.send_id === from_user?.send_id ? to_user?.send_id : from_user?.send_id
                }`}
                style={{ flex: 1, minWidth: 0, maxWidth: `calc(100% - ${TEXT_MIN_WIDTH + 8}px)` }}
              >
                <Paragraph
                  color="$color10"
                  fontFamily="$mono"
                  fontSize="$5"
                  textDecorationLine="underline"
                  numberOfLines={1}
                >
                  {subtext}
                </Paragraph>
              </Link>
            ) : (
              <Paragraph
                color="$color10"
                fontFamily="$mono"
                fontSize="$5"
                flex={1}
                numberOfLines={1}
                style={{ minWidth: 0, maxWidth: `calc(100% - ${TEXT_MIN_WIDTH + 8}px)` }}
              >
                {subtext}
              </Paragraph>
            )}
            <Paragraph
              color="$color10"
              size="$5"
              ml="$2"
              whiteSpace="nowrap"
              textAlign="right"
              minWidth={TEXT_MIN_WIDTH}
              style={{ flexShrink: 0 }}
            >
              {date}
            </Paragraph>
          </XStack>
        </YStack>
      </XStack>
    </XStack>
  )
}
