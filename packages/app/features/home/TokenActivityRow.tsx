import { Paragraph, Text, XStack, YStack } from '@my/ui'
import { useEventNameFromActivity, useSubtextFromActivity } from 'app/utils/activity'
import { useAmountFromActivity } from 'app/utils/activity-hooks'
import { CommentsTime } from 'app/utils/dateHelper'
import {
  type Activity,
  isSendAccountReceiveEvent,
  isSendAccountTransfersEvent,
} from 'app/utils/zod/activity'
import { ActivityAvatar } from '../activity/ActivityAvatar'

import { useHoverStyles } from 'app/utils/useHoverStyles'
import { useSwapRouters } from 'app/utils/useSwapRouters'
import { useLiquidityPools } from 'app/utils/useLiquidityPools'
import { useUser } from 'app/utils/useUser'
import { useRouter } from 'solito/router'

export function TokenActivityRow({
  activity,
  onPress,
}: {
  activity: Activity
  onPress?: (activity: Activity) => void
}) {
  const { profile } = useUser()
  const { data: swapRouters } = useSwapRouters()
  const { data: liquidityPools } = useLiquidityPools()
  const { created_at, from_user, to_user } = activity
  const amount = useAmountFromActivity(activity, swapRouters, liquidityPools)
  const date = CommentsTime(new Date(created_at))
  const eventName = useEventNameFromActivity({ activity, swapRouters, liquidityPools })
  const subtext = useSubtextFromActivity({ activity, swapRouters, liquidityPools })
  const isERC20Transfer = isSendAccountTransfersEvent(activity)
  const isETHReceive = isSendAccountReceiveEvent(activity)
  const hoverStyles = useHoverStyles()
  const router = useRouter()

  const isUserTransfer =
    (isERC20Transfer || isETHReceive) && Boolean(to_user?.send_id) && Boolean(from_user?.send_id)

  const handlePress = () => {
    if (onPress) {
      if (isUserTransfer) {
        router.push(
          `/profile/${profile?.send_id === from_user?.send_id ? to_user?.send_id : from_user?.send_id}`
        )
        return
      }
      onPress(activity)
    }
  }

  console.log('=====================================')
  console.log('amount', amount)
  console.log('date', date)
  console.log('eventName', eventName)
  console.log('subtext', subtext)
  console.log('isERC20Transfer', isERC20Transfer)
  console.log('isETHReceive', isETHReceive)
  console.log('activity', activity)
  console.log('=====================================')

  return (
    <XStack
      width={'100%'}
      ai="center"
      jc="space-between"
      gap="$4"
      p="$3.5"
      br={'$4'}
      cursor={onPress ? 'pointer' : 'default'}
      $gtLg={{ p: '$5' }}
      testID={'TokenActivityRow'}
      hoverStyle={onPress ? hoverStyles : null}
      onPress={handlePress}
    >
      <XStack gap="$3.5" width={'100%'} f={1}>
        <ActivityAvatar activity={activity} />
        <YStack width={'100%'} f={1} overflow="hidden">
          <XStack fd="row" jc="space-between" gap="$1.5" f={1} width={'100%'}>
            <Text color="$color12" fontSize="$6" fontWeight={'500'}>
              {isUserTransfer ? subtext : eventName}
            </Text>
            <Text>&nbsp;</Text>
            <Text color="$color12" fontSize="$6" fontWeight={'500'} ta="right">
              {amount}
            </Text>
          </XStack>
          <XStack
            gap="$2"
            alignItems="center"
            justifyContent="space-between"
            width="100%"
            overflow="hidden"
            f={1}
          >
            <Paragraph
              color="$color10"
              maxWidth={'100%'}
              overflow={'hidden'}
              textOverflow={'ellipsis'}
              numberOfLines={1}
              fontSize="$5"
            >
              {isUserTransfer ? eventName : subtext}
            </Paragraph>
            <Paragraph color="$color10" size={'$5'} textAlign={'right'} flexShrink={0}>
              {date}
            </Paragraph>
          </XStack>
        </YStack>
      </XStack>
    </XStack>
  )
}
