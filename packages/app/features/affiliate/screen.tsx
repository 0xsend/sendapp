import {
  AnimatePresence,
  Button,
  Card,
  CardHeader,
  H3,
  H5,
  Label,
  LinkableButton,
  Paragraph,
  Spinner,
  Stack,
  XStack,
  YStack,
} from '@my/ui'
import { IconSendToken } from 'app/components/icons'
import { useReferrals } from './utils/useReferrals'
import { Fragment } from 'react'
import { api } from 'app/utils/api'

const pageDescription =
  'View your network, track your transactions, and see your referrals activity.'
export const AffiliateScreen = () => {
  return (
    <YStack f={1} width={'100%'} gap="$4">
      <XStack alignItems="center" width={'100%'} jc="space-between" gap="$6">
        <H3 fontWeight={'bold'} col="$color10">
          Affiliate
        </H3>
        <LinkableButton href="/leaderboard" fontWeight={'bold'}>
          Check Leaderboard
        </LinkableButton>
      </XStack>
      <Paragraph py={'$2'} size={'$4'}>
        {pageDescription}
      </Paragraph>
      <StatsCards />
      <ReferralsList />
    </YStack>
  )
}

const StatsCards = () => {
  const {
    data: affiliateStats,
    isLoading,
    error: affiliateStatsError,
  } = api.affiliate.getStats.useQuery()

  return (
    <>
      <XStack flexWrap="wrap" ai="flex-start" jc="space-around" gap="$8" mb="$4" width={'100%'}>
        <Card f={1} mih={152}>
          <CardHeader>
            <Label color={'$color10'}>Referrals</Label>
          </CardHeader>
          {isLoading ? (
            <Spinner f={1} size="small" color="$color12" m="auto" />
          ) : (
            <>
              <H5 pl="$4" pb="$3" fontWeight="600" size={'$7'}>
                {affiliateStats?.referralsCount || 0}
              </H5>
            </>
          )}
        </Card>
        <Card f={1} mih={152}>
          <CardHeader>
            <Label color={'$color10'}>Transactions</Label>
          </CardHeader>
          {isLoading ? (
            <Spinner f={1} size="small" color="$color12" m="auto" />
          ) : (
            <>
              <H5 pl="$4" pb="$3" fontWeight="600" size={'$7'}>
                {affiliateStats?.paymaster_tx_count || 0}
              </H5>
            </>
          )}
        </Card>

        <Card f={1} mih={152}>
          <CardHeader>
            <Label color={'$color10'}>Referral Transactions</Label>
          </CardHeader>
          {isLoading ? (
            <Spinner f={1} size="small" color="$color12" m="auto" />
          ) : (
            <>
              <H5 pl="$4" pb="$3" fontWeight="600" size="$7">
                {affiliateStats?.referredPaymasterTxCount || 0}
              </H5>
            </>
          )}
        </Card>
      </XStack>
      {affiliateStatsError && <Paragraph theme={'red'}>{affiliateStatsError?.message}</Paragraph>}
    </>
  )
}

const ReferralsList = () => {
  const pageSize = 10
  const result = useReferrals({
    pageSize,
  })
  const {
    data,
    isLoading: isLoadingReferrals,
    error: referralsError,
    isFetching: isFetchingReferrals,
    isFetchingNextPage: isFetchingNextPageReferrals,
    fetchNextPage,
    hasNextPage,
  } = result

  const { pages } = data ?? {}
  return (
    <YStack f={1} width={'100%'} space="$4">
      <XStack alignItems="center" width={'100%'} gap="$3">
        <H3 fontWeight={'normal'}>Referrals</H3>
      </XStack>
      <YStack f={1} width={'100%'} p="$6" bg="$background" space="$4" br="$8">
        <ReferralsHeader />
        {(() => {
          switch (true) {
            case isLoadingReferrals:
              return <Spinner size="small" />
            case referralsError !== null:
              return (
                <Paragraph maxWidth={'600'} fontFamily={'$mono'} fontSize={'$5'} color={'$color12'}>
                  {referralsError?.message.split('.').at(0) ?? `${referralsError}`}
                </Paragraph>
              )
            case pages?.length === 0:
              return (
                <>
                  <Paragraph col={'$color12'}>No referrals</Paragraph>
                </>
              )
            default: {
              return pages?.map((referrals, pageIndex) => {
                return referrals?.map((referral, index) => {
                  return (
                    <Fragment key={`${referral.referred_id}-${referral.tag}`}>
                      <AnimateEnter>
                        <XStack gap="$1" ai="center">
                          <Paragraph w="12%" mb="0" size="$5" lineHeight="$4">
                            {/* @todo we should probably index this in the db if we want it */}
                            {pageIndex * pageSize + index}{' '}
                          </Paragraph>
                          <Paragraph w="12%" f={1} mb="0" size="$5" lineHeight="$4" ta="center">
                            /{referral.tag}
                          </Paragraph>
                          <XStack f={1} ai="center" w="12%" jc="center" mb="0" gap="$2">
                            <IconSendToken />
                            <Paragraph size="$5" lineHeight="$4" ta="center">
                              ?
                            </Paragraph>
                          </XStack>
                        </XStack>
                      </AnimateEnter>
                    </Fragment>
                  )
                })
              })
            }
          }
        })()}
        <AnimateEnter>
          {!isLoadingReferrals && (isFetchingNextPageReferrals || hasNextPage) ? (
            <>
              {isFetchingNextPageReferrals && <Spinner size="small" />}
              {hasNextPage && (
                <Button
                  onPress={() => {
                    fetchNextPage()
                  }}
                  disabled={isFetchingNextPageReferrals || isFetchingReferrals}
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
    </YStack>
  )
}

const ReferralsHeader = () => (
  <XStack gap="$1" ai="center">
    <Paragraph w="12%" mb="0" size="$5" lineHeight="$4">
      #
    </Paragraph>
    <Paragraph w="12%" f={1} mb="0" size="$5" lineHeight="$4" ta="center">
      Sendtag
    </Paragraph>
    <Paragraph w="12%" f={1} mb="0" size="$5" lineHeight="$4" ta="center">
      Referred Date
    </Paragraph>
  </XStack>
)

function AnimateEnter({ children }: { children: React.ReactNode }) {
  return (
    <AnimatePresence>
      <Stack
        key="enter"
        animateOnly={['transform', 'opacity']}
        animation="200ms"
        enterStyle={{ opacity: 0, scale: 0.9 }}
        exitStyle={{ opacity: 0, scale: 0.95 }}
        opacity={1}
      >
        {children}
      </Stack>
    </AnimatePresence>
  )
}
