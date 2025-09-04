import type { InfiniteData, UseInfiniteQueryResult } from '@tanstack/react-query'
import type { Activity } from 'app/utils/zod/activity'
import type { PostgrestError } from '@supabase/postgrest-js'
import type { ZodError } from 'zod'
import { useScrollDirection } from 'app/provider/scroll/ScrollDirectionContext'
import { type PropsWithChildren, useCallback, useMemo } from 'react'
import {
  H4,
  Paragraph,
  Spinner,
  View,
  YStack,
  dataProviderMakerWeb,
  layoutProviderMakerWeb,
} from '@my/ui'
import { RecyclerListView } from 'recyclerlistview/web'
import { TokenActivityRow } from 'app/features/home/TokenActivityRow'

type ListItem =
  | { type: 'date-separator'; title: string; first: boolean }
  | { type: 'activity'; data: Activity; isFirstInGroup: boolean; isLastInGroup: boolean }

export default function ActivityFeed({
  activityFeedQuery,
  onActivityPress,
}: {
  activityFeedQuery: UseInfiniteQueryResult<InfiniteData<Activity[]>, PostgrestError | ZodError>
  onActivityPress: (activity: Activity) => void
}) {
  const { isAtEnd } = useScrollDirection()

  const {
    data,
    isLoading: isLoadingActivities,
    error: activitiesError,
    isFetchingNextPage: isFetchingNextPageActivities,
    fetchNextPage,
    hasNextPage,
  } = activityFeedQuery

  const activities = useMemo(() => data?.pages?.flat() || [], [data?.pages])

  const listData = useMemo(() => {
    const items: ListItem[] = []
    if (!activities.length) return items

    const groups = activities.reduce<Record<string, Activity[]>>((acc, activity) => {
      const isToday = activity.created_at.toDateString() === new Date().toDateString()
      const dateKey = isToday
        ? 'Today'
        : activity.created_at.toLocaleDateString(undefined, { day: 'numeric', month: 'long' })
      if (!acc[dateKey]) acc[dateKey] = []
      acc[dateKey].push(activity)
      return acc
    }, {})

    Object.entries(groups).forEach(([title, group], sectionIndex) => {
      items.push({ type: 'date-separator', title, first: sectionIndex === 0 })
      group.forEach((a, idx) =>
        items.push({
          type: 'activity',
          data: a,
          isFirstInGroup: idx === 0,
          isLastInGroup: idx === group.length - 1,
        })
      )
    })

    return items
  }, [activities])

  const dataProvider = useMemo(
    () =>
      dataProviderMakerWeb(listData, {
        getStableId: (index) => {
          const item = listData[index]
          if (!item) return `${index}`
          if (item.type === 'date-separator') return `ds-${index}-${item.title}`
          if (item.type === 'activity') {
            const a = item.data
            return `a-${index}-evt:${a.event_name}-ts:${a.created_at}-${a?.from_user?.id ?? ''}-${a?.to_user?.id ?? ''}`
          }
          return `${index}`
        },
      }),
    [listData]
  )

  const layoutProvider = useMemo(
    () =>
      layoutProviderMakerWeb({
        getLayoutType: (index) => listData[index]?.type || 'activity',
        getHeightOrWidth: (index) => {
          const item = listData[index]
          switch (item?.type) {
            case 'date-separator':
              return 40
            default:
              return 132
          }
        },
      }),
    [listData]
  )

  const rowRenderer = useCallback(
    (type: string | number, item: ListItem) => {
      if (item.type === 'date-separator') {
        return <RowLabel first={item.first}>{item.title}</RowLabel>
      }
      if (item.type === 'activity') {
        return (
          <YStack
            bc="$color1"
            px="$2"
            $gtLg={{ px: '$3.5' }}
            {...(item.isFirstInGroup && {
              pt: '$2',
              $gtLg: { pt: '$3.5', px: '$3.5' },
              borderTopLeftRadius: '$4',
              borderTopRightRadius: '$4',
            })}
            {...(item.isLastInGroup && {
              pb: '$2',
              $gtLg: { pb: '$3.5', px: '$3.5' },
              borderBottomLeftRadius: '$4',
              borderBottomRightRadius: '$4',
            })}
          >
            <TokenActivityRow activity={item.data} onPress={onActivityPress} />
          </YStack>
        )
      }
      return null
    },
    [onActivityPress]
  )

  const handleEndReached = useCallback(() => {
    console.log('handleEndReached', hasNextPage, isFetchingNextPageActivities, isAtEnd)
    if (hasNextPage && !isFetchingNextPageActivities && isAtEnd) {
      void fetchNextPage()
    }
  }, [hasNextPage, isFetchingNextPageActivities, fetchNextPage, isAtEnd])

  const renderFooter = useCallback(() => {
    if (!isLoadingActivities && isFetchingNextPageActivities) {
      return <Spinner size="small" />
    }
    return null
  }, [isLoadingActivities, isFetchingNextPageActivities])

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

  if (!listData.length) {
    return <RowLabel>No activities</RowLabel>
  }

  return (
    <View f={1} ai="stretch" jc="space-between">
      {listData.length > 0 ? (
        <RecyclerListView
          style={{ flex: 1 }}
          dataProvider={dataProvider}
          layoutProvider={layoutProvider}
          rowRenderer={rowRenderer}
          renderFooter={renderFooter}
          onEndReached={handleEndReached}
          renderAheadOffset={0}
        />
      ) : null}
    </View>
  )
}

function RowLabel({ children, first }: PropsWithChildren & { first?: boolean }) {
  return (
    <H4 fontWeight={'600'} size={'$7'} pt={first ? 0 : '$3.5'} pb="$3.5" bc="$background">
      {children}
    </H4>
  )
}
