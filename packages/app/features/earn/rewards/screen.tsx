import {
  Button,
  Card,
  Fade,
  Paragraph,
  ScrollView,
  Separator,
  Spinner,
  XStack,
  YGroup,
  YStack,
} from '@my/ui'
import { SectionButton } from 'app/features/earn/components/SectionButton'
import { useRouter } from 'solito/router'
import { IconCoin } from 'app/components/icons/IconCoin'
import { TokenDetailsMarketData } from 'app/features/home/TokenDetails'
import { sendCoin } from 'app/data/coins'
import { TokenActivityRow } from 'app/features/home/TokenActivityRow'
import { useActivityFeed } from 'app/features/activity/utils/useActivityFeed'

export const RewardsBalance = () => {
  const { push } = useRouter()

  // TODO loader when deposit balances are loading
  // if (false) {
  //   return <Spinner size="large" color={'$color12'} />
  // }

  const handleClaimPress = () => {
    // TODO plug claim rewards logic

    push('/earn')
  }

  return (
    <YStack w={'100%'} gap={'$4'} pb={'$3'} $gtLg={{ w: '50%' }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <YStack gap={'$4'}>
          <TotalRewards />
          <Paragraph size={'$7'} fontWeight={'500'}>
            Rewards History
          </Paragraph>
          <RewardsFeed />
        </YStack>
      </ScrollView>
      <SectionButton text={'CLAIM REWARDS'} onPress={handleClaimPress} />
    </YStack>
  )
}

// TODO fetch activities that are rewards related, here are all ATM
// TODO add support for activity row and details for rewqrds related activities
const RewardsFeed = () => {
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
    <>
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
                <Paragraph fontSize={'$5'}>No rewards activities</Paragraph>
              </>
            )
          default: {
            const activities = (pages || []).flat()

            return (
              <Fade>
                <YGroup bc={'$color1'} p={'$2'} $gtLg={{ p: '$3.5' }}>
                  {activities.map((activity) => (
                    <YGroup.Item key={`${activity.event_name}-${activity.created_at}`}>
                      <TokenActivityRow activity={activity} />
                    </YGroup.Item>
                  ))}
                </YGroup>
              </Fade>
            )
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
                  void fetchNextPage()
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
    </>
  )
}

// TODO plug read total rewards value
const TotalRewards = () => {
  const totalValue = '15,000'

  return (
    <Fade>
      <Card w={'100%'} p={'$5'} gap={'$7'} $gtLg={{ p: '$7' }}>
        <YStack gap={'$4'}>
          <XStack ai={'center'} gap={'$2'}>
            <IconCoin symbol={'SEND'} size={'$2'} />
            <Paragraph size={'$7'}>SEND</Paragraph>
          </XStack>
          <YStack gap={'$2'}>
            <Paragraph
              fontWeight={'500'}
              size={(() => {
                switch (true) {
                  case totalValue.length > 16:
                    return '$9'
                  default:
                    return '$11'
                }
              })()}
              $gtLg={{
                size: (() => {
                  switch (true) {
                    case totalValue.length > 16:
                      return '$9'
                    case totalValue.length > 8:
                      return '$10'
                    default:
                      return '$11'
                  }
                })(),
              }}
            >
              {totalValue}
            </Paragraph>
          </YStack>
          <Separator boc={'$silverChalice'} $theme-light={{ boc: '$darkGrayTextField' }} />
          <TokenDetailsMarketData coin={sendCoin} />
        </YStack>
      </Card>
    </Fade>
  )
}
