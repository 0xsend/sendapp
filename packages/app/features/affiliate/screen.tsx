import { Card, CardHeader, H3, H5, LinkableButton, Paragraph, XStack, YStack } from '@my/ui'
import { IconSendToken } from 'app/components/icons'
import { useUserReferralsCount } from 'app/utils/useUserReferralsCount'
import { api } from 'app/utils/api'
import { AnimateEnter } from '../home/TokenDetails'
import type { Tables } from '@my/supabase/database-generated.types'

export const AffiliateScreen = () => {
  return (
    <YStack f={1} width={'100%'} gap="$4">
      <XStack alignItems="center" width={'100%'} jc="flex-end" gap="$6">
        <LinkableButton href="/leaderboard" fontWeight={'bold'}>
          Check Leaderboard
        </LinkableButton>
      </XStack>
      <StatsCards />
      <History />
    </YStack>
  )
}

const StatsCards = () => {
  const { data: affiliateStats, error: affiliateStatsError } = useAffiliateStats()
  const { data: referralsCount, error: referralsCountError } = useUserReferralsCount()
  return (
    <XStack flexWrap="wrap" ai="flex-start" jc="space-around" gap="$8" mb="$4" width={'100%'}>
      <Card f={1} bc={'$background'}>
        <CardHeader>
          <Paragraph>Referrals</Paragraph>
        </CardHeader>
        <H5 pl="$4" pb="$3" fontWeight="600" size={'$7'}>
          {referralsCountError ? '?' : referralsCount || 0}
        </H5>
      </Card>
      <Card f={1} bc={'$background'}>
        <CardHeader>
          <Paragraph>Transactions</Paragraph>
        </CardHeader>
        <H5 pl="$4" pb="$3" fontWeight="600" size={'$7'}>
          {affiliateStatsError ? '?' : affiliateStats?.paymaster_tx_count || 0}
        </H5>
      </Card>
      <Card f={1} bc={'$background'}>
        <CardHeader>
          <Paragraph>Referral Transactions</Paragraph>
        </CardHeader>
        <H5 pl="$4" pb="$3" fontWeight="600" size={'$7'}>
          1000
        </H5>
      </Card>
    </XStack>
  )
}

const HistoryHeader = () => (
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

const ReferralsListRow = ({ referral }: { referral: Tables<'referrals'> }) => {
  return (
    <XStack width={'100%'} ai="center" jc="space-between" gap="$4" pb="$2">
      <XStack gap="$4.5" width={'100%'} f={1}>
      <Avatar size="$4.5" br="$4" gap="$2">
      <Avatar.Image
        src={referral.avatar_url ?? ''}
      />
      <Avatar.Fallback jc="center" bc="$olive">
        <Avatar size="$4.5" br="$4">
          <Avatar.Image
            src={'https://ui-avatars.com/api/?name=TODO&size=256&format=png&background=86ad7f'}
          />
        </Avatar>
      </Avatar.Fallback>
    </Avatar>
        <YStack gap="$1.5" width={'100%'} f={1} overflow="hidden">
          <XStack fd="row" jc="space-between" gap="$1.5" f={1} width={'100%'}>
            <Text color="$color12" fontSize="$6" $gtMd={{ fontSize: '$5' }}>
              {eventName}
            </Text>
            <Text color="$color12" fontSize="$5" ta="right">
              {amount}
            </Text>
          </XStack>
          <XStack
            gap="$1.5"
            alignItems="flex-start"
            justifyContent="space-between"
            width="100%"
            overflow="hidden"
            f={1}
          >
            {(isERC20Transfer || isETHReceive) &&
            Boolean(to_user?.send_id) &&
            Boolean(from_user?.send_id) ? (
              <Link
                href={`/profile/${
                  profile?.send_id === from_user?.send_id ? to_user?.send_id : from_user?.send_id
                }`}
              >
                <Paragraph
                  color="$color10"
                  fontFamily={'$mono'}
                  maxWidth={'100%'}
                  overflow={'hidden'}
                  fontSize="$4"
                  textDecorationLine="underline"
                >
                  {subtext}
                </Paragraph>
              </Link>
            ) : (
              <Paragraph
                color="$color10"
                fontFamily={'$mono'}
                maxWidth={'100%'}
                overflow={'hidden'}
                fontSize="$4"
              >
                {subtext}
              </Paragraph>
            )}
            <Paragraph color="$color10" size={'$3'}>
              {date}
            </Paragraph>
          </XStack>
        </YStack>
      </XStack>
    </XStack>
  )

const History = () => {
  return (
    <YStack f={1} width={'100%'} space="$4">
      <XStack alignItems="center" width={'100%'} gap="$3">
        <H3 fontWeight={'normal'}>Referrals</H3>
      </XStack>
      <YStack f={1} width={'100%'} p="$6" bg="$background" space="$4" br="$8">
        <HistoryHeader />
        <HistoryData />
      </YStack>
    </YStack>
  )
}

const HistoryData = () => {
  const data = ['data1', 'data2', 'data3']
  return data?.map((key) => (
    <XStack key={key} gap="$1" ai="center">
      <Paragraph w="12%" mb="0" size="$5" lineHeight="$4">
        ?
      </Paragraph>
      <Paragraph w="12%" f={1} mb="0" size="$5" lineHeight="$4" ta="center">
        ?
      </Paragraph>
      <XStack f={1} ai="center" w="12%" jc="center" mb="0" gap="$2">
        <IconSendToken />
        <Paragraph size="$5" lineHeight="$4" ta="center">
          ?
        </Paragraph>
      </XStack>
    </XStack>
  ))
}
