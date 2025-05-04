import { Card, type CardProps, Fade, Paragraph, Spinner, YStack } from '@my/ui'
import type { PostgrestError } from '@supabase/postgrest-js'
import type { InfiniteData, UseInfiniteQueryResult } from '@tanstack/react-query'
import { useScrollDirection } from 'app/provider/scroll'
import type { Activity } from 'app/utils/zod/activity'
import { useEffect } from 'react'
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
