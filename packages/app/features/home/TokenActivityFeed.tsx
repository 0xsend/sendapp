import {
  Card,
  type CardProps,
  Spinner,
  useMedia,
  dataProviderMakerWeb,
  layoutProviderMakerWeb,
} from '@my/ui'
import type { PostgrestError } from '@supabase/postgrest-js'
import type { InfiniteData, UseInfiniteQueryResult } from '@tanstack/react-query'
import { useQueryClient } from '@tanstack/react-query'
import { useScrollDirection } from 'app/provider/scroll/ScrollDirectionContext'
import type { Activity } from 'app/utils/zod/activity'
import { isTemporalSendEarnDepositEvent } from 'app/utils/zod/activity'
import { Events } from 'app/utils/zod/activity/events'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ZodError } from 'zod'
import { TokenActivityRow } from './TokenActivityRow'
import { useRootScreenParams } from 'app/routers/params'
import { RecyclerListView, type Dimension } from 'recyclerlistview/web'
import type { CoinWithBalance } from 'app/data/coins'

export default function TokenActivityFeed({
  tokenActivityFeedQuery,
  onActivityPress,
  ...props
}: {
  tokenActivityFeedQuery: UseInfiniteQueryResult<
    InfiniteData<Activity[]>,
    PostgrestError | ZodError
  >
  onActivityPress: (activity: Activity) => void
  coin?: CoinWithBalance
} & CardProps) {
  const [layoutSize, setLayoutSize] = useState<Dimension>({ width: 0, height: 0 })
  const media = useMedia()
  const { isAtEnd } = useScrollDirection()
  const queryClient = useQueryClient()
  const wasPendingRef = useRef(false) // Ref to track if a pending activity was seen previously
  const [queryParams] = useRootScreenParams()

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

  const dataProvider = useMemo(
    () =>
      dataProviderMakerWeb(activities, {
        getStableId: (index) => {
          const a = activities[index]
          return a
            ? `${index}-evt:${a.event_name}-ts:${a.created_at}-${a?.from_user?.id ?? ''}-${a?.to_user?.id ?? ''}`
            : `${index}`
        },
      }),
    [activities]
  )

  const _layoutProvider = layoutProviderMakerWeb({
    getHeightOrWidth: () => 102,
  })

  const _renderRow = useCallback(
    (type, activity: Activity) => {
      return <TokenActivityRow activity={activity} onPress={onActivityPress} />
    },
    [onActivityPress]
  )

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPageActivities) {
      void fetchNextPage()
    }
  }, [hasNextPage, isFetchingNextPageActivities, fetchNextPage])

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
    if (isAtEnd) {
      handleEndReached()
    }
  }, [isAtEnd, handleEndReached])

  if (activities.length === 0) {
    return null
  }

  return (
    <Card {...props} f={1} onLayout={onCardLayout}>
      {dataProvider.getSize() > 0 && layoutSize.height > 0 ? (
        <RecyclerListView
          style={{ flex: 1 }}
          dataProvider={dataProvider}
          rowRenderer={_renderRow}
          layoutProvider={_layoutProvider}
          renderFooter={renderFooter}
          // Need this for SSR
          layoutSize={{ width: layoutSize.width - layoutSizeAdjustment, height: layoutSize.height }}
          onEndReached={handleEndReached}
          onEndReachedThreshold={1000}
          renderAheadOffset={2000}
          canChangeSize
        />
      ) : null}
    </Card>
  )
}
