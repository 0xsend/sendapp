import { Button, Card, Label, Paragraph, Spinner } from '@my/ui'
import type { CoinWithBalance } from 'app/data/coins'
import { hexToBytea } from 'app/utils/hexToBytea'
import { Fragment } from 'react'
import { useTokenActivityFeed } from './utils/useTokenActivityFeed'
import { AnimateEnter } from './TokenDetails'
import { TokenActivityRow } from './TokenActivityRow'

export const TokenDetailsHistory = ({ coin }: { coin: CoinWithBalance }) => {
  const pageSize = 10
  const result = useTokenActivityFeed({
    pageSize,
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
  if (isLoadingActivities) return <Spinner size="small" />
  return (
    <>
      <Label fontSize={'$6'} fontWeight={'500'} color="$color12">
        {!pages || !pages[0]?.length ? 'No Activity' : 'Activity'}
      </Label>
      {(() => {
        switch (true) {
          case activitiesError !== null:
            return (
              <Paragraph maxWidth={'600'} fontFamily={'$mono'} fontSize={'$5'} color={'$color12'}>
                {activitiesError?.message.split('.').at(0) ?? `${activitiesError}`}
              </Paragraph>
            )
          case !pages || !pages[0]?.length:
            return null
          default: {
            let lastDate: string | undefined
            return (
              <Card testID="TokenDetailsHistory" $gtLg={{ p: '$3.5' }} bc="$color0">
                {pages?.map((activities, pageIndex) => {
                  return activities.map((activity, activityIndex) => {
                    const isFirst = pageIndex === 0 && activityIndex === 0
                    const isLastPage = pageIndex === pages.length - 1
                    const isLast = isLastPage && activityIndex === activities.length - 1
                    const date = activity.created_at.toLocaleDateString()
                    const isNewDate = !lastDate || date !== lastDate
                    if (isNewDate) {
                      lastDate = date
                    }
                    return (
                      <Fragment
                        key={`${activity.event_name}-${activity.created_at}-${activity?.from_user?.id}-${activity?.to_user?.id}`}
                      >
                        <AnimateEnter>
                          <TokenActivityRow
                            activity={activity}
                            btrr={isFirst ? '$4' : 0}
                            btlr={isFirst ? '$4' : 0}
                            bbrr={isLast ? '$4' : 0}
                            bblr={isLast ? '$4' : 0}
                          />
                        </AnimateEnter>
                      </Fragment>
                    )
                  })
                })}
                <AnimateEnter>
                  {!isLoadingActivities && (isFetchingNextPageActivities || hasNextPage) ? (
                    <>
                      {isFetchingNextPageActivities && (
                        <Spinner size="small" color={'$color12'} mb="$3.5" />
                      )}
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
        }
      })()}
    </>
  )
}
