import type { InfiniteData, UseInfiniteQueryResult } from '@tanstack/react-query'
import type { Activity } from 'app/utils/zod/activity'
import type { PostgrestError } from '@supabase/postgrest-js'
import type { ZodError } from 'zod'
import { useCallback, useMemo } from 'react'
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
import Search from 'app/components/SearchBar'

// Date separator component
const DateSeparatorRow = ({ dateKey }: { dateKey: string }) => (
  <XStack
    f={1}
    backgroundColor={'$color1'}
    p="$3.5"
    pb={0}
    borderTopRightRadius={'$6'}
    borderTopLeftRadius={'$6'}
  >
    <Paragraph size={'$5'} fontWeight={900}>
      {dateKey}
    </Paragraph>
  </XStack>
)

// Define the list item types
type ListItem =
  | { type: 'activity'; data: Activity; isLastInGroup: boolean }
  | { type: 'date-separator'; data: { dateKey: string } }
  | { type: 'spacer' }
  | { type: 'search' }

export default function ActivityFeed({
  activityFeedQuery,
  onActivityPress,
}: {
  activityFeedQuery: UseInfiniteQueryResult<InfiniteData<Activity[]>, PostgrestError | ZodError>
  onActivityPress: (activity: Activity) => void
}) {
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

    items.push({ type: 'search' })

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
        const isLastInGroup = activityIndex === groupActivities.length - 1

        items.push({
          type: 'activity',
          data: activity,
          isLastInGroup,
        })
      })
    }

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
            case 'search':
              return 40
            case 'spacer':
              return 20
            case 'date-separator':
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
        case 'search':
          return <Search containerProps={{ elevation: 0 }} />
        case 'date-separator':
          return <DateSeparatorRow dateKey={item.data.dateKey} />
        case 'activity':
          return (
            <XStack
              backgroundColor={'$color1'}
              borderBottomLeftRadius={item.isLastInGroup ? '$6' : 0}
              borderBottomRightRadius={item.isLastInGroup ? '$6' : 0}
            >
              <TokenActivityRow activity={item.data} onPress={onActivityPress} />
            </XStack>
          )
        default:
          return null
      }
    },
    [onActivityPress]
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
      <Paragraph maxWidth={600} fontFamily={'$mono'} fontSize={'$5'} color={'$color12'}>
        {activitiesError?.message.split('.').at(0) ?? `${activitiesError}`}
      </Paragraph>
    )
  }

  if (!activities.length) {
    return (
      <Paragraph fontSize={'$5'} color={'$color12'}>
        No activities, just send it!
      </Paragraph>
    )
  }

  return (
    <YStack f={1} elevation={'$0.75'}>
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
