import { Button, Card, Label, Paragraph, Spinner, YStack } from '@my/ui'
import type { CoinWithBalance } from 'app/data/coins'
import { Fragment, useEffect, useState } from 'react'
import { useTokenActivityFeed } from './utils/useTokenActivityFeed'
import { RowLabel, AnimateEnter } from './TokenDetails'
import { PendingTransferActivityRow, TokenActivityRow } from './TokenActivityRow'
import { useSendAccount } from 'app/utils/send-accounts'
import { zeroAddress } from 'viem'

export const TokenDetailsHistory = ({ coin }: { coin: CoinWithBalance }) => {
  const { data: sendAccount } = useSendAccount()
  const [hasPendingTransfers, setHasPendingTransfers] = useState<boolean | undefined>(true)
  const { pendingTransfers, activityFeed } = useTokenActivityFeed({
    address: sendAccount?.address ?? zeroAddress,
    token: coin.token,
    pageSize: 10,
    enabled:
      (hasPendingTransfers === undefined || hasPendingTransfers) &&
      sendAccount?.address !== undefined,
  })

  const { data: pendingTransfersData, isError: pendingTransfersError } = pendingTransfers

  const {
    data: activityFeedData,
    isLoading: isLoadingActivities,
    error: activitiesError,
    isFetching: isFetchingActivities,
    isFetchingNextPage: isFetchingNextPageActivities,
    fetchNextPage,
    hasNextPage,
  } = activityFeed

  const { pages } = activityFeedData ?? {}

  // Check if there are any pending transfers in the temporal db. If not set hasPendingTransfers to false to control refetches
  useEffect(() => {
    if (Array.isArray(pendingTransfersData)) {
      setHasPendingTransfers(pendingTransfersData?.length > 0)
    } else if (pendingTransfersError) {
      setHasPendingTransfers(false)
    } else {
      setHasPendingTransfers(undefined)
    }
  }, [pendingTransfersData, pendingTransfersError])

  return (
    <>
      <Label fontSize={'$6'} fontWeight={'500'} color="$color12">
        {!pages || !pages[0]?.length ? 'No Activity' : 'Activity'}
      </Label>

      <YStack gap="$5" testID="TokenDetailsHistory">
        {hasPendingTransfers && (
          <>
            <RowLabel>Pending Transfers</RowLabel>
            <AnimateEnter>
              {pendingTransfersData?.map((state) => (
                <Fragment key={`${state.userOp.nonce}-pending`}>
                  <AnimateEnter>
                    <PendingTransferActivityRow coin={coin} state={state} />
                  </AnimateEnter>
                </Fragment>
              ))}
            </AnimateEnter>
          </>
        )}

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
                <Card testID="TokenDetailsHistory" p="$2" $gtLg={{ p: '$3.5' }}>
                  {pages?.map((activities) => {
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
                          <AnimateEnter>
                            <TokenActivityRow activity={activity} />
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
      </YStack>
    </>
  )
}
