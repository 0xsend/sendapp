import { Card, CardHeader, Container, H3, H5, Paragraph, XStack, YStack } from '@my/ui'
import { IconSendToken } from 'app/components/icons'
import { shortAddress } from 'app/utils/NameDisplayUtils'
import { useUserReferralsCount } from 'app/utils/UseUserReferralsCount'
import { useDistributionBonusPoolShares } from 'app/utils/useDistributionBonusPoolShares'

const pageDescription =
  "Share your unique link, and when someone joins or makes a purchase using it, you earn rewards in SEND token. Our system tracks referrals, ensuring you receive rewards. It's a win-win as you support us and enjoy the benefits. Thanks for being part of our community!"

export const ReferralsScreen = () => {
  return (
    <Container>
      <YStack f={1} width={'100%'} py="$4" gap="$4">
        <XStack alignItems="center" width={'100%'} jc="space-between" gap="$6">
          <H3 fontWeight={'normal'}>Referral Rewards</H3>
          <H3 fontWeight={'bold'} color={'$gold10'}>
            Check Rewards
          </H3>
        </XStack>
        <Paragraph py={'$2'} size={'$4'}>
          {pageDescription}
        </Paragraph>
        <StatsCards />
        <RewardsHistory />
      </YStack>
    </Container>
  )
}

const StatsCards = () => {
  const { referralsCount, error: referralsCountError } = useUserReferralsCount()
  const { data } = useDistributionBonusPoolShares()
  const totalRewards = data?.reduce((acc, { bonus_pool_amount }) => bonus_pool_amount + acc, 0)
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
          ?
        </H5>
      </Card>
      <Card f={1} w={'20%'} bc={'$background'}>
        <CardHeader>
          <Paragraph>Total Rewards</Paragraph>
        </CardHeader>
        <XStack ai="center" h="100%" pl="$4" pb="$3" gap="$2">
          <IconSendToken />
          <H5 pl="$4" pb="$3" fontWeight="600" size={'$7'}>
            {totalRewards}
          </H5>
        </XStack>
      </Card>
      <Card f={1} w={'20%'} bc={'$background'}>
        <CardHeader>
          <Paragraph>Claimable Rewards</Paragraph>
        </CardHeader>
        <H5 pl="$4" pb="$3" fontWeight="600" size={'$7'}>
          ?
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
        <ReferralsHistoryHeader />
      </YStack>
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

const RewardsHistoryData = () => {
  const { data } = useDistributionBonusPoolShares()

  return data?.map(({ bonus_pool_amount, created_at, address, distribution_id }) => (
    <XStack key={created_at.toString()} gap="$3" ai="center" jc="space-between">
      <Paragraph w="12%" mb="0" size="$5" lineHeight="$4">
        {distribution_id}
      </Paragraph>
      <Paragraph w="12%" f={1} mb="0" size="$5" lineHeight="$4" ta="center">
        {created_at.toLocaleDateString('en-US', {
          day: 'numeric',
          year: 'numeric',
          month: 'short',
        })}
      </Paragraph>
      <Paragraph w="12%" f={1} mb="0" size="$5" lineHeight="$4" ta="center">
        {shortAddress(address)}
      </Paragraph>
      <XStack f={1} ai="center" w="12%" jc="center" mb="0" gap="$2">
        <IconSendToken />
        <Paragraph size="$5" lineHeight="$4" ta="center">
          {bonus_pool_amount}
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
