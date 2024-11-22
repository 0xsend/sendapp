import {
  AnimatePresence,
  Avatar,
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
  Link,
} from '@my/ui'

import { useAffiliateReferrals } from './utils/useAffiliateReferrals'

import { Fragment } from 'react'

import formatAmount from 'app/utils/formatAmount'
import { useAffiliateStats } from './utils/useAffiliateStats'

export const AffiliateScreen = () => {
  return (
    <YStack width={'100%'} gap="$4" pb="$6">
      <XStack alignItems="center" width={'100%'} jc="flex-end" gap="$6">
        <LinkableButton href="/leaderboard" fontWeight={'bold'}>
          Leaderboard
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
              <Paragraph pl="$4" pb="$3" fontWeight="600" size={'$12'} lineHeight={'$11'}>
                {affiliateStats?.referral_count || 0}
              </Paragraph>
            </>
          )}
        </Card>
        {/*
        Need to rework this
        <Card $gtLg={{ flexShrink: 0, flexBasis: '32%' }} w="100%" mih={152}>
          <CardHeader>
            <Label color={'$color10'}>Network Rewards Share</Label>
          </CardHeader>
          {isLoading ? (
            <Spinner alignSelf="flex-start" size="large" color="$color12" mt="auto" p="$4" />
          ) : (
            <>
              <Paragraph pl="$4" pb="$3" fontWeight="600" size={'$12'} lineHeight={'$11'}>
                {formatAmount(affiliateStats?.affiliate_send_score || 0, 10, 0)}
              </Paragraph>
            </>
          )}
        </Card>
        <Card $gtLg={{ flexShrink: 0, flexBasis: '32%' }} w="100%" mih={152}>
          <CardHeader>
            <Label color={'$color10'}>Network +/-</Label>
          </CardHeader>
          {isLoading ? (
            <Spinner alignSelf="flex-start" size="large" color="$color12" mt="auto" p="$4" />
          ) : (
            <>
              <Paragraph pl="$4" pb="$3" fontWeight="600" size={'$12'} lineHeight={'$11'}>
                {formatAmount(affiliateStats?.network_plus_minus || 0, 10, 0)}
              </Paragraph>
            </>
          )}
        </Card> */}
      </Stack>
      {affiliateStatsError && (
        <Paragraph theme={'red_active'}>{affiliateStatsError?.message}</Paragraph>
      )}
    </>
  )
}

const ReferralsList = () => {
  const pageSize = 30
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
    <YStack space="$4">
      <XStack alignItems="center" gap="$3">
        <H3 fontWeight={'normal'}>Referrals</H3>
      </XStack>

      <Card gap="$5" p="$5" w="100%" fd="row" flexWrap="wrap">
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
                  if (!referral) return null
                  return (
                    <Fragment key={`${referral.referred_id}-${referral.tag}`}>
                      <AnimateEnter>
                        <ReferralsListRow referral={referral} />
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
                  width={200}
                  mx="auto"
                  mb="$6"
                  bc="$color3"
                >
                  Load More
                </Button>
              )}
            </>
          ) : null}
        </AnimateEnter>
      </Card>
    </YStack>
  )
}

const ReferralsListRow = ({ referral }) => {
  const date = new Date(referral?.created_at).toLocaleString(undefined, { dateStyle: 'medium' })

  return (
    <Card bc="$color0" ai="center">
      <Link
        href={`/profile/${referral.profile?.send_id}`}
        f={1}
        als="stretch"
        px="$5"
        py="$3"
        w="100%"
        h="100%"
      >
        <XStack gap="$5" f={1} ai="center" jc={'space-between'}>
          <XStack gap="$3.5" f={1} ai="center">
            <Avatar size="$4.5" br="$4" gap="$2">
              <Avatar.Image src={referral.avatar_url ?? ''} />
              <Avatar.Fallback jc="center" bc="$olive">
                <Avatar size="$4.5" br="$4">
                  <Avatar.Image
                    src={
                      'https://ui-avatars.com/api/?name=TODO&size=256&format=png&background=86ad7f'
                    }
                  />
                </Avatar>
              </Avatar.Fallback>
            </Avatar>

            <YStack>
              <XStack gap="$1.5" width={'100%'}>
                <Paragraph color="$color12" fontSize="$5">
                  /{referral.tag}
                </Paragraph>
              </XStack>

              <Stack>
                <Paragraph color="$color10" size={'$3'}>
                  {date}
                </Paragraph>
              </Stack>
            </YStack>
          </XStack>
          {/* <Stack als="flex-start">
            <Paragraph
              theme={referral.send_plus_minus >= 0 ? 'green_active' : 'red_active'}
              size={'$8'}
              lh={'$1'}
            >
              {referral.send_plus_minus >= 0 ? '+' : '-'}
            </Paragraph>
          </Stack> */}
        </XStack>
      </Link>
    </Card>
  )
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
