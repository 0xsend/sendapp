import { Card, type CardProps, Fade, Paragraph, Spinner, YStack } from '@my/ui'
import type { PostgrestError } from '@supabase/postgrest-js'
import type { InfiniteData, UseInfiniteQueryResult } from '@tanstack/react-query'
import { useQueryClient } from '@tanstack/react-query'
import { useScrollDirection } from 'app/provider/scroll/ScrollDirectionContext'
import { useRootScreenParams } from 'app/routers/params'
import type { Activity } from 'app/utils/zod/activity'
import { isTemporalSendEarnDepositEvent } from 'app/utils/zod/activity'
import { Events } from 'app/utils/zod/activity/events'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { FlatList } from 'react-native'
import type { ZodError } from 'zod'
import { TokenActivityRow } from './TokenActivityRow'

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
  const queryClient = useQueryClient()
  const wasPendingRef = useRef(false) // Ref to track if a pending activity was seen previously
  const [queryParams] = useRootScreenParams()

  const {
    data,
    isLoading: isLoadingActivities,
    isFetchingNextPage: isFetchingNextPageActivities,
    fetchNextPage,
    hasNextPage,
    refetch,
  } = tokenActivityFeedQuery

  const activities = useMemo(() => data?.pages?.flat() || [], [data])

  // Handle pagination
  useEffect(() => {
    if (isAtEnd && hasNextPage && !isFetchingNextPageActivities) {
      fetchNextPage()
    }
  }, [isAtEnd, hasNextPage, fetchNextPage, isFetchingNextPageActivities])

  // Monitor for pending activities that become confirmed
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

  // Optimize rendering for FlatList
  const renderItem = useCallback(
    ({ item: activity }) => <TokenActivityRow activity={activity} onPress={onActivityPress} />,
    [onActivityPress]
  )

  const keyExtractor = useCallback(
    (activity: Activity) =>
      `${activity.event_name}-${activity.created_at}-${activity?.from_user?.id}-${activity?.to_user?.id}`,
    []
  )

  const renderFooter = useCallback(() => {
    if (!isLoadingActivities && isFetchingNextPageActivities) {
      return <Spinner size="small" color={'$color12'} mb="$3.5" />
    }
    return null
  }, [isLoadingActivities, isFetchingNextPageActivities])

  const onRefresh = useCallback(() => {
    refetch()
  }, [refetch])

  // Show empty state when there are no activities
  if (!activities.length) {
    return (
      <Card {...props} f={1} jc="center" ai="center" p="$4">
        <YStack ai="center" gap="$2" p="$4">
          <Paragraph color="$color10" ta="center">
            No activity to display yet.
          </Paragraph>
        </YStack>
      </Card>
    )
  }

  return (
    <Card {...props} f={1}>
      <Fade>
        <FlatList
          style={{ flex: 1 }}
          data={activities}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          ListFooterComponent={renderFooter}
          showsVerticalScrollIndicator={false}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
          removeClippedSubviews={true}
          refreshing={isLoadingActivities && !isFetchingNextPageActivities}
          onRefresh={onRefresh}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      </Fade>
    </Card>
  )
}
