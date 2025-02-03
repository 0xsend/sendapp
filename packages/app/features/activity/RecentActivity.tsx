import { Button, Fade, H4, Paragraph, ScrollView, Spinner, XStack, YGroup, YStack } from '@my/ui'
import { useActivityFeed } from './utils/useActivityFeed'
import type { PostgrestError } from '@supabase/postgrest-js'
import type { InfiniteData, UseInfiniteQueryResult } from '@tanstack/react-query'
import type { ZodError } from 'zod'
import type { Activity } from 'app/utils/zod/activity'
import { TokenActivityRow } from 'app/features/home/TokenActivityRow'
import { type PropsWithChildren, useState } from 'react'
import { ActivityDetails } from 'app/features/activity/ActivityDetails'

export function RecentActivity() {
  const result = useActivityFeed()
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null)

  const handleActivityPress = (activity: Activity) => {
    setSelectedActivity(activity)
  }

  const handleCloseActivityDetails = () => {
    setSelectedActivity(null)
  }

  return (
    <XStack w={'100%'} height={0} gap={'$5'} f={1}>
      <ScrollView
        testID={'RecentActivity'}
        showsVerticalScrollIndicator={false}
        display={selectedActivity ? 'none' : 'flex'}
        $gtLg={{
          display: 'flex',
          maxWidth: '50%',
        }}
      >
        <ActivityFeed activityFeedQuery={result} onActivityPress={handleActivityPress} />
      </ScrollView>
      {selectedActivity && (
        <ActivityDetails
          activity={selectedActivity}
          onClose={handleCloseActivityDetails}
          w={'100%'}
          $gtLg={{
            maxWidth: '47%',
          }}
        />
      )}
    </XStack>
  )
}

function ActivityFeed({
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
              <YStack key={date} gap={'$3.5'}>
                <RowLabel>{date}</RowLabel>
                <Fade>
                  <YGroup bc={'$color1'} p={'$2'} $gtLg={{ p: '$3.5' }}>
                    {activities.map((activity) => (
                      <YGroup.Item
                        key={`${activity.event_name}-${activity.created_at}-${activity?.from_user?.id}-${activity?.to_user?.id}`}
                      >
                        <TokenActivityRow activity={activity} onPress={onActivityPress} />
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

function RowLabel({ children }: PropsWithChildren) {
  return (
    <H4 fontWeight={'600'} size={'$7'}>
      {children}
    </H4>
  )
}
