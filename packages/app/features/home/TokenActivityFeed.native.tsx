import {
  type CardProps,
  dataProviderMakerNative,
  H4,
  layoutProviderMakerNative,
  Paragraph,
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
  | { type: 'loader' }

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
    error: activitiesError,
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

    items.push({
      type: 'loader',
    })

    return {
      listData: items,
      firstActivityIndex: 1,
      lastActivityIndex: items.length - 2,
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
            case 'loader':
              return 40
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
              backgroundColor={'$color1'}
              borderWidth={1}
              borderColor={'$color1'}
              borderTopLeftRadius={isFirst ? '$6' : 0}
              borderTopRightRadius={isFirst ? '$6' : 0}
              borderBottomLeftRadius={isLast ? '$6' : 0}
              borderBottomRightRadius={isLast ? '$6' : 0}
            >
              <TokenActivityRow activity={item.data} onPress={onActivityPress} />
            </XStack>
          )
        case 'loader':
          return (
            <Spinner opacity={hasNextPage ? 1 : 0} pt={'$3.5'} size="small" color={'$color12'} />
          )
        default:
          return null
      }
    },
    [onActivityPress, firstActivityIndex, lastActivityIndex, hasNextPage]
  )

  const handleEndReach = useCallback(() => {
    if (hasNextPage && !isFetchingNextPageActivities) {
      void fetchNextPage()
    }
  }, [hasNextPage, isFetchingNextPageActivities, fetchNextPage])

  if (isLoadingActivities) {
    return <Spinner size="small" />
  }

  if (activitiesError) {
    return (
      <Paragraph maxWidth={600} fontFamily={'$mono'} fontSize={'$5'} color={'$error'}>
        {activitiesError?.message.split('.').at(0) ?? `${activitiesError}`}
      </Paragraph>
    )
  }

  if (!activities.length) {
    return (
      <Paragraph fontSize={'$5'} color={'$color12'} ta={'center'} w={'100%'} mt={'$3.5'}>
        No activities, just send it!
      </Paragraph>
    )
  }

  return (
    <YStack f={1}>
      <RecyclerListView
        style={{ flex: 1, overflow: 'visible' }}
        dataProvider={dataProvider}
        rowRenderer={rowRenderer}
        layoutProvider={layoutProvider}
        scrollViewProps={{
          showsVerticalScrollIndicator: false,
          overScrollMode: 'never',
        }}
        onEndReached={handleEndReach}
        onEndReachedThreshold={1000}
        renderAheadOffset={2000}
      />
    </YStack>
  )
}
