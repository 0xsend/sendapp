import { Card, type CardProps, Spinner } from '@my/ui'
import type { Activity } from 'app/utils/zod/activity'
import { useEffect } from 'react'
import { TokenActivityRow } from './TokenActivityRow'
import type { InfiniteData, UseInfiniteQueryResult } from '@tanstack/react-query'
import type { ZodError } from 'zod'
import type { PostgrestError } from '@supabase/postgrest-js'
import { FlatList } from 'react-native'
import { Fade } from '@my/ui'
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

  const {
    data,
    isLoading: isLoadingActivities,
    isFetchingNextPage: isFetchingNextPageActivities,
    fetchNextPage,
    hasNextPage,
  } = tokenActivityFeedQuery
  const activities = data?.pages?.flat() || []

  useEffect(() => {
    if (isAtEnd && hasNextPage && !isFetchingNextPageActivities) {
      fetchNextPage()
    }
  }, [isAtEnd, hasNextPage, fetchNextPage, isFetchingNextPageActivities])

  if (!activities.length) {
    return null
  }
  return (
    <Card {...props} f={1}>
      <Fade>
        <FlatList
          style={{ flex: 1 }}
          data={activities}
          keyExtractor={(activity) =>
            `${activity.event_name}-${activity.created_at}-${activity?.from_user?.id}-${activity?.to_user?.id}`
          }
          renderItem={({ item: activity }) => (
            <TokenActivityRow activity={activity} onPress={onActivityPress} />
          )}
          ListFooterComponent={
            !isLoadingActivities && isFetchingNextPageActivities ? (
              <Spinner size="small" color={'$color12'} mb="$3.5" />
            ) : null
          }
          showsVerticalScrollIndicator={false}
        />
      </Fade>
    </Card>
  )
}
