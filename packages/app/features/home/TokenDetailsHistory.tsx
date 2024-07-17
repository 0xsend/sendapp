import { Button, Paragraph, Spinner, YStack } from '@my/ui'
import type { coins } from 'app/data/coins'
import { hexToBytea } from 'app/utils/hexToBytea'
import { Fragment } from 'react'
import { useTokenActivityFeed } from './utils/useTokenActivityFeed'
import { RowLabel, AnimateEnter } from './TokenDetails'
import { TokenActivityRow } from './TokenActivityRow'

export const TokenDetailsHistory = ({ coin }: { coin: coins[number] }) => {
  const result = useTokenActivityFeed({
    pageSize: 10,
    address: coin.token === 'eth' ? undefined : hexToBytea(coin.token),
  })
  const {
    data,
    isLoading: isLoadingActivities,
    error: activitiesError,
    isFetching: isFetchingActivities,
    isFetchingNextPage: isFetchingNextPageActivities,
    fetchNextPage,
    hasNextPage,
  } = result
  const { pages } = data ?? {}
  return (
    <YStack gap="$5" testID="TokenDetailsHistory">
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
            let lastDate: string | undefined
            return pages?.map((activities) => {
              return activities.map((activity) => {
                const date = activity.created_at.toLocaleDateString()
                const isNewDate = !lastDate || date !== lastDate
                if (isNewDate) {
                  lastDate = date
                }
                return (
                  <Fragment
                    key={`${activity.event_name}-${activity.created_at}-${activity?.from_user?.id}-${activity?.to_user?.id}`}
                  >
                    {isNewDate ? <RowLabel>{lastDate}</RowLabel> : null}
                    <AnimateEnter>
                      <TokenActivityRow activity={activity} />
                    </AnimateEnter>
                  </Fragment>
                )
              })
            })
          }
        }
      })()}
      <AnimateEnter>
        {!isLoadingActivities && (isFetchingNextPageActivities || hasNextPage) ? (
          <>
            {isFetchingNextPageActivities && <Spinner size="small" />}
            {hasNextPage && (
              <Button
                onPress={() => {
                  fetchNextPage()
                }}
                disabled={isFetchingNextPageActivities || isFetchingActivities}
                color="$color"
                width={200}
                mx="auto"
                mb="$6"
              >
                Load More
              </Button>
            )}
          </>
        ) : null}
      </AnimateEnter>
    </YStack>
  )
}
