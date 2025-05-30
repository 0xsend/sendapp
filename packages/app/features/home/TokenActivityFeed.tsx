import { Card, type CardProps, RecyclerList, Spinner, useMedia } from '@my/ui'
import {
  dataProviderMaker,
  type Dimension,
  layoutProviderMaker,
} from '@my/ui/src/components/RecyclerList.web'
import type { PostgrestError } from '@supabase/postgrest-js'
import type { InfiniteData, UseInfiniteQueryResult } from '@tanstack/react-query'
import { useQueryClient } from '@tanstack/react-query'
import { useScrollDirection } from 'app/provider/scroll'
import type { Activity } from 'app/utils/zod/activity'
import { isTemporalSendEarnDepositEvent } from 'app/utils/zod/activity'
import { Events } from 'app/utils/zod/activity/events'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ZodError } from 'zod'
import { TokenActivityRow } from './TokenActivityRow'
import { useRootScreenParams } from 'app/routers/params'
import { useTokenActivityRowSize } from 'app/features/home/utils/useTokenActivityRowSize'

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
  const media = useMedia()
  const queryClient = useQueryClient()
  const wasPendingRef = useRef(false) // Ref to track if a pending activity was seen previously
  const [queryParams] = useRootScreenParams()
  const { height: rowHeight } = useTokenActivityRowSize()

  const layoutSizeAdjustment = media.gtLg ? 32 : 14

  const {
    data,
    isLoading: isLoadingActivities,
    isFetchingNextPage: isFetchingNextPageActivities,
    fetchNextPage,
    hasNextPage,
  } = tokenActivityFeedQuery

  const activities = useMemo(() => data?.pages.flat() || [], [data])

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

  const [dataProvider, setDataProvider] = useState(dataProviderMaker(activities))

  const _layoutProvider = layoutProviderMaker({
    getHeightOrWidth: () => rowHeight,
  })

  const _renderRow = useCallback(
    (type, activity: Activity) => {
      return <TokenActivityRow activity={activity} onPress={onActivityPress} />
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
          style={{ flex: 1, overflow: 'auto' }}
          dataProvider={dataProvider}
          rowRenderer={_renderRow}
          layoutProvider={_layoutProvider}
          renderFooter={renderFooter}
          // Need this for SSR
          layoutSize={{ width: layoutSize.width - layoutSizeAdjustment, height: layoutSize.height }}
          // Need this so it rerenders when layout changes
          key={`recycler-${layoutSize.width}-${layoutSize.height}`}
        />
      ) : null}
    </Card>
  )
}
