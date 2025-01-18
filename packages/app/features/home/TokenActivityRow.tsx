import { Paragraph, Stack, Text, XStack, YStack, useIsTouchDevice } from '@my/ui'
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

import { useUser } from 'app/utils/useUser'
import { useRouter } from 'solito/router'
import { Check } from '@tamagui/lucide-icons'
import { useState } from 'react'
import { IconArrowRight } from 'app/components/icons'

const ReplySendAction = ({
  recipient,
  idType,
  isTriggered,
}: { recipient: string | undefined; idType: string; isTriggered: boolean }) => {
  const router = useRouter()
  const onPress = () => {
    'worklet'
    router.push({
      pathname: '/send',
      query: { recipient: recipient, idType: idType },
    })
  }
  return (
    <Stack jc="center" ai="flex-end" pr="$3" bbrr={10} btrr={10} onPress={onPress}>
      {isTriggered ? (
        <Check color="$primary" size={'$2'} />
      ) : (
        <Stack bc="$primary" jc="center" p={'$1'} br={9999}>
          <IconArrowRight color="$black" size={'$2'}>
            SEND
          </IconArrowRight>
        </Stack>
      )}
    </Stack>
  )
}

export function TokenActivityRow({ activity }: { activity: Activity }) {
  const { profile } = useUser()
  const { created_at, from_user, to_user } = activity
  const router = useRouter()
  const amount = amountFromActivity(activity)
  const date = CommentsTime(new Date(created_at))
  const eventName = eventNameFromActivity(activity)
  const subtext = subtextFromActivity(activity)
  const isERC20Transfer = isSendAccountTransfersEvent(activity)
  const isETHReceive = isSendAccountReceiveEvent(activity)
  const isTouchDevice = useIsTouchDevice()
  const [isSwipeTriggered, setIsSwipeTriggered] = useState(false)
  const replyRecipient =
    profile?.send_id === from_user?.send_id ? to_user?.send_id : from_user?.send_id

  const renderRightActions = (progress) => {
    'worklet'

    progress.addListener(0, (value) => {
      if (value > 1.25) {
        setIsSwipeTriggered(true)
      } else {
        setIsSwipeTriggered(false)
      }
    })

    return (
      <ReplySendAction
        recipient={replyRecipient?.toString()}
        idType={'sendid'}
        isTriggered={isSwipeTriggered}
      />
    )
  }

  return (
    <Swipeable
      enabled={isTouchDevice && !!replyRecipient}
      renderRightActions={renderRightActions}
      rightThreshold={40}
      friction={2}
      onSwipeableWillClose={() => {
        if (isSwipeTriggered) {
          router.push({
            pathname: '/send',
            query: { recipient: replyRecipient, idType: 'sendid' },
          })
        }
      }}
    >
      <XStack
        width={'100%'}
        ai="center"
        jc="space-between"
        gap="$4"
        p="$3.5"
        $gtLg={{ p: '$5' }}
        testID={'TokenActivityRow'}
        bc="$color1"
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
                <Link
                  href={`/profile/${
                    profile?.send_id === from_user?.send_id ? to_user?.send_id : from_user?.send_id
                  }`}
                  viewProps={{
                    style: { maxWidth: '60%' },
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
