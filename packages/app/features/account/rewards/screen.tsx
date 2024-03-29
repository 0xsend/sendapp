import {
  Button,
  ButtonText,
  Card,
  Container,
  H1,
  H2,
  H3,
  Label,
  Paragraph,
  ScrollView,
  Spinner,
  Stack,
  Text,
  Theme,
  View,
  XStack,
  YStack,
} from '@my/ui'

import React from 'react'

import { type UseDistributionsResultData, useDistributions } from 'app/utils/distributions'
import { useDistributionNumber } from 'app/routers/params'
import { type TimeRemaining, useTimeRemaining } from 'app/utils/useTimeRemaining'
import { useUserReferralsCount } from 'app/utils/useUserReferralsCount'

import { useChainAddresses } from 'app/utils/useChainAddresses'
import { DistributionClaimButton } from './components/DistributionClaimButton'
import { sendTokenAddress, useReadSendTokenBalanceOf } from '@my/wagmi'
import { assert } from 'app/utils/assert'
import formatAmount from 'app/utils/formatAmount'

export function RewardsScreen() {
  const { data: distributions, isLoading } = useDistributions()

  const sortedDistributions = distributions?.sort((a, b) => a.number - b.number)

  const [distributionNumberParam] = useDistributionNumber()
  const selectedDistributionIndex = distributionNumberParam
    ? distributionNumberParam - 1
    : sortedDistributions
      ? sortedDistributions.length - 1
      : 0

  const selectedDistribution = sortedDistributions?.at(selectedDistributionIndex)

  if (isLoading)
    return (
      <Stack w="100%" h="100%" jc={'center'} ai={'center'}>
        <Spinner color="$color" size="large" />
      </Stack>
    )

  return (
    <YStack f={1} my="auto" gap="$6" pb="$2" $gtSm={{ pb: '$8' }} jc="space-between">
      {selectedDistribution ? (
        <YStack gap="$4" f={2} overflow={'hidden'}>
          <DistributionRewardsSection distribution={selectedDistribution} />
        </YStack>
      ) : (
        <Stack f={1} gap="$6" jc="center" ai="center">
          <H2>No distributions available</H2>
        </Stack>
      )}

      <DistributionRewardsList distributions={sortedDistributions} />
    </YStack>
  )
}

const now = new Date()

const DistributionRewardsSection = ({
  distribution,
}: { distribution: UseDistributionsResultData[number] }) => {
  const isBeforeQualification = now < distribution.qualification_start
  const isDuringQualification =
    now >= distribution.qualification_start && now <= distribution.qualification_end
  const isClaimable = now > distribution.qualification_end && now <= distribution.claim_end

  const timeRemaining = useTimeRemaining(
    isDuringQualification
      ? distribution.qualification_end
      : isClaimable
        ? distribution.claim_end
        : now
  )

  return (
    <Container>
      <YStack
        f={1}
        $lg={{ gap: '$2' }}
        $theme-dark={{ btc: '$gray7Dark' }}
        $theme-light={{ btc: '$gray4Light' }}
        $gtSm={{ pt: '$6', gap: '$8' }}
      >
        <Stack gap="$2" $gtSm={{ gap: '$6' }}>
          <Label fontFamily={'$mono'} fontSize={'$5'}>
            ROUND
          </Label>
          <XStack w="100%" ai="center" jc="space-around" mt="auto">
            <Stack>
              <Theme inverse>
                <H1
                  fontFamily={'$mono'}
                  fontWeight={'300'}
                  fontSize={54}
                  $gtSm={{ fontSize: 79 }}
                  col="$background"
                >
                  #{distribution.number}
                </H1>
              </Theme>
            </Stack>
            <View borderRightWidth={1} borderColor={'$decay'} w={0} h="100%" ai="stretch" mx="$4" />
            <Stack
              $gtSm={{ fd: 'row', gap: '$0' }}
              fd="column"
              gap="$4"
              f={1}
              justifyContent="space-between"
            >
              <YStack gap="$2" f={1} maw={312}>
                {isDuringQualification && <Label fontFamily={'$mono'}>Valid for</Label>}
                <Theme inverse>
                  {(() => {
                    switch (true) {
                      case isBeforeQualification:
                        return (
                          <Paragraph fontFamily={'$mono'} col="$background" fontSize={'$5'}>
                            {`Qualification for Round ${distribution.number} has not started`}
                          </Paragraph>
                        )
                      case isDuringQualification:
                        return <DistributionRewardTimer timeRemaining={timeRemaining} />
                      case isClaimable:
                        return (
                          <Paragraph fontFamily={'$mono'} col="$background" fontSize={'$5'}>
                            {`Qualification for Round ${distribution.number} has closed and if you met the requirements, it should now be claimable.`}
                          </Paragraph>
                        )
                      default:
                        return (
                          <Paragraph fontFamily={'$mono'} col="$background" fontSize={'$5'}>
                            {`Claims for Round ${distribution.number} have closed`}
                          </Paragraph>
                        )
                    }
                  })()}
                </Theme>
              </YStack>
              <YStack $gtSm={{ ai: 'flex-end' }}>
                <Label fontFamily={'$mono'}>Status</Label>
                <Theme inverse>
                  <DistributionStatus distribution={distribution} />
                </Theme>
              </YStack>
            </Stack>
          </XStack>
        </Stack>
        <Stack fd="column" $gtLg={{ fd: 'row', mah: 248 }} gap="$2" f={1} my="auto">
          <YStack $gtLg={{ w: '50%' }} gap="$2" $gtSm={{ gap: '$4' }}>
            <Stack f={1} gap="$2" $gtSm={{ gap: '$4' }}>
              <SendBalanceCard distribution={distribution} />
            </Stack>
            <XStack f={1} gap="$2" $gtSm={{ gap: '$4' }}>
              <MinBalanceCard hodler_min_balance={distribution.hodler_min_balance} />
              <ReferralsCard />
            </XStack>
          </YStack>
          <Stack f={1} $gtLg={{ w: '50%', f: 1 }}>
            <SendRewardsCard distribution={distribution} />
          </Stack>
        </Stack>
      </YStack>
    </Container>
  )
}

const DistributionRewardTimer = ({ timeRemaining }: { timeRemaining: TimeRemaining }) => {
  return (
    <XStack ai={'flex-start'} jc="space-between" maw={312}>
      <DistributionRewardTimerDigit>
        {String(timeRemaining.days).padStart(2, '0')}D
      </DistributionRewardTimerDigit>
      <DistributionRewardTimerDigit>:</DistributionRewardTimerDigit>
      <DistributionRewardTimerDigit>
        {String(timeRemaining.hours).padStart(2, '0')}Hr
      </DistributionRewardTimerDigit>
      <DistributionRewardTimerDigit>:</DistributionRewardTimerDigit>
      <DistributionRewardTimerDigit>
        {String(timeRemaining.minutes).padStart(2, '0')}Min
      </DistributionRewardTimerDigit>
      <DistributionRewardTimerDigit>:</DistributionRewardTimerDigit>
      <DistributionRewardTimerDigit>
        {String(timeRemaining.seconds).padStart(2, '0')}Sec
      </DistributionRewardTimerDigit>
    </XStack>
  )
}

const DistributionRewardTimerDigit = ({ children }: { children?: string | string[] }) => (
  <Text
    fontWeight={'500'}
    fontSize="$5"
    $gtMd={{ fontSize: '$7' }}
    col="$background"
    fontFamily={'$mono'}
  >
    {children}
  </Text>
)

const SendBalanceCard = ({
  distribution,
}: { distribution: UseDistributionsResultData[number] }) => {
  const {
    data: addresses,
    isLoading: isLoadingChainAddresses,
    error: chainAddressesError,
  } = useChainAddresses()

  if (chainAddressesError) throw chainAddressesError

  const address = addresses?.[0]?.address

  const chainId = distribution.chain_id as keyof typeof sendTokenAddress
  assert(chainId in sendTokenAddress, 'Chain ID not found in sendTokenAddress')

  const {
    data: snapshotBalance,
    isLoading: isLoadingSnapshotBalance,
    error: snapshotBalanceError,
  } = useReadSendTokenBalanceOf({
    chainId,
    args: address ? [address] : undefined,
    blockNumber: distribution.snapshot_block_num
      ? BigInt(distribution.snapshot_block_num)
      : undefined,
    query: {
      enabled: !!address,
    },
  })
  if (snapshotBalanceError) throw snapshotBalanceError

  const body = () => {
    switch (true) {
      case snapshotBalance === undefined:
        return 'Error fetching SEND balance'
      default:
        return `${formatAmount(snapshotBalance.toString(), 9, 0)} SEND`
    }
  }

  return (
    <Card
      bc="transparent"
      borderWidth={1}
      br={12}
      borderColor={'$decay'}
      p="$4"
      $gtLg={{ p: '$4' }}
      jc="center"
    >
      <YStack gap="$2" $gtLg={{ gap: '$4' }}>
        <Label fontFamily={'$mono'} col="$olive" fontSize={'$5'}>
          Send Balance
        </Label>
        {isLoadingSnapshotBalance || isLoadingChainAddresses ? (
          <Spinner color={'$color'} />
        ) : (
          <Paragraph fontFamily={'$mono'} col="$color12" fontSize={'$7'} fontWeight={'500'}>
            {body()}
          </Paragraph>
        )}
      </YStack>
    </Card>
  )
}
const MinBalanceCard = ({ hodler_min_balance }: { hodler_min_balance: number }) => (
  <Card
    f={2}
    bc="transparent"
    borderWidth={1}
    br={12}
    borderColor={'$decay'}
    p="$4"
    $gtLg={{ p: '$4' }}
    jc="center"
  >
    <YStack gap="$2" $gtLg={{ gap: '$4' }}>
      <Label fontFamily={'$mono'} col="$olive" fontSize={'$5'}>
        Min Balance required
      </Label>
      <Theme inverse>
        <Paragraph fontFamily={'$mono'} col="$background" fontSize={'$7'} fontWeight={'500'}>
          {hodler_min_balance ? `${formatAmount(hodler_min_balance, 9, 0)} SEND` : '?'}
        </Paragraph>
      </Theme>
    </YStack>
  </Card>
)

const ReferralsCard = () => {
  const { referralsCount, isLoading, error } = useUserReferralsCount()
  if (error) throw error

  const body = () => {
    switch (true) {
      case isLoading:
        return <Spinner color={'$color'} />
      case referralsCount === undefined:
        return 'Fetch Error'
      default:
        return referralsCount
    }
  }

  return (
    <Card
      f={1}
      bc="transparent"
      borderWidth={1}
      br={12}
      borderColor={'$decay'}
      p="$4"
      $gtLg={{ p: '$4' }}
      jc="center"
    >
      <YStack gap="$2" $gtLg={{ gap: '$4' }}>
        <Label fontFamily={'$mono'} col="$olive" fontSize={'$5'}>
          Referrals
        </Label>
        <Theme inverse>
          <Paragraph fontFamily={'$mono'} col="$background" fontSize={'$7'} fontWeight={'500'}>
            {body()}
          </Paragraph>
        </Theme>
      </YStack>
    </Card>
  )
}

const SendRewardsCard = ({
  distribution,
}: { distribution: UseDistributionsResultData[number] }) => {
  const shareAmount = distribution.distribution_shares?.[0]?.amount
  return (
    <Card
      f={1}
      mih={198}
      $gtLg={{ f: 1 }}
      $gtMd={{ f: 2 }}
      $theme-dark={{ bc: '$darkest' }}
      $theme-light={{ bc: '$gray3Light' }}
      br={12}
      jc="center"
    >
      <YStack w={'100%'} gap="$8" mx="auto" jc="center" ai="center">
        <Stack gap="$6">
          <Label fontFamily={'$mono'} col="$olive" ta="left" fontSize={'$5'}>
            Rewards
          </Label>
          <Theme inverse>
            <Paragraph
              fontFamily={'$mono'}
              col="$background"
              $gtXs={{ fontSize: '$10' }}
              fontSize={'$9'}
              fontWeight={'500'}
              lh={40}
            >
              {shareAmount === undefined ? 'N/A' : `${formatAmount(shareAmount, 10, 0)} SEND`}
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
  const isClaimActive = distribution.qualification_end > new Date()
  return (
    <H3 fontSize="$5" $gtMd={{ fontSize: '$7' }} fontWeight={'500'} col="$background">
      {isClaimActive ? 'OPEN' : 'CLOSED'}
    </H3>
  )
}

const numOfDistributions = 10
const DistributionRewardsList = ({
  distributions,
}: { distributions?: (UseDistributionsResultData[number] | undefined)[] }) => {
  const { isLoading, error } = useDistributions()
  const [distributionNumberParam, setDistributionNumberParam] = useDistributionNumber()

  const mock = (len: number, start = 0) =>
    new Array(len).fill(undefined).map((_, i) => ({ number: start + i + 1 }))

  // @ts-expect-error we're mocking the data here
  const allDistributions: UseDistributionsResultData[number][] =
    distributions === undefined
      ? mock(numOfDistributions)
      : [...distributions, ...mock(numOfDistributions - distributions.length, distributions.length)]

  if (error) throw error

  if (isLoading) return <DistributionRewardsSkeleton />

  return (
    <Container>
      <ScrollView
        $gtLg={{ f: 1 }}
        flex={0}
        overflow="scroll"
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        pb="$4"
      >
        <XStack w="100%" gap="$2" jc={'space-between'} py="$2" maw={1072} mx="auto">
          {allDistributions?.map((distribution, i) => {
            return distribution?.id === undefined ? (
              <Button
                key={distribution.number}
                bc={'$darkest'}
                f={1}
                maw={84}
                miw="$7"
                h="$2"
                br={6}
                disabled
                opacity={0.4}
              >
                <ButtonText size={'$1'} padding={'unset'} ta="center" margin={'unset'} col="$olive">
                  {`# ${i + 1}`}
                </ButtonText>
              </Button>
            ) : distributionNumberParam === distribution?.number ||
              (distributionNumberParam === undefined &&
                distribution?.number === distributions?.length) ? (
              <Stack key={distribution.number} f={1} maw={84} miw="$7" h="$2" jc="center">
                <View
                  position="absolute"
                  top={-5}
                  left={0}
                  right={0}
                  mx="auto"
                  w={0}
                  h={0}
                  borderLeftColor={'transparent'}
                  borderRightColor={'transparent'}
                  borderBottomColor={'$accent12Dark'}
                  borderBottomWidth={8}
                  borderLeftWidth={8}
                  borderRightWidth={8}
                />

                <Button
                  onPress={() => setDistributionNumberParam(distribution.number)}
                  bc={'$accent12Dark'}
                  br={6}
                  h="$2"
                  disabled
                >
                  <ButtonText
                    size={'$1'}
                    padding={'unset'}
                    ta="center"
                    margin={'unset'}
                    col="$black"
                  >
                    {`# ${distribution?.number}  `}
                  </ButtonText>
                </Button>
              </Stack>
            ) : (
              <Button
                key={distribution.number}
                f={1}
                bc={'$decay'}
                maw={84}
                miw="$7"
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
    </Container>
  )
}

const DistributionRewardsSkeleton = () => {
  return null
}
