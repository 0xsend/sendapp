import { Card, CardHeader, H3, H5, LinkableButton, Paragraph, XStack, YStack } from '@my/ui'

import { useUserReferralsCount } from 'app/utils/useUserReferralsCount'

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
          1000
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
        <Paragraph size="$5" lineHeight="$4" ta="center">
          ?
        </Paragraph>
      </XStack>
    </XStack>
  ))
}
