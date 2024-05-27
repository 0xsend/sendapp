import { Button, Paragraph, Spinner, XStack, YStack } from '@my/ui'
import { useActivityFeed } from './utils/useActivityFeed'
import { TableLabel, MobileSectionLabel, RowLabel, AnimateEnter } from './screen'
import { ActivityRow } from './ActivityRow'
import { Fragment } from 'react'

export function RecentActivity() {
  const {
    data,
    isLoading: isLoadingActivities,
    error: activitiesError,
    isFetching: isFetchingActivities,
    isFetchingNextPage: isFetchingNextPageActivities,
    fetchNextPage,
    hasNextPage,
  } = useActivityFeed()
  const { pages } = data ?? {}
  return (
    <YStack gap="$5" mb="$4" width={'100%'}>
      <XStack ai="center" jc="space-between" display="none" $gtMd={{ display: 'flex' }}>
        <TableLabel>Transactions</TableLabel>
        <XStack gap="$4">
          <TableLabel textAlign="right">Date</TableLabel>
          <TableLabel textAlign="right">Amount</TableLabel>
        </XStack>
      </XStack>

      <MobileSectionLabel>ACTIVITIES</MobileSectionLabel>
      {(() => {
        switch (true) {
          case isLoadingActivities:
            return <Spinner size="small" />
          case activitiesError !== null:
            return (
              <Paragraph maxWidth={'600'} fontFamily={'$mono'} fontSize={'$5'} color={'$color12'}>
                {activitiesError?.message ?? `Something went wrong: ${activitiesError}`}
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
              return activities?.map((activity) => {
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
                      <ActivityRow activity={activity} />
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
