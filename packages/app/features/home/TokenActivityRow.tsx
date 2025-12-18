import { Text, XStack, YStack } from '@my/ui'
import { Paragraph, useEvent } from 'tamagui'
import {
  useDateFromActivity,
  useEventNameFromActivity,
  useSubtextFromActivity,
} from 'app/utils/activity'
import { useAmountFromActivity } from 'app/utils/activity-hooks'
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
import {
  isTemporalEthTransfersEvent,
  isTemporalTokenTransfersEvent,
} from 'app/utils/zod/activity/TemporalTransfersEventSchema'
import type { ReactNode } from 'react'
import { memo, useCallback } from 'react'
import type { useSendScreenParams } from 'app/routers/params'

export const TokenActivityRow = ({
  activity,
  onPress,
  sendParamsRef,
}: {
  activity: Activity
  onPress?: (activity: Activity) => void
  sendParamsRef: React.RefObject<ReturnType<typeof useSendScreenParams>>
}) => {
  const { profile } = useUser()
  const { data: swapRouters } = useSwapRouters()
  const { data: liquidityPools } = useLiquidityPools()
  const { from_user, to_user } = activity
  const amount = useAmountFromActivity(activity, swapRouters, liquidityPools)
  const date = useDateFromActivity({ activity })
  const eventName = useEventNameFromActivity({ activity, swapRouters, liquidityPools })
  const subtext = useSubtextFromActivity({ activity, swapRouters, liquidityPools })
  const isERC20Transfer = isSendAccountTransfersEvent(activity)
  const isETHReceive = isSendAccountReceiveEvent(activity)
  const isTemporalTransfer =
    isTemporalEthTransfersEvent(activity) || isTemporalTokenTransfersEvent(activity)
  const isUserTransfer =
    (isERC20Transfer || isETHReceive || isTemporalTransfer) &&
    Boolean(to_user?.send_id) &&
    Boolean(from_user?.send_id)

  const [sendParams, setSendParams] = sendParamsRef.current ?? []

  const handlePress = useEvent(() => {
    if (onPress) {
      if (isUserTransfer) {
        setSendParams?.({
          ...sendParams,
          recipient:
            profile?.send_id === from_user?.send_id
              ? to_user?.send_id?.toString()
              : from_user?.send_id?.toString(),
          idType: 'sendid',
        })
        return
      }
      onPress(activity)
    }
  })

  return (
    <TokenActivityRowContent
      amount={amount}
      date={date}
      eventName={eventName}
      subtext={subtext}
      isUserTransfer={isUserTransfer}
      activity={activity}
      onPress={onPress ? handlePress : undefined}
    />
  )
}

const TokenActivityRowContent = memo(
  ({
    amount,
    date,
    eventName,
    subtext,
    isUserTransfer,
    activity,
    onPress,
  }: {
    amount: ReactNode
    date: ReactNode
    eventName: string
    subtext: string | null
    isUserTransfer: boolean
    activity: Activity
    onPress?: () => void
  }) => {
    const hoverStyles = useHoverStyles()

    return (
      <XStack
        width={'100%'}
        height={102}
        ai="center"
        jc="space-between"
        gap="$4"
        p="$3.5"
        br={'$4'}
        borderWidth={1}
        borderColor={'$color1'}
        cursor={onPress ? 'pointer' : 'default'}
        testID={'TokenActivityRow'}
        hoverStyle={onPress ? hoverStyles : null}
        onPress={onPress}
      >
        <XStack gap="$3.5" width={'100%'} f={1} alignItems={'flex-start'}>
          <ActivityAvatar activity={activity} />
          <YStack width={'100%'} f={1} height={'auto'} overflow="hidden" gap={'$1'}>
            <XStack jc="space-between" gap="$1.5" width={'100%'}>
              <Text color="$color12" fontSize="$5" fontWeight={'500'}>
                {isUserTransfer ? subtext : eventName}
              </Text>
              <Text>&nbsp;</Text>
              <Text color="$color12" fontSize="$5" fontWeight={'500'} ta="right">
                {amount}
              </Text>
            </XStack>
            <Paragraph
              color={'$color10'}
              size={'$4'}
              maxWidth={'100%'}
              overflow={'hidden'}
              textOverflow={'ellipsis'}
              numberOfLines={2}
              lineHeight={18}
            >
              {isUserTransfer ? eventName : subtext}
            </Paragraph>
            <Paragraph color={'$color10'} size={'$3'} flexShrink={0} display={'flex'} opacity={0.6}>
              {date}
            </Paragraph>
          </YStack>
        </XStack>
      </XStack>
    )
  }
)

TokenActivityRowContent.displayName = 'TokenActivityRowContent'
