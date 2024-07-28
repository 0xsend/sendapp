import { Card, CardHeader, H3, H5, Paragraph, XStack, YStack } from '@my/ui'
import { IconSendToken } from 'app/components/icons'
import { useUserReferralsCount } from 'app/utils/useUserReferralsCount'

const pageDescription =
  "Share your unique link, and when someone joins or makes a purchase using it, you earn rewards in SEND token. Our system tracks referrals, ensuring you receive rewards. It's a win-win as you support us and enjoy the benefits. Thanks for being part of our community!"

export const ReferralsScreen = () => {
  return (
    <YStack f={1} width={'100%'} py="$4" gap="$4">
      <XStack alignItems="center" width={'100%'} jc="space-between" gap="$6">
        <H3 fontWeight={'normal'}>Referral Rewards</H3>
        <H3 fontWeight={'bold'}>Check Rewards</H3>
      </XStack>
      <Paragraph py={'$2'} size={'$4'}>
        {pageDescription}
      </Paragraph>
      <StatsCards />
      <RewardsHistory />
    </YStack>
  )
}

const RewardsHistoryHeader = () => (
  <XStack gap="$3" ai="center" jc="space-between">
    <Paragraph w="12%" mb="0" size="$5" lineHeight="$4">
      #
    </Paragraph>
    <Paragraph w="12%" f={1} mb="0" size="$5" lineHeight="$4" ta="center">
      Date
    </Paragraph>
    <Paragraph w="12%" f={1} mb="0" size="$5" lineHeight="$4" ta="center">
      Wallet
    </Paragraph>
    <Paragraph w="12%" f={1} mb="0" size="$5" lineHeight="$4" ta="center">
      Referral rewards
    </Paragraph>
    <Paragraph w="12%" f={1} mb="0" size="$5" lineHeight="$4" ta="center">
      Status
    </Paragraph>
    <Paragraph w="12%" f={1} mb="0" size="$5" lineHeight="$4" ta="right">
      Details
    </Paragraph>
  </XStack>
)

const StatsCards = () => {
  const { referralsCount, error: referralsCountError } = useUserReferralsCount()

  return (
    <XStack flexWrap="wrap" ai="flex-start" jc="space-between" gap="$8" mb="$4">
      <Card f={1} w={'20%'} bc={'$background'}>
        <CardHeader>
          <Paragraph>Total Referrals</Paragraph>
        </CardHeader>
        <H5 pl="$4" pb="$3" fontWeight="600" size={'$7'}>
          {referralsCountError ? '?' : referralsCount || 0}
        </H5>
      </Card>
      <Card f={1} w={'20%'} bc={'$background'}>
        <CardHeader>
          <Paragraph>Transactions</Paragraph>
        </CardHeader>
        <H5 pl="$4" pb="$3" fontWeight="600" size={'$7'}>
          1000
        </H5>
      </Card>
      <Card f={1} w={'20%'} bc={'$background'}>
        <CardHeader>
          <Paragraph>Total Rewards</Paragraph>
        </CardHeader>
        <H5 pl="$4" pb="$3" fontWeight="600" size={'$7'}>
          1000
        </H5>
      </Card>
      <Card f={1} w={'20%'} bc={'$background'}>
        <CardHeader>
          <Paragraph>Claimable Rewards</Paragraph>
        </CardHeader>
        <H5 pl="$4" pb="$3" fontWeight="600" size={'$7'}>
          1000
        </H5>
      </Card>
    </XStack>
  )
}

const RewardsHistory = () => {
  return (
    <YStack f={1} width={'100%'} space="$4">
      <XStack alignItems="center" width={'100%'} jc="space-between" gap="$6">
        <H3 fontWeight={'normal'}>Referral History</H3>
        <H3 fontWeight={'bold'}>See All</H3>
      </XStack>
      <YStack f={1} width={'100%'} p="$6" bg="$background" space="$4" br="$8">
        <RewardsHistoryHeader />
        <RewardsHistoryData />
      </YStack>
    </YStack>
  )
}

const RewardsHistoryData = () => {
  const data = ['data1', 'data2', 'data3']
  return data?.map((key) => (
    <XStack key={key} gap="$3" ai="center" jc="space-between">
      <Paragraph w="12%" mb="0" size="$5" lineHeight="$4">
        ?
      </Paragraph>
      <Paragraph w="12%" f={1} mb="0" size="$5" lineHeight="$4" ta="center">
        ?
      </Paragraph>
      <Paragraph w="12%" f={1} mb="0" size="$5" lineHeight="$4" ta="center">
        0x0
      </Paragraph>
      <XStack f={1} ai="center" w="12%" jc="center" mb="0" gap="$2">
        <IconSendToken />
        <Paragraph size="$5" lineHeight="$4" ta="center">
          ?
        </Paragraph>
      </XStack>
      <Paragraph w="12%" f={1} mb="0" size="$5" lineHeight="$4" ta="center">
        {'?'}
      </Paragraph>
      <Paragraph w="12%" f={1} mb="0" size="$5" lineHeight="$4" ta="right">
        Transaction
      </Paragraph>
    </XStack>
  ))
}
