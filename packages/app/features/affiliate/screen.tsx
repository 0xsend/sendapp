import {
  AnimatePresence,
  Button,
  Card,
  CardHeader,
  H3,
  Label,
  LinkableButton,
  Paragraph,
  Spinner,
  Stack,
  XStack,
  YStack,
} from '@my/ui'

import { useAffiliateReferrals } from './utils/useAffiliateReferrals'

import { Fragment } from 'react'

import formatAmount from 'app/utils/formatAmount'
import { useAffiliateStats } from './utils/useAffiliateStats'

export const AffiliateScreen = () => {
  return (
    <YStack f={1} width={'100%'} gap="$4">
      <XStack alignItems="center" width={'100%'} jc="flex-end" gap="$6">
        <LinkableButton href="/leaderboard" fontWeight={'bold'}>
          Check Leaderboard
        </LinkableButton>
      </XStack>
      <StatsCards />
      <ReferralsList />
    </YStack>
  )
}

const StatsCards = () => {
  const { data: affiliateStats, isLoading, error: affiliateStatsError } = useAffiliateStats()

  return (
    <>
      <Stack
        fd="column"
        $gtLg={{ fd: 'row' }}
        flexWrap="wrap"
        ai="flex-start"
        jc="space-around"
        gap="$3"
        mb="$4"
        width={'100%'}
      >
        <Card $gtLg={{ flexShrink: 0, flexBasis: '32%' }} w="100%" mih={152}>
          <CardHeader>
            <Label color={'$color10'}>Total Referrals</Label>
          </CardHeader>
          {isLoading ? (
            <Spinner alignSelf="flex-start" size="large" color="$color12" mt="auto" p="$4" />
          ) : (
            <>
              <Paragraph pl="$4" pb="$3" fontWeight="600" size={'$12'} lineHeight={'$10'}>
                {affiliateStats?.referral_count || 0}
              </Paragraph>
            </>
          )}
        </Card>
        <Card $gtLg={{ flexShrink: 0, flexBasis: '32%' }} w="100%" mih={152}>
          <CardHeader>
            <Label color={'$color10'}>Affiliate Send Score</Label>
          </CardHeader>
          {isLoading ? (
            <Spinner alignSelf="flex-start" size="large" color="$color12" mt="auto" p="$4" />
          ) : (
            <>
              <Paragraph pl="$4" pb="$3" fontWeight="600" size={'$12'} lineHeight={'$10'}>
                {formatAmount(affiliateStats?.affiliate_send_score || 0, 10)}
              </Paragraph>
            </>
          )}
        </Card>
        <Card $gtLg={{ flexShrink: 0, flexBasis: '32%' }} w="100%" mih={152}>
          <CardHeader>
            <Label color={'$color10'}>Affiliate Network +/-</Label>
          </CardHeader>
          {isLoading ? (
            <Spinner alignSelf="flex-start" size="large" color="$color12" mt="auto" p="$4" />
          ) : (
            <>
              <Paragraph pl="$4" pb="$3" fontWeight="600" size={'$12'} lineHeight={'$10'}>
                {affiliateStats?.send_plus_minus || 0}
              </Paragraph>
            </>
          )}
        </Card>
      </Stack>
      {affiliateStatsError && (
        <Paragraph theme={'red_active'}>{affiliateStatsError?.message}</Paragraph>
      )}
    </>
  )
}

const ReferralsList = () => {
  const pageSize = 10
  const result = useAffiliateReferrals({
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
              return pages?.map((referrals) => {
                return referrals?.map(({ referral }) => {
                  return (
                    <Fragment key={`${referral.referred_id}-${referral.tag}`}>
                      <AnimateEnter>
                        <XStack gap="$1" ai="center">
                          <Paragraph w="12%" f={1} mb="0" size="$5" lineHeight="$4" ta="center">
                            /{referral.tag}
                          </Paragraph>
                          <XStack f={1} ai="center" w="12%" jc="center" mb="0" gap="$2">
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

const ReferralsListRow = () => {
  return <YStack f={1} width={'100%'} space="$4" />
}

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
