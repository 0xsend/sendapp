import {
  Button,
  ButtonText,
  Card,
  H1,
  H3,
  Label,
  Paragraph,
  ScrollView,
  Stack,
  Text,
  Theme,
  XStack,
  YStack,
} from '@my/ui'
import { sendMerkleDropAddress } from '@my/wagmi'
import React from 'react'

import {
  UseDistributionsResultData,
  useDistributions,
  useSendMerkleDropIsClaimed,
  useSendTokenBalance,
} from 'app/utils/distributions'
import { useDistributionNumber } from 'app/routers/params'
import { useTimeRemaining } from 'app/utils/useTimeRemaining'
import { useUserReferralsCount } from 'app/utils/useUserReferralsCount'

import { useChainAddresses } from 'app/utils/useChainAddresses'
import { DistributionClaimButton } from './components/DistributionClaimButton'

export function EarnTokensScreen() {
  const { data: distributions, isLoading } = useDistributions()
  const [distributionNumberParam] = useDistributionNumber()
  const selectedDistribution = distributionNumberParam
    ? distributions?.at(distributionNumberParam - 1)
    : distributions?.at(distributions.length - 1)

  if (!selectedDistribution) return 'No distribution selected'

  return (
    <YStack f={1} my="auto" gap="$6" px="$6" $gtLg={{ px: '$11' }} pb="$8" jc="space-between">
      <YStack gap="$8" f={1} overflow={'hidden'} borderTopColor="$gray7Dark" borderTopWidth="$1">
        <DistributionRewardsSection distribution={selectedDistribution} isLoading={isLoading} />
      </YStack>
      <DistributionRewardsList distributions={distributions} />
    </YStack>
  )
}

const DistributionRewardsSection = ({
  distribution,
  isLoading,
}: { distribution: UseDistributionsResultData[number]; isLoading: boolean }) => {
  const now = new Date()
  const hasDistribution = !isLoading && distribution

  const isBeforeQualification = hasDistribution && now < distribution.qualification_start
  const isDuringQualification =
    hasDistribution &&
    now >= distribution.qualification_start &&
    now <= distribution.qualification_end
  const isClaimable =
    hasDistribution && now > distribution.qualification_end && now <= distribution.claim_end

  const timeRemaining = useTimeRemaining(
    isLoading
      ? now
      : isBeforeQualification
        ? distribution.qualification_start
        : isDuringQualification
          ? distribution.qualification_end
          : isClaimable
            ? distribution.claim_end
            : now
              ? distribution.qualification_start
              : isDuringQualification
                ? distribution.qualification_end
                : isClaimable
                  ? distribution.claim_end
                  : now
  )
  return (
    <YStack f={1} jc={'space-around'}>
      <Stack gap="$6" py="$6">
        <Label fontFamily={'$mono'} fontSize={'$6'}>
          ROUND
        </Label>
        <XStack f={1} w="100%" ai="center" jc="space-between" gap="$6" mt="auto">
          <Stack f={1} borderRightWidth={1}>
            <Theme inverse>
              <H1 fontFamily={'$mono'} fontWeight={'300'} fontSize={79} col="$background">
                #{distribution.number}
              </H1>
            </Theme>
          </Stack>
          <YStack f={4} gap="$2">
            <Label fontFamily={'$mono'}>Valid for</Label>
            <XStack ai={'flex-start'} jc="space-around" w="60%" maw={312}>
              <Theme inverse>
                <Text fontWeight={'500'} fontSize="$7" col="$background" fontFamily={'$mono'}>
                  {String(timeRemaining.days).padStart(2, '0')}D
                </Text>
                <Text fontSize={'$7'} fontWeight={'500'} col="$background" fontFamily={'$mono'}>
                  :
                </Text>
                <Text fontWeight={'500'} fontSize="$7" col="$background" fontFamily={'$mono'}>
                  {String(timeRemaining.hours).padStart(2, '0')}Hr
                </Text>
                <Text fontSize={'$7'} fontWeight={'500'} col="$background" fontFamily={'$mono'}>
                  :
                </Text>
                <Text fontWeight={'500'} fontSize="$7" col="$background" fontFamily={'$mono'}>
                  {String(timeRemaining.minutes).padStart(2, '0')}Min
                </Text>
                <Text fontSize={'$7'} fontWeight={'500'} col="$background" fontFamily={'$mono'}>
                  :
                </Text>
                <Text fontWeight={'500'} fontSize="$7" col="$background" fontFamily={'$mono'}>
                  {String(timeRemaining.seconds).padStart(2, '0')}Sec
                </Text>
              </Theme>
            </XStack>
          </YStack>
          <YStack f={1} ai="flex-end" gap="$2">
            <Label fontFamily={'$mono'}>Status</Label>
            <Theme inverse>
              <DistributionStatus distribution={distribution} />
            </Theme>
          </YStack>
        </XStack>
      </Stack>
      <Stack flex={1} fd="column" $gtLg={{ fd: 'row', mah: 248, flex: 1 }} gap="$4" my="auto">
        <YStack f={1} $gtLg={{ w: '50%' }} gap="$4">
          <Stack f={1} gap="$4">
            <SendBalanceCard />
          </Stack>
          <XStack f={1} gap="$4">
            <MinBalanceCard hodler_min_balance={distribution.hodler_min_balance} />
            <ReferralsCard />
          </XStack>
        </YStack>
        <Stack f={1} $gtLg={{ w: '50%', f: 1 }} $gtMd={{ f: 2 }}>
          <DistributionRewardsCard distribution={distribution} />
        </Stack>
      </Stack>
    </YStack>
  )
}

const SendBalanceCard = () => {
  const {
    data: addresses,
    isLoading: isLoadingChainAddresses,
    error: chainAddressesError,
  } = useChainAddresses()

  const address = addresses?.[0]?.address
  if (chainAddressesError) throw chainAddressesError

  const { data: sendBalance, error: sendBalanceError } = useSendTokenBalance(address)

  if (sendBalanceError) throw sendBalanceError

  return (
    <Card f={1} bc="transparent" borderWidth={1} br={12} borderColor={'$decay'} p="$6" jc="center">
      <YStack gap="$4">
        <Label fontFamily={'$mono'} col="$olive">
          Send Balance
        </Label>
        <Theme inverse>
          <Paragraph fontFamily={'$mono'} col="$background" fontSize={'$7'} fontWeight={'500'}>
            {sendBalance?.value ? sendBalance.value : '?'} SEND
          </Paragraph>
        </Theme>
      </YStack>
    </Card>
  )
}
const MinBalanceCard = ({ hodler_min_balance }: { hodler_min_balance?: number }) => (
  <Card f={2} bc="transparent" borderWidth={1} br={12} borderColor={'$decay'} p="$6" jc="center">
    <YStack gap="$4">
      <Label fontFamily={'$mono'}>Min Balance required</Label>
      <Theme inverse>
        <Paragraph fontFamily={'$mono'} col="$background" fontSize={'$7'} fontWeight={'500'}>
          {hodler_min_balance ? hodler_min_balance : '?'} SEND
        </Paragraph>
      </Theme>
    </YStack>
  </Card>
)

const ReferralsCard = () => {
  const { referralsCount, error } = useUserReferralsCount()
  if (error) throw error
  return (
    <Card f={1} bc="transparent" borderWidth={1} br={12} borderColor={'$decay'} p="$6" jc="center">
      <YStack gap="$4">
        <Label fontFamily={'$mono'} col="$olive">
          Referrals
        </Label>
        <Theme inverse>
          <Paragraph fontFamily={'$mono'} col="$background" fontSize={'$7'} fontWeight={'500'}>
            {referralsCount}
          </Paragraph>
        </Theme>
      </YStack>
    </Card>
  )
}

const DistributionRewardsCard = ({
  distribution,
}: { distribution: UseDistributionsResultData[number] }) => {
  return (
    <Card f={1} $gtLg={{ f: 1 }} $gtMd={{ f: 2 }} bc="$darkest" br={12} p="$6" jc="center">
      <YStack w={'100%'} gap="$8" maw={336} mx="auto">
        <Stack gap="$6">
          <Label fontFamily={'$mono'} col="$olive">
            Rewards
          </Label>
          <Theme inverse>
            <Paragraph fontFamily={'$mono'} col="$background" fontSize={'$10'} fontWeight={'500'}>
              0 SEND
            </Paragraph>
          </Theme>
        </Stack>
        <DistributionClaimButton distribution={distribution} />
      </YStack>
    </Card>
  )
}

const DistributionStatus = ({
  distribution,
}: { distribution: UseDistributionsResultData[number] }) => {
  const share = distribution.distribution_shares?.[0]
  const isEligible = !!share && share.amount > 0
  const isClaimActive = distribution.qualification_end < new Date()
  const trancheId = BigInt(distribution.number - 1) // tranches are 0-indexed
  const chainId = distribution.chain_id as keyof typeof sendMerkleDropAddress
  // find out if user is eligible onchain using SendMerkleDrop.isClaimed(uint256 _tranche, uint256 _index)
  const {
    data: isClaimed,
    isLoading: isClaimedLoading,
    error: isClaimedError,
  } = useSendMerkleDropIsClaimed({
    chainId,
    tranche: trancheId,
    index: share?.index !== undefined ? BigInt(share.index) : undefined,
  })

  if (!isClaimActive) {
    return (
      <H3 fontWeight={'normal'} col="$background">
        TRANCHE INACTIVE
      </H3>
    )
  }

  if (!isEligible) {
    return (
      <H3 fontWeight={'normal'} col="$background">
        NOT ELIGIBLE
      </H3>
    )
  }

  if (isClaimedLoading) {
    return 'Loading...'
  }

  if (isClaimedError) {
    return 'Error'
  }

  if (isClaimed) {
    return (
      <H3 fontWeight={'normal'} col="$background">
        CLAIMED
      </H3>
    )
  }

  return (
    <H3 fontWeight={'normal'} col="$background">
      NOT CLAIMED
    </H3>
  )
}

const numOfDistributions = 10
const DistributionRewardsList = ({
  distributions,
}: { distributions?: UseDistributionsResultData }) => {
  const { isLoading, error } = useDistributions()
  const [distributionNumberParam, setDistributionNumberParam] = useDistributionNumber()
  const allDistributions = distributions?.concat(
    Array(numOfDistributions - distributions.length).fill(undefined)
  )

  if (error) throw error

  if (isLoading) return <DistributionRewardsSkeleton />

  return (
    <ScrollView
      jc="flex-start"
      flex={0}
      overflow="scroll"
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}
    >
      <XStack w="100%" gap="$2" jc={'space-between'} py="$2">
        {allDistributions?.map((distribution, i) => {
          return distribution === undefined ? (
            <Button bc={'$darkest'} w={'$7'} h="$2" br={6} disabled opacity={0.4}>
              <ButtonText size={'$1'} padding={'unset'} ta="center" margin={'unset'} col="$olive">
                {`# ${i + 1}`}
              </ButtonText>
            </Button>
          ) : distributionNumberParam === distribution?.number ||
            (distributionNumberParam === undefined &&
              distribution?.number === distributions?.length) ? (
            <Button
              key={distribution?.id}
              bc={'$accent12Dark'}
              w={'$7'}
              h="$2"
              br={6}
              onPress={() => setDistributionNumberParam(distribution.number)}
            >
              <ButtonText size={'$1'} padding={'unset'} ta="center" margin={'unset'} col="$black">
                {`# ${distribution?.number}  `}
              </ButtonText>
            </Button>
          ) : (
            <Button
              key={distribution?.id}
              bc={'$decay'}
              w={'$7'}
              h="$2"
              br={6}
              onPress={() => setDistributionNumberParam(distribution.number)}
            >
              <ButtonText size={'$1'} padding={'unset'} ta="center" margin={'unset'} col="white">
                {`# ${distribution?.number}  `}
              </ButtonText>
            </Button>
          )
        })}
      </XStack>
    </ScrollView>
  )
}

const DistributionRewardsSkeleton = () => {
  return null
}
