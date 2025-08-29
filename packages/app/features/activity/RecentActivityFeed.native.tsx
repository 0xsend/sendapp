import type { InfiniteData, UseInfiniteQueryResult } from '@tanstack/react-query'
import type { Activity } from 'app/utils/zod/activity'
import type { PostgrestError } from '@supabase/postgrest-js'
import type { ZodError } from 'zod'
import { useCallback, useMemo, useRef } from 'react'
import {
  dataProviderMakerNative,
  layoutProviderMakerNative,
  Paragraph,
  Spinner,
  XStack,
  YStack,
} from '@my/ui'
import { TokenActivityRow } from 'app/features/home/TokenActivityRow'
import { RecyclerListView } from 'recyclerlistview'
import { useScrollDirection } from 'app/provider/scroll/ScrollDirectionContext'
import { useIsFocused } from '@react-navigation/native'
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native'

// Date separator component
const DateSeparatorRow = ({ dateKey }: { dateKey: string }) => (
  <Paragraph size={'$7'} fontWeight={900}>
    {dateKey}
  </Paragraph>
)

// Define the list item types
type ListItem =
  | { type: 'activity'; data: Activity; isLastInGroup: boolean; isFirstInGroup: boolean }
  | { type: 'date-separator'; data: { dateKey: string } }
  | { type: 'spacer' }
  | { type: 'loader' }

export default function ActivityFeed({
  activityFeedQuery,
  onActivityPress,
}: {
  activityFeedQuery: UseInfiniteQueryResult<InfiniteData<Activity[]>, PostgrestError | ZodError>
  onActivityPress: (activity: Activity) => void
}) {
  const { onScroll, onContentSizeChange } = useScrollDirection()
  const isFocused = useIsFocused()
  const justLoadedRef = useRef(false)

  const {
    data,
    isLoading: isLoadingActivities,
    error: activitiesError,
    isFetchingNextPage: isFetchingNextPageActivities,
    fetchNextPage,
    hasNextPage,
  } = activityFeedQuery

  const activities = useMemo(() => data?.pages.flat() || [], [data])

  // Create the mixed data structure with date separators + activities
  const { listData } = useMemo(() => {
    const items: ListItem[] = []

    if (activities.length === 0) {
      return { listData: items }
    }

    // Group activities by date
    const groups = activities.reduce<Record<string, Activity[]>>((acc, activity) => {
      const isToday = activity.created_at.toDateString() === new Date().toDateString()
      const dateKey = isToday
        ? 'Today'
        : activity.created_at.toLocaleDateString(undefined, {
            day: 'numeric',
            month: 'long',
          })

      if (!acc[dateKey]) {
        acc[dateKey] = []
      }
      acc[dateKey].push(activity)
      return acc
    }, {})

    for (const [dateKey, groupActivities] of Object.entries(groups)) {
      items.push({ type: 'spacer' })

      items.push({
        type: 'date-separator',
        data: { dateKey },
      })

      // Add activities for this date group with proper first/last tracking
      groupActivities.forEach((activity, activityIndex) => {
        const isFirstInGroup = activityIndex === 0
        const isLastInGroup = activityIndex === groupActivities.length - 1

        items.push({
          type: 'activity',
          data: activity,
          isLastInGroup,
          isFirstInGroup,
        })
      })
    }

    items.push({
      type: 'loader',
    })

    return { listData: items }
  }, [activities])

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
            case 'spacer':
              return 20
            case 'date-separator':
              return 40
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
    (type: string | number, item: ListItem) => {
      switch (item.type) {
        case 'date-separator':
          return <DateSeparatorRow dateKey={item.data.dateKey} />
        case 'activity':
          return (
            <XStack
              backgroundColor={'$color1'}
              borderTopLeftRadius={item.isFirstInGroup ? '$6' : 0}
              borderTopRightRadius={item.isFirstInGroup ? '$6' : 0}
              borderBottomLeftRadius={item.isLastInGroup ? '$6' : 0}
              borderBottomRightRadius={item.isLastInGroup ? '$6' : 0}
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
    [onActivityPress, hasNextPage]
  )

  const handleEndReach = useCallback(() => {
    if (hasNextPage && !isFetchingNextPageActivities) {
      void fetchNextPage()
    }
  }, [hasNextPage, isFetchingNextPageActivities, fetchNextPage])

  if (isLoadingActivities) {
    return <Spinner size="small" mt={'$3.5'} />
  }

  if (activitiesError) {
    return (
      <Paragraph maxWidth={600} fontFamily={'$mono'} fontSize={'$5'} color={'$error'} mt={'$3.5'}>
        {activitiesError?.message.split('.').at(0) ?? `${activitiesError}`}
      </Paragraph>
    )
  }

  if (!activities.length) {
    return (
      <Paragraph fontSize={'$5'} color={'$color12'} mt={'$3.5'} ta={'center'} w={'100%'}>
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
        onContentSizeChange={onContentSizeChange}
        onScroll={(e) => {
          if (isFocused && !justLoadedRef.current && !isFetchingNextPageActivities) {
            onScroll(e as NativeSyntheticEvent<NativeScrollEvent>, 70)
          }
        }}
        scrollThrottle={128}
        onEndReached={handleEndReach}
        onEndReachedThreshold={1000}
        renderAheadOffset={2000}
      />
    </YStack>
  )
}
