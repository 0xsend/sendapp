import { Card, type CardProps, Spinner, RecyclerList, View } from '@my/ui'
import {
  layoutProviderMaker,
  dataProviderMaker,
  type Dimension,
} from '@my/ui/src/components/RecyclerList.web'
import type { Activity } from 'app/utils/zod/activity'
import { useEffect, useState, useCallback } from 'react'
import { TokenActivityRow } from './TokenActivityRow'
import type { InfiniteData, UseInfiniteQueryResult } from '@tanstack/react-query'
import type { ZodError } from 'zod'
import type { PostgrestError } from '@supabase/postgrest-js'
import { useScrollDirection } from 'app/provider/scroll'

export const TokenActivityFeed = ({
  tokenActivityFeedQuery,
  onActivityPress,
  ...props
}: {
  tokenActivityFeedQuery: UseInfiniteQueryResult<
    InfiniteData<Activity[]>,
    PostgrestError | ZodError
  >
  onActivityPress: (activity: Activity) => void
} & CardProps) => {
  const [queryParams] = useRootScreenParams()
  const { isAtEnd } = useScrollDirection()
  const [layoutSize, setLayoutSize] = useState<Dimension>({ width: 0, height: 0 })

  const {
    data,
    isLoading: isLoadingActivities,
    isFetchingNextPage: isFetchingNextPageActivities,
    fetchNextPage,
    hasNextPage,
  } = tokenActivityFeedQuery

  const activities = data?.pages.flat() || []

  const [dataProvider, setDataProvider] = useState(dataProviderMaker(activities))

  const _layoutProvider = layoutProviderMaker({
    getHeightOrWidth: () => 100,
  })

  const _renderRow = (type, activity: Activity) => {
    return (
      <TokenActivityRow
        activity={activity}
        activityIndex={activities.findIndex((a) => a.created_at === activity.created_at)}
        onPress={onActivityPress}
      />
    )
  }

  const renderFooter = () => {
    if (!isLoadingActivities && isFetchingNextPageActivities) {
      return <Spinner size="small" color={'$color12'} mb="$3.5" />
    }
    return <Spinner opacity={0} mb="$3.5" />
  }

  const onCardLayout = (e) => {
    setLayoutSize({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height })
  }

  useEffect(() => {
    if (isAtEnd && hasNextPage && !isFetchingNextPageActivities) {
      fetchNextPage().then(({ data }) => {
        const activities = data?.pages.flat() || []
        setDataProvider((prev) => prev.cloneWithRows(activities))
      })
    }
  }, [isAtEnd, hasNextPage, fetchNextPage, isFetchingNextPageActivities])

  if (!dataProvider.getSize()) {
    return null
  }

  return (
    <Card {...props} f={1} onLayout={onCardLayout}>
      <RecyclerList
        style={{ flex: 1 }}
        dataProvider={dataProvider}
        initialOffset={queryParams.activityIndex ? Number(queryParams.activityIndex) : 0}
        rowRenderer={_renderRow}
        layoutProvider={_layoutProvider}
        renderFooter={renderFooter}
        renderAheadOffset={2000}
        //set layout size for SSR
        layoutSize={{ width: layoutSize.width - 32, height: layoutSize.height }}
        key={`recycler-${layoutSize.width}-${layoutSize.height}`}
      />
    </Card>
  )
}
