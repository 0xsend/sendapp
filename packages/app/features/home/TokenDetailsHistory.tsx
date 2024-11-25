import { Button, Card, Label, Paragraph, Spinner, YStack } from '@my/ui'
import type { coins } from 'app/data/coins'
import { Fragment, useEffect, useState } from 'react'
import { useTokenActivityFeed } from './utils/useTokenActivityFeed'
import { RowLabel, AnimateEnter } from './TokenDetails'
import { PendingTransferActivityRow, TokenActivityRow } from './TokenActivityRow'
import { useSendAccount } from 'app/utils/send-accounts'
import { zeroAddress } from 'viem'
import type { Events } from 'app/utils/zod/activity'

type BaseActivity = {
  created_at: Date
  event_name: string
  from_user: {
    id: string | null
    tags: string[] | null
    name: string | null
    avatar_url: string | null
    send_id: number
  } | null
  to_user: {
    id: string | null
    tags: string[] | null
    name: string | null
    avatar_url: string | null
    send_id: number
  } | null
}

type ActivityFeedItem = BaseActivity & {
  data?: {
    coin?: {
      readonly label: string
      readonly symbol: string
      readonly token: string
      readonly decimals: number
      readonly coingeckoTokenId: string
    }
    block_num?: bigint
    log_addr?: `0x${string}`
    log_idx?: bigint
    tx_hash?: `0x${string}`
    tx_idx?: bigint
    f?: `0x${string}`
    t?: `0x${string}`
    v?: bigint
    value?: bigint
    tags?: string[]
    sender?: `0x${string}`
  }
}

export const TokenDetailsHistory = ({ coin }: { coin: coins[number] }) => {
  const { data: sendAccount } = useSendAccount()
  const [hasPendingTransfers, setHasPendingTransfers] = useState<boolean | undefined>(true)
  const { pendingTransfers, activityFeed } = useTokenActivityFeed({
    address: sendAccount?.address ?? zeroAddress,
    token: coin.token,
    pageSize: 10,
    refetchInterval: 1000,
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

  const { pages } = activityFeedData ?? {}
  if (isLoadingActivities) return <Spinner size="small" />
  return (
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
            case pages?.length === 0:
              return <RowLabel>No activities</RowLabel>
            case !pages || !pages[0]?.length:
              return null
            default: {
              let lastDate: string | undefined
              return (
                <Card gap="$5" testID="TokenDetailsHistory" p="$5">
                  {pages?.map((activities: ActivityFeedItem[]) => {
                    return activities.map((activity: ActivityFeedItem) => {
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
                          <Spinner size="small" color={'$color12'} />
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
                            mb="$6"
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
    </YStack>
  )
}
