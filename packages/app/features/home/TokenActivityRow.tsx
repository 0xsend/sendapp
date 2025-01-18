import { Paragraph, Stack, Text, XStack, type XStackProps, YStack, useIsTouchDevice } from '@my/ui'
import { amountFromActivity, eventNameFromActivity, subtextFromActivity } from 'app/utils/activity'
import {
  isSendAccountReceiveEvent,
  isSendAccountTransfersEvent,
  type Activity,
} from 'app/utils/zod/activity'
import { ActivityAvatar } from '../activity/ActivityAvatar'
import { CommentsTime } from 'app/utils/dateHelper'
import { Link } from 'solito/link'
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable'
import type { SharedValue } from 'react-native-reanimated'

import { useUser } from 'app/utils/useUser'
import { useHoverStyles } from 'app/utils/useHoverStyles'
import { useRouter } from 'solito/router'
import { Reply } from '@tamagui/lucide-icons'
import { useState } from 'react'

const ReplySendAction = ({
  recipient,
  idType,
  progress,
}: { recipient: string | undefined; idType: string; progress: SharedValue<number> }) => {
  const router = useRouter()
  const [scale, setScale] = useState(0.0)
  const [opacity, setOpacity] = useState(0.0)
  //Needs a number id to avoid conflicts with other progress listeners
  progress.addListener(0, (value) => {
    setScale(Math.min(value, 1.0))
    setOpacity(Math.min(value, 1.0))
  })

  const onPress = () => {
    router.push({
      pathname: '/send',
      query: { recipient: recipient, idType: idType },
    })
  }
  return (
    <Stack jc="center" ai="flex-end" pl="$4" pr={'$1'} onPress={onPress} bc="$color0">
      <Reply
        color="$primary"
        $theme-light={{ color: '$color12' }}
        animation="200ms"
        scale={scale}
        opacity={opacity}
      />
    </Stack>
  )
}

export function TokenActivityRow({
  activity,
  onPress,
  ...props
}: {
  activity: Activity
  onPress?: (activity: Activity) => void
} & XStackProps) {
  const { profile } = useUser()
  const { created_at, from_user, to_user } = activity
  const router = useRouter()
  const amount = amountFromActivity(activity)
  const date = CommentsTime(new Date(created_at))
  const eventName = eventNameFromActivity(activity)
  const subtext = subtextFromActivity(activity)
  const isERC20Transfer = isSendAccountTransfersEvent(activity)
  const isETHReceive = isSendAccountReceiveEvent(activity)
  const hoverStyles = useHoverStyles()
  const isTouchDevice = useIsTouchDevice()
  const [isSwipeTriggered, setIsSwipeTriggered] = useState(false)
  const replyRecipient =
    profile?.send_id === from_user?.send_id ? to_user?.send_id : from_user?.send_id

  const renderRightActions = (progress: SharedValue<number>) => {
    //Needs a number id to avoid conflicts with other progress listeners
    progress.addListener(1, (value) => {
      if (value > 1.1) {
        setIsSwipeTriggered(true)
      } else {
        setIsSwipeTriggered(false)
      }
    })

    return (
      <ReplySendAction
        recipient={replyRecipient?.toString()}
        idType={'sendid'}
        progress={progress}
      />
    )
  }

  const handleOnSwipeableWillClose = () => {
    if (isSwipeTriggered) {
      router.push({
        pathname: '/send',
        query: { recipient: replyRecipient, idType: 'sendid' },
      })
    }
  }

  return (
    <Swipeable
      enabled={isTouchDevice && !!replyRecipient}
      renderRightActions={renderRightActions}
      rightThreshold={40}
      friction={2}
      overshootFriction={8}
      containerStyle={{ backgroundColor: 'transparent' }}
      hitSlop={{ right: -20 }}
      onSwipeableWillClose={handleOnSwipeableWillClose}
    >
      <XStack
        width={'100%'}
        ai="center"
        jc="space-between"
        gap="$4"
        p="$5"
        br={'$4'}
        cursor={onPress ? 'pointer' : 'default'}
        $gtLg={{ p: '$5' }}
        testID={'TokenActivityRow'}
        hoverStyle={onPress ? hoverStyles : null}
        onPress={() => onPress?.(activity)}
        bc="$color1"
        {...props}
      >
        <XStack gap="$3.5" width={'100%'} f={1}>
          <ActivityAvatar activity={activity} />
          <YStack width={'100%'} f={1} overflow="hidden">
            <XStack fd="row" jc="space-between" gap="$1.5" f={1} width={'100%'}>
              <Text color="$color12" fontSize="$6" fontWeight={'500'}>
                {eventName}
              </Text>
              <Text color="$color12" fontSize="$6" fontWeight={'500'} ta="right">
                {amount}
              </Text>
            </XStack>
            <XStack
              gap="$1.5"
              alignItems="flex-start"
              justifyContent="space-between"
              width="100%"
              overflow="hidden"
              f={1}
            >
              {(isERC20Transfer || isETHReceive) &&
              Boolean(to_user?.send_id) &&
              Boolean(from_user?.send_id) ? (
                <XStack
                  onPress={(e) => {
                    e.stopPropagation()
                  }}
                  maxWidth={'60%'}
                >
                  <Link
                    href={`/profile/${
                      profile?.send_id === from_user?.send_id
                        ? to_user?.send_id
                        : from_user?.send_id
                    }`}
                    viewProps={{
                      style: { maxWidth: '100%' },
                    }}
                  >
                    <Paragraph
                      color="$color10"
                      fontFamily={'$mono'}
                      fontSize="$5"
                      textDecorationLine="underline"
                    >
                      {subtext}
                    </Paragraph>
                  </Link>
                </XStack>
              ) : (
                <Paragraph
                  color="$color10"
                  fontFamily={'$mono'}
                  maxWidth={'100%'}
                  overflow={'hidden'}
                  fontSize="$5"
                >
                  {subtext}
                </Paragraph>
              )}
              <Paragraph color="$color10" size={'$5'} textAlign={'right'}>
                {date}
              </Paragraph>
            </XStack>
          </YStack>
        </XStack>
      </XStack>
    </Swipeable>
  )
}
