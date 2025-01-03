import { Button, Fade, Paragraph, Spinner, YGroup, YStack } from '@my/ui'
import { useActivityFeed } from './utils/useActivityFeed'
import { RowLabel } from './screen'
import type { PostgrestError } from '@supabase/postgrest-js'
import type { InfiniteData, UseInfiniteQueryResult } from '@tanstack/react-query'
import type { ZodError } from 'zod'
import type { Activity } from 'app/utils/zod/activity'
import { TokenActivityRow } from 'app/features/home/TokenActivityRow'

export function RecentActivity() {
  const result = useActivityFeed()
  return (
    <YStack
      gap="$5"
      testID={'RecentActivity'}
      $gtLg={{
        maxWidth: '50%',
      }}
    >
      <ActivityFeed {...result} />
    </YStack>
  )
}

function ActivityFeed(
  activityFeedQuery: UseInfiniteQueryResult<InfiniteData<Activity[]>, PostgrestError | ZodError>
) {
  const {
    data,
    isLoading: isLoadingActivities,
    error: activitiesError,
    isFetching: isFetchingActivities,
    isFetchingNextPage: isFetchingNextPageActivities,
    fetchNextPage,
    hasNextPage,
  } = activityFeedQuery

  const { pages } = data ?? {}

  return (
    <YStack gap="$5">
      {(() => {
        switch (true) {
          case isLoadingActivities:
            return <Spinner size="small" />
          case activitiesError !== null:
            return (
              <Paragraph maxWidth={'600'} fontFamily={'$mono'} fontSize={'$5'} color={'$color12'}>
                {activitiesError?.message.split('.').at(0) ?? `${activitiesError}`}
              </Paragraph>
            )
          case pages?.length === 0:
            return (
              <>
                <RowLabel>No activities</RowLabel>
              </>
            )
          default: {
            const groups = (pages || [])
              .flatMap((activity) => activity)
              .reduce<Record<string, Activity[]>>((acc, activity) => {
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

            return Object.entries(groups).map(([date, activities]) => (
              <YStack key={date} gap={'$3'}>
                <RowLabel>{date}</RowLabel>
                <Fade>
                  <YGroup bc={'$color1'} p={'$4.5'} gap={'$4'}>
                    {activities.map((activity) => (
                      <YGroup.Item
                        key={`${activity.event_name}-${activity.created_at}-${activity?.from_user?.id}-${activity?.to_user?.id}`}
                      >
                        <TokenActivityRow activity={activity} />
                      </YGroup.Item>
                    ))}
                  </YGroup>
                </Fade>
              </YStack>
            ))
          }
        }
      })()}
      <Fade>
        {!isLoadingActivities && (isFetchingNextPageActivities || hasNextPage) ? (
          <>
            {isFetchingNextPageActivities && <Spinner size="small" />}
            {hasNextPage && (
              <Button
                onPress={() => {
                  fetchNextPage()
                }}
                disabled={isFetchingNextPageActivities || isFetchingActivities}
                color="$color10"
                width={200}
                mx="auto"
                mt={'$3'}
              >
                Load More
              </Button>
            )}
          </>
        ) : null}
      </Fade>
    </YStack>
  )
}
