import { Card, type CardProps, Spinner, RecyclerList } from '@my/ui'
import {
  layoutProviderMaker,
  dataProviderMaker,
  type Dimension,
} from '@my/ui/src/components/RecyclerList.web'
import type { Activity } from 'app/utils/zod/activity'
import { useCallback, useEffect, useMemo, useState } from 'react'
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
  const { isAtEnd } = useScrollDirection()
  const [layoutSize, setLayoutSize] = useState<Dimension>({ width: 0, height: 0 })

  const {
    data,
    isLoading: isLoadingActivities,
    isFetchingNextPage: isFetchingNextPageActivities,
    fetchNextPage,
    hasNextPage,
  } = tokenActivityFeedQuery

  const activities = useMemo(() => data?.pages.flat() || [], [data])

  const [dataProvider, setDataProvider] = useState(dataProviderMaker(activities))

  const _layoutProvider = layoutProviderMaker({
    getHeightOrWidth: () => 100,
  })

  const _renderRow = useCallback(
    (type, activity: Activity) => {
      return (
        <TokenActivityRow
          key={`${activity.event_name}-${activity.created_at.getTime()}`}
          activity={activity}
          onPress={onActivityPress}
        />
      )
    },
    [onActivityPress]
  )

  const renderFooter = () => {
    if (!isLoadingActivities && isFetchingNextPageActivities) {
      return <Spinner size="small" color={'$color12'} mb="$3.5" />
    }
    return <Spinner opacity={0} mb="$3.5" />
  }

  const onCardLayout = useCallback((e) => {
    setLayoutSize({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height })
  }, [])

  useEffect(() => {
    setDataProvider((prev) => prev.cloneWithRows(activities))
  }, [activities])

  useEffect(() => {
    if (isAtEnd && hasNextPage && !isFetchingNextPageActivities) {
      fetchNextPage().then(({ data }) => {
        const activities = data?.pages.flat() || []
        setDataProvider((prev) => prev.cloneWithRows(activities))
      })
    }
  }, [isAtEnd, hasNextPage, fetchNextPage, isFetchingNextPageActivities])

  if (activities.length === 0) {
    return null
  }

  return (
    <Card {...props} f={1} onLayout={onCardLayout}>
      {dataProvider.getSize() > 0 && layoutSize.height > 0 ? (
        <RecyclerList
          style={{ flex: 1 }}
          dataProvider={dataProvider}
          rowRenderer={_renderRow}
          layoutProvider={_layoutProvider}
          renderFooter={renderFooter}
          // Need this for SSR
          layoutSize={{ width: layoutSize.width - 32, height: layoutSize.height }}
          // Need this so it rerenders when layout changes
          key={`recycler-${layoutSize.width}-${layoutSize.height}`}
        />
      ) : null}
    </Card>
  )
}
