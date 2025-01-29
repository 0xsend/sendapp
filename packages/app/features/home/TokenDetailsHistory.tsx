import { Button, Card, type CardProps, Label, Paragraph, Spinner, YStack } from '@my/ui'
import type { CoinWithBalance } from 'app/data/coins'
import { hexToBytea } from 'app/utils/hexToBytea'
import { useState } from 'react'
import { useTokenActivityFeed } from './utils/useTokenActivityFeed'
import { AnimateEnter } from './TokenDetails'
import { TokenActivityRow } from './TokenActivityRow'
import type { Activity } from 'app/utils/zod/activity'
import type { InfiniteData, UseInfiniteQueryResult } from '@tanstack/react-query'
import type { ZodError } from 'zod'
import type { PostgrestError } from '@supabase/postgrest-js'

export const TokenActivity = ({ coin }: { coin: CoinWithBalance }) => {
  const tokenActivityFeedQuery = useTokenActivityFeed({
    pageSize: 10,
    address: coin.token === 'eth' ? undefined : hexToBytea(coin.token),
  })

  const { data, isLoading: isLoadingActivities, error: activitiesError } = tokenActivityFeedQuery

  const { pages } = data ?? {}

  if (isLoadingActivities) return <Spinner size="small" />
  return (
    <>
      {activitiesError !== null ? (
        <Paragraph maxWidth={'600'} fontFamily={'$mono'} fontSize={'$5'} color={'$color12'}>
          {activitiesError?.message.split('.').at(0) ?? `${activitiesError}`}
        </Paragraph>
      ) : (
        <YStack>
          <Label fontSize={'$6'} fontWeight={'500'} color="$color12">
            {!pages || !pages[0]?.length ? 'No Activity' : 'Activity'}
          </Label>
          <TokenActivityFeed
            testID="TokenActivityFeed"
            tokenActivityFeedQuery={tokenActivityFeedQuery}
            $gtLg={{
              p: '$3.5',
            }}
            p="$2"
          />
        </YStack>
      )}
    </>
  )
}

const TokenActivityItem = ({ activity, onActivityPress }: { activity: Activity }) => (
  <AnimateEnter>
    <TokenActivityRow activity={activity} onPress={onActivityPress} />
  </AnimateEnter>
)

const TokenActivityFeed = ({
  tokenActivityFeedQuery,
  ...props
}: {
  tokenActivityFeedQuery: UseInfiniteQueryResult<
    InfiniteData<Activity[]>,
    PostgrestError | ZodError
  >
} & CardProps) => {
  const {
    data,
    isLoading: isLoadingActivities,
    isFetching: isFetchingActivities,
    isFetchingNextPage: isFetchingNextPageActivities,
    fetchNextPage,
    hasNextPage,
  } = tokenActivityFeedQuery
  const { pages } = data ?? {}

  if (!pages || !pages[0]?.length) {
    return null
  }

  return (
    <Card {...props}>
      {pages?.map((activities) => {
        return activities.map((activity) => {
          const date = activity.created_at.toLocaleDateString()
          const isNewDate = !lastDate || date !== lastDate
          if (isNewDate) {
            lastDate = date
          }
          return (
            <TokenActivityItem
              key={`${activity.event_name}-${activity.created_at}-${activity?.from_user?.id}-${activity?.to_user?.id}`}
              activity={activity}
            />
          )
        })
      })}
      <AnimateEnter>
        {!isLoadingActivities && (isFetchingNextPageActivities || hasNextPage) ? (
          <>
            {isFetchingNextPageActivities && <Spinner size="small" color={'$color12'} mb="$3.5" />}
            {hasNextPage && (
              <Button
                onPress={() => {
                  fetchNextPage()
                }}
                disabled={isFetchingNextPageActivities || isFetchingActivities}
                color="$color0"
                width={200}
                mx="auto"
                mb="$3.5"
                bc="$color10"
              >
                Load More
              </Button>
            )}
          </>
        ) : null}
      </AnimateEnter>
    </Card>
  )
}
