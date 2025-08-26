import {
  type CardProps,
  dataProviderMakerNative,
  H4,
  layoutProviderMakerNative,
  Spinner,
  XStack,
  YStack,
} from '@my/ui'
import type { PostgrestError } from '@supabase/postgrest-js'
import type { InfiniteData, UseInfiniteQueryResult } from '@tanstack/react-query'
import { useQueryClient } from '@tanstack/react-query'
import type { Activity } from 'app/utils/zod/activity'
import { isTemporalSendEarnDepositEvent } from 'app/utils/zod/activity'
import { Events } from 'app/utils/zod/activity/events'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import type { ZodError } from 'zod'
import { TokenActivityRow } from './TokenActivityRow'
import { useRootScreenParams } from 'app/routers/params'
import { RecyclerListView } from 'recyclerlistview'
import type { CoinWithBalance } from 'app/data/coins'

// Define the list item types
type ListItem =
  | { type: 'activity-header'; data: { title: string; hasActivities: boolean } }
  | { type: 'activity'; data: Activity }

export default function TokenActivityFeed({
  tokenActivityFeedQuery,
  onActivityPress,
}: {
  tokenActivityFeedQuery: UseInfiniteQueryResult<
    InfiniteData<Activity[]>,
    PostgrestError | ZodError
  >
  onActivityPress: (activity: Activity) => void
  coin: CoinWithBalance
} & CardProps) {
  const queryClient = useQueryClient()
  const wasPendingRef = useRef(false) // Ref to track if a pending activity was seen previously
  const [queryParams] = useRootScreenParams()

  const {
    data,
    isLoading: isLoadingActivities,
    isFetchingNextPage: isFetchingNextPageActivities,
    fetchNextPage,
    hasNextPage,
  } = tokenActivityFeedQuery

  const activities = useMemo(() => data?.pages.flat() || [], [data])

  // Create the mixed data structure with header + activities
  const { listData, firstActivityIndex, lastActivityIndex } = useMemo(() => {
    const items: ListItem[] = []

    // Add activity header
    items.push({
      type: 'activity-header',
      data: {
        title: !activities.length ? 'No Activity' : 'Activity',
        hasActivities: activities.length > 0,
      },
    })

    for (const activity of activities) {
      items.push({ type: 'activity', data: activity })
    }

    return {
      listData: items,
      firstActivityIndex: 2,
      lastActivityIndex: items.length - 1,
    }
  }, [activities])

  useEffect(() => {
    // Only proceed if data is available
    if (!data?.pages) return

    const allActivities = data.pages.flat()

    // Check if there's currently any pending temporal activity (deposits or transfers)
    const isCurrentlyPending = allActivities.some((activity) => {
      // Check for pending Send Earn deposits
      if (
        isTemporalSendEarnDepositEvent(activity) &&
        !['cancelled', 'failed'].includes(activity.data?.status)
      ) {
        return true
      }

      // Check for pending transfers
      if (
        activity.event_name === Events.TemporalSendAccountTransfers &&
        !['cancelled', 'failed', 'confirmed'].includes(activity.data?.status)
      ) {
        return true
      }

      return false
    })

    // If it was pending previously but isn't anymore, invalidate the activity feed query
    if (wasPendingRef.current && !isCurrentlyPending) {
      // Invalidate the query
      queryClient.invalidateQueries({
        queryKey: ['token_activity_feed', { address: queryParams.token }],
        exact: false,
      })
    }

    // Update the ref to store the current pending state for the next effect run
    wasPendingRef.current = isCurrentlyPending
  }, [data, queryClient, queryParams.token])

  const dataProvider = useMemo(() => {
    return dataProviderMakerNative(listData)
  }, [listData])

  const layoutProvider = useMemo(
    () =>
      layoutProviderMakerNative({
        getLayoutType: (index) => {
          return listData[index]?.type || 'activity'
        },
        getHeightOrWidth: (index) => {
          const item = listData[index]
          switch (item?.type) {
            case 'activity-header':
              // Height for activity title
              return 35
            default:
              return 102
          }
        },
      }),
    [listData]
  )

  const rowRenderer = useCallback(
    (type: string | number, item: ListItem, index: number) => {
      const isFirst = index === firstActivityIndex
      const isLast = index === lastActivityIndex

      switch (item.type) {
        case 'activity-header':
          return (
            <H4 fontWeight={'600'} size={'$7'}>
              {item.data.title}
            </H4>
          )
        case 'activity':
          return (
            <XStack
              elevation={'$0.75'}
              position={'relative'}
              backgroundColor={'$color1'}
              borderTopLeftRadius={isFirst ? '$6' : 0}
              borderTopRightRadius={isFirst ? '$6' : 0}
              borderBottomLeftRadius={isLast ? '$6' : 0}
              borderBottomRightRadius={isLast ? '$6' : 0}
            >
              <TokenActivityRow activity={item.data} onPress={onActivityPress} />
              {!isFirst && (
                <XStack
                  position={'absolute'}
                  top={-10}
                  right={0}
                  left={0}
                  height={10}
                  backgroundColor={'$color1'}
                />
              )}
            </XStack>
          )
        default:
          return null
      }
    },
    [onActivityPress, firstActivityIndex, lastActivityIndex]
  )

  const handleEndReach = useCallback(() => {
    if (hasNextPage && !isFetchingNextPageActivities) {
      void fetchNextPage()
    }
  }, [hasNextPage, isFetchingNextPageActivities, fetchNextPage])

  return (
    <YStack f={1}>
      <RecyclerListView
        style={{ flex: 1, overflow: 'visible' }}
        dataProvider={dataProvider}
        rowRenderer={rowRenderer}
        layoutProvider={layoutProvider}
        scrollViewProps={{
          showsVerticalScrollIndicator: false,
        }}
        onEndReached={handleEndReach}
        onEndReachedThreshold={0.5}
      />
      <XStack py={'$3.5'} jc={'center'}>
        <Spinner
          opacity={!isLoadingActivities && isFetchingNextPageActivities ? 1 : 0}
          size="small"
          color={'$color12'}
        />
      </XStack>
    </YStack>
  )
}
