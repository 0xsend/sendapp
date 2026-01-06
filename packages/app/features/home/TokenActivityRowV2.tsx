// optimized version of TokenActivityRow for the RecentActivityFeed.tsx
import { Link, Text, XStack, YStack } from '@my/ui'
import { Paragraph, useEvent } from 'tamagui'
import type { Activity } from 'app/utils/zod/activity'
import { ActivityAvatar } from '../activity/ActivityAvatarV2'

import type { useUser } from 'app/utils/useUser'
import type { ReactNode } from 'react'
import { memo, useCallback } from 'react'
import type { useSendScreenParams } from 'app/routers/params'
import type { useSwapRouters } from 'app/utils/useSwapRouters'
import type { useLiquidityPools } from 'app/utils/useLiquidityPools'
import type { useAddressBook } from 'app/utils/useAddressBook'
import type { useHoverStyles } from 'app/utils/useHoverStyles'

interface TokenActivityRowV2Props {
  profile: ReturnType<typeof useUser>['profile']
  activity: Activity
  onPress?: (activity: Activity) => void
  sendParamsRef: React.RefObject<ReturnType<typeof useSendScreenParams>>
  swapRouters: ReturnType<typeof useSwapRouters>['data']
  liquidityPools: ReturnType<typeof useLiquidityPools>['data']
  addressBook: ReturnType<typeof useAddressBook>
  hoverStyle: ReturnType<typeof useHoverStyles>
  computedAmount: ReactNode
  computedDate: ReactNode
  computedEventName: string
  computedSubtext: string | null
  computedSubtextAddress: `0x${string}` | null
  computedIsUserTransfer: boolean
}

export const TokenActivityRow = ({
  profile,
  activity,
  onPress,
  sendParamsRef,
  swapRouters,
  liquidityPools,
  addressBook,
  hoverStyle,
  computedAmount,
  computedDate,
  computedEventName,
  computedSubtext,
  computedSubtextAddress,
  computedIsUserTransfer,
}: TokenActivityRowV2Props) => {
  const { from_user, to_user } = activity

  const [sendParams, setSendParams] = sendParamsRef.current ?? []

  const handlePress = useEvent(() => {
    if (onPress) {
      if (computedIsUserTransfer) {
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
      amount={computedAmount}
      date={computedDate}
      eventName={computedEventName}
      subtext={computedSubtext}
      subtextAddress={computedSubtextAddress}
      isUserTransfer={computedIsUserTransfer}
      activity={activity}
      onPress={onPress ? handlePress : undefined}
      swapRouters={swapRouters}
      liquidityPools={liquidityPools}
      addressBook={addressBook}
      hoverStyle={hoverStyle}
    />
  )
}

TokenActivityRow.displayName = 'TokenActivityRow'

const TokenActivityRowContent = memo(
  ({
    amount,
    date,
    eventName,
    subtext,
    subtextAddress,
    isUserTransfer,
    activity,
    onPress,
    swapRouters,
    liquidityPools,
    addressBook,
    hoverStyle,
  }: {
    amount: ReactNode
    date: ReactNode
    eventName: string
    subtext: string | null
    subtextAddress: `0x${string}` | null
    isUserTransfer: boolean
    activity: Activity
    onPress?: () => void
    swapRouters: ReturnType<typeof useSwapRouters>['data']
    liquidityPools: ReturnType<typeof useLiquidityPools>['data']
    addressBook: ReturnType<typeof useAddressBook>
    hoverStyle: ReturnType<typeof useHoverStyles>
  }) => {
    // Stop propagation when clicking the address link
    const handleLinkPress = useCallback((e: { stopPropagation: () => void }) => {
      e.stopPropagation()
    }, [])

    // Render subtext - if it's an external address, make it a link
    const renderSubtext = () => {
      const textToRender = isUserTransfer ? eventName : subtext
      const addressToLink = isUserTransfer ? null : subtextAddress

      if (addressToLink && textToRender) {
        return (
          <Link
            href={`/profile/${addressToLink}`}
            onPress={handleLinkPress}
            color="$color10"
            textDecorationLine="underline"
            hoverStyle={{ opacity: 0.8 }}
          >
            {textToRender}
          </Link>
        )
      }
      return textToRender
    }

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
        testID="TokenActivityRow"
        hoverStyle={hoverStyle}
        onPress={onPress}
      >
        <XStack gap="$3.5" width="100%" f={1} alignItems="flex-start">
          <ActivityAvatar
            activity={activity}
            addressBook={addressBook}
            swapRouters={swapRouters}
            liquidityPools={liquidityPools}
          />
          <YStack width="100%" f={1} height="auto" overflow="hidden" gap="$1">
            <XStack jc="space-between" gap="$1.5" width="100%">
              <Text color="$color12" fontSize="$5" fontWeight="500">
                {isUserTransfer ? subtext : eventName}
              </Text>
              <Text>&nbsp;</Text>
              <Text color="$color12" fontSize="$5" fontWeight="500" ta="right">
                {amount}
              </Text>
            </XStack>
            <Paragraph
              color="$color10"
              size="$4"
              maxWidth="100%"
              overflow="hidden"
              textOverflow="ellipsis"
              numberOfLines={2}
              lineHeight={18}
            >
              {renderSubtext()}
            </Paragraph>
            <Paragraph color="$color10" size="$3" flexShrink={0} display="flex" opacity={0.6}>
              {date}
            </Paragraph>
          </YStack>
        </XStack>
      </XStack>
    )
  }
)

TokenActivityRowContent.displayName = 'TokenActivityRowContent'
