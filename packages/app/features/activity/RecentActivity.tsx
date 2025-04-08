import { H4, Paragraph, Spinner, XStack, YStack } from '@my/ui'
import { useActivityFeed } from './utils/useActivityFeed'
import type { PostgrestError } from '@supabase/postgrest-js'
import type { InfiniteData, UseInfiniteQueryResult } from '@tanstack/react-query'
import type { ZodError } from 'zod'
import type { Activity } from 'app/utils/zod/activity'
import { TokenActivityRow } from 'app/features/home/TokenActivityRow'
import { type PropsWithChildren, useState, useMemo } from 'react'
import { ActivityDetails } from 'app/features/activity/ActivityDetails'
import { SectionList } from 'react-native'

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
      <YStack
        f={1}
        display={selectedActivity ? 'none' : 'flex'}
        $gtLg={{
          display: 'flex',
          maxWidth: '50%',
        }}
      >
        <ActivityFeed activityFeedQuery={result} onActivityPress={handleActivityPress} />
      </YStack>
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
    isFetchingNextPage: isFetchingNextPageActivities,
    fetchNextPage,
    hasNextPage,
  } = activityFeedQuery

  const sections = useMemo(() => {
    if (!data?.pages) return []

    const activities = data.pages.flat()
    const groups = activities.reduce<Record<string, Activity[]>>((acc, activity) => {
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

    return Object.entries(groups).map(([title, data], index) => ({
      title,
      data,
      index,
    }))
  }, [data?.pages])

  if (isLoadingActivities) {
    return <Spinner size="small" />
  }

  if (activitiesError) {
    return (
      <Paragraph maxWidth={'600'} fontFamily={'$mono'} fontSize={'$5'} color={'$color12'}>
        {activitiesError?.message.split('.').at(0) ?? `${activitiesError}`}
      </Paragraph>
    )
  }

  if (!sections.length) {
    return <RowLabel>No activities</RowLabel>
  }

  return (
    <SectionList
      sections={sections}
      testID={'RecentActivity'}
      showsVerticalScrollIndicator={false}
      keyExtractor={(activity) =>
        `${activity.event_name}-${activity.created_at}-${activity?.from_user?.id}-${activity?.to_user?.id}`
      }
      renderItem={({ item: activity, index, section }) => (
        <YStack
          bc="$color1"
          px="$2"
          $gtLg={{
            px: '$3.5',
          }}
          {...(index === 0 && {
            pt: '$2',
            $gtLg: {
              pt: '$3.5',
              px: '$3.5',
            },
            borderTopLeftRadius: '$4',
            borderTopRightRadius: '$4',
          })}
          {...(index === section.data.length - 1 && {
            pb: '$2',
            $gtLg: {
              pb: '$3.5',
              px: '$3.5',
            },
            borderBottomLeftRadius: '$4',
            borderBottomRightRadius: '$4',
          })}
        >
          <TokenActivityRow activity={activity} onPress={onActivityPress} />
        </YStack>
      )}
      renderSectionHeader={({ section: { title, index } }) => (
        <RowLabel first={index === 0}>{title}</RowLabel>
      )}
      onEndReached={() => hasNextPage && fetchNextPage()}
      ListFooterComponent={
        !isLoadingActivities && isFetchingNextPageActivities ? <Spinner size="small" /> : null
      }
      stickySectionHeadersEnabled={true}
    />
  )
}

function RowLabel({ children, first }: PropsWithChildren & { first?: boolean }) {
  return (
    <H4 fontWeight={'600'} size={'$7'} pt={first ? 0 : '$3.5'} pb="$3.5" bc="$background">
      {children}
    </H4>
  )
}
