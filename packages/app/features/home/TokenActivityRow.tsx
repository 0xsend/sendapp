import { Paragraph, Text, XStack, YStack } from '@my/ui'
import {
  useAmountFromActivity,
  useEventNameFromActivity,
  useSubtextFromActivity,
} from 'app/utils/activity'
import { CommentsTime } from 'app/utils/dateHelper'
import {
  type Activity,
  isSendAccountReceiveEvent,
  isSendAccountTransfersEvent,
} from 'app/utils/zod/activity'
import { Link } from 'solito/link'
import { ActivityAvatar } from '../activity/ActivityAvatar'

import { useHoverStyles } from 'app/utils/useHoverStyles'
import { useSwapRouters } from 'app/utils/useSwapRouters'
import { useLiquidityPools } from 'app/utils/useLiquidityPools'
import { useUser } from 'app/utils/useUser'

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
  const eventName = useEventNameFromActivity(activity)
  const subtext = useSubtextFromActivity(activity)
  const isERC20Transfer = isSendAccountTransfersEvent(activity)
  const isETHReceive = isSendAccountReceiveEvent(activity)
  const hoverStyles = useHoverStyles()

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
      onPress={() => onPress?.(activity)}
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
                    profile?.send_id === from_user?.send_id ? to_user?.send_id : from_user?.send_id
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
  )
}
