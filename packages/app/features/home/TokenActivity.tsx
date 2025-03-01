import { Card, type CardProps, H4, Paragraph, Spinner, YStack } from '@my/ui'
import type { CoinWithBalance } from 'app/data/coins'
import { hexToBytea } from 'app/utils/hexToBytea'
import { useEffect, useState } from 'react'
import { useTokenActivityFeed } from './utils/useTokenActivityFeed'
import { TokenActivityRow } from './TokenActivityRow'
import type { Activity } from 'app/utils/zod/activity'
import { ActivityDetails } from '../activity/ActivityDetails'
import type { InfiniteData, UseInfiniteQueryResult } from '@tanstack/react-query'
import type { ZodError } from 'zod'
import type { PostgrestError } from '@supabase/postgrest-js'
import { toNiceError } from 'app/utils/toNiceError'
import { FlatList } from 'react-native-web'
import { Fade } from '@my/ui'
import { useScrollDirection } from 'app/provider/scroll'

export const TokenActivity = ({ coin }: { coin: CoinWithBalance }) => {
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null)

  const handleActivityPress = (activity: Activity) => {
    setSelectedActivity(activity)
  }
  const handleCloseActivityDetails = () => {
    setSelectedActivity(null)
  }
  const tokenActivityFeedQuery = useTokenActivityFeed({
    pageSize: 10,
    address: coin.token === 'eth' ? undefined : hexToBytea(coin.token),
  })

  const { data, isLoading, error } = tokenActivityFeedQuery
  const { pages } = data ?? {}

  if (isLoading) return <Spinner size="small" />
  return (
    <>
      {error !== null ? (
        <Paragraph maxWidth={'600'} fontFamily={'$mono'} fontSize={'$5'} color={'$color12'}>
          {toNiceError(error)}
        </Paragraph>
      ) : (
        <YStack display={selectedActivity ? 'none' : 'flex'} gap={'$3'}>
          <H4 fontWeight={'600'} size={'$7'}>
            {!pages || !pages[0]?.length ? 'No Activity' : 'Activity'}
          </H4>
          <TokenActivityFeed
            testID="TokenActivityFeed"
            tokenActivityFeedQuery={tokenActivityFeedQuery}
            onActivityPress={handleActivityPress}
            $gtLg={{
              p: '$3.5',
            }}
            p="$2"
          />
        </YStack>
      )}
      {selectedActivity && (
        <ActivityDetails activity={selectedActivity} onClose={handleCloseActivityDetails} />
      )}
    </>
  )
}

const TokenActivityFeed = ({
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
    if (isAtEnd && hasNextPage) {
      fetchNextPage()
    }
  }, [isAtEnd, hasNextPage, fetchNextPage])

  if (!activities.length) {
    return null
  }
  return (
    <Card {...props} f={1}>
      <FlatList
        style={{ flex: 1 }}
        data={activities}
        keyExtractor={(activity) =>
          `${activity.event_name}-${activity.created_at}-${activity?.from_user?.id}-${activity?.to_user?.id}`
        }
        renderItem={({ item: activity }) => (
          <Fade>
            <TokenActivityRow activity={activity} onPress={onActivityPress} />
          </Fade>
        )}
        ListFooterComponent={
          !isLoadingActivities &&
          isFetchingNextPageActivities && <Spinner size="small" color={'$color12'} mb="$3.5" />
        }
        showsVerticalScrollIndicator={false}
      />
    </Card>
  )
}
