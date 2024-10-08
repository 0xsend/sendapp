import {
  Button,
  ButtonText,
  Card,
  H1,
  H2,
  H3,
  Label,
  Link,
  Paragraph,
  ScrollView,
  Spinner,
  Stack,
  Text,
  Theme,
  View,
  XStack,
  YStack,
  useThemeName,
} from '@my/ui'
import {
  type UseDistributionsResultData,
  useDistributions,
  useSendMerkleDropTrancheActive,
} from 'app/utils/distributions'
import { useRewardsScreenParams } from 'app/routers/params'
import { type TimeRemaining, useTimeRemaining } from 'app/utils/useTimeRemaining'
import { useChainAddresses } from 'app/utils/useChainAddresses'
import { DistributionClaimButton } from './components/DistributionClaimButton'
import { type sendMerkleDropAddress, sendTokenAddress, useReadSendTokenBalanceOf } from '@my/wagmi'
import { assert } from 'app/utils/assert'
import formatAmount from 'app/utils/formatAmount'
import { useSendPrice } from 'app/utils/coin-gecko'
import { useConfirmedTags } from 'app/utils/tags'
import { IconPlus } from 'app/components/icons'

export function RewardsScreen() {
  const { data: distributions, isLoading } = useDistributions()
  const sortedDistributions = distributions?.sort((a, b) => a.number - b.number)

  const [queryParams] = useRewardsScreenParams()
  const selectedDistributionIndex = queryParams.distribution
    ? queryParams.distribution - 1
    : sortedDistributions
      ? sortedDistributions.length - 1
      : 0

  const selectedDistribution = sortedDistributions?.at(selectedDistributionIndex)

  if (isLoading)
    return (
      <Stack w="100%" f={1} jc={'center'} ai={'center'}>
        <Spinner color="$color" size="large" />
      </Stack>
    )

  return (
    <YStack f={1} my="auto" gap="$6" pb="$2" $gtSm={{ pb: '$8', h: '95%' }} jc="space-between">
      {selectedDistribution ? (
        <>
          <YStack gap="$4" f={2}>
            <DistributionRewardsSection distribution={selectedDistribution} />
          </YStack>
          <DistributionRewardsList distributions={sortedDistributions} />
        </>
      ) : (
        <Stack f={1} gap="$6" jc="center" ai="center">
          <H2>No distributions available</H2>
        </Stack>
      )}
    </YStack>
  )
}

const DistributionRewardsSection = ({
  distribution,
}: { distribution: UseDistributionsResultData[number] }) => {
  const trancheId = BigInt(distribution.number - 1) // tranches are 0-indexed
  const chainId = distribution.chain_id as keyof typeof sendMerkleDropAddress
  const {
    data: isTrancheActive,
    isLoading: isTrancheActiveLoading,
    error: isTrancheActiveError,
  } = useSendMerkleDropTrancheActive({
    tranche: trancheId,
    chainId: chainId,
  })
  const shareAmount = distribution.distribution_shares?.[0]?.amount

  const now = new Date()
  const isBeforeQualification = now < distribution.qualification_start
  const isDuringQualification =
    now >= distribution.qualification_start && now <= distribution.qualification_end
  const isAfterQualification = now > distribution.qualification_end
  const isClaimable = now > distribution.qualification_end && now <= distribution.claim_end

  const confirmedTags = useConfirmedTags()

  const timeRemaining = useTimeRemaining(
    isDuringQualification
      ? distribution.qualification_end
      : isClaimable
        ? distribution.claim_end
        : now
  )

  return (
    <YStack f={1} $lg={{ gap: '$5', pt: '$6' }} $gtSm={{ pt: '$6', gap: '$8' }}>
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
            <YStack gap="$2" f={1} maw={312} jc="center">
              <Theme inverse>
                {(() => {
                  switch (true) {
                    case isBeforeQualification:
                      return (
                        <Paragraph fontFamily={'$mono'} col="$background" fontSize={'$5'}>
                          Round has not started
                        </Paragraph>
                      )
                    case shareAmount === undefined ||
                      shareAmount === 0 ||
                      confirmedTags?.length === 0:
                      return (
                        <Paragraph fontFamily={'$mono'} col="$background" fontSize={'$5'}>
                          Not eligible
                        </Paragraph>
                      )
                    case isDuringQualification:
                      return (
                        <>
                          <Theme inverse>
                            <Label fontFamily={'$mono'}>Closing in</Label>
                          </Theme>
                          <DistributionRewardTimer timeRemaining={timeRemaining} />
                        </>
                      )
                    case isTrancheActiveLoading:
                      return (
                        <Paragraph fontFamily={'$mono'} col="$background" fontSize={'$5'}>
                          Checking claimability...
                        </Paragraph>
                      )
                    case !!isTrancheActiveError:
                      return (
                        <Paragraph fontFamily={'$mono'} col="$background" fontSize={'$5'}>
                          Error checking claimability. Please try again later
                        </Paragraph>
                      )
                    case isAfterQualification && !isTrancheActive:
                      return (
                        <Paragraph fontFamily={'$mono'} col="$background" fontSize={'$5'}>
                          Rewards will be available soon
                        </Paragraph>
                      )

                    case isClaimable:
                      return (
                        <Paragraph fontFamily={'$mono'} col="$background" fontSize={'$5'}>
                          Claim Rewards
                        </Paragraph>
                      )
                    default:
                      return (
                        <Paragraph fontFamily={'$mono'} col="$background" fontSize={'$5'}>
                          {`Expired ${now.toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}`}
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
      {confirmedTags?.length === -1 ? (
        <Card
          w="100%"
          jc={'space-around'}
          ai="center"
          f={1}
          my="auto"
          $md={{ br: '$6' }}
          p="$6"
          br="$6"
        >
          <Paragraph fontSize={'$6'} $xs={{ fontSize: '$4' }} fontWeight={'500'} color={'$color12'}>
            Register a Sendtag to unlock rewards
          </Paragraph>
          <Stack jc="center" ai="center">
            <Link
              href={'/account/sendtag/checkout'}
              theme="green"
              borderRadius={'$4'}
              p={'$3.5'}
              $xs={{ p: '$2.5', px: '$4' }}
              px="$6"
              maw={301}
              bg="$primary"
            >
              <XStack gap={'$1.5'} ai={'center'} jc="center">
                <IconPlus col={'$black'} />
                <Paragraph textTransform="uppercase" col={'$black'}>
                  SENDTAGS
                </Paragraph>
              </XStack>
            </Link>
          </Stack>
        </Card>
      ) : (
        <Stack fd="column" $gtLg={{ fd: 'row', mah: 248 }} gap="$2" f={1} my="auto">
          <YStack $gtLg={{ w: '50%' }} gap="$2" $gtSm={{ gap: '$4' }}>
            <Stack f={1} gap="$2" $gtSm={{ gap: '$4' }}>
              <SendBalanceCard distribution={distribution} />
            </Stack>
            <XStack f={1} gap="$2" $gtSm={{ gap: '$4' }}>
              <MinBalanceCard hodler_min_balance={distribution.hodler_min_balance} />
              <ReferralsCard
                referrals={distribution.distribution_verifications_summary[0]?.tag_referrals ?? 0}
              />
            </XStack>
          </YStack>
          <Stack f={1} $gtLg={{ w: '50%', f: 1 }}>
            <SendRewardsCard distribution={distribution} />
          </Stack>
        </Stack>
      )}
    </YStack>
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

  return (
    <Card
      bw={1}
      br={12}
      theme="ghost_alt1"
      p="$4"
      $xs={{ p: '$2.5' }}
      $gtLg={{ p: '$4' }}
      jc="center"
    >
      <YStack gap="$2" $gtLg={{ gap: '$4' }}>
        <Label
          fontFamily={'$mono'}
          fontSize={'$5'}
          theme="green"
          col={'$color2'}
          $theme-light={{ col: '$color12' }}
        >
          Snapshot Send Balance
        </Label>
        {isLoadingSnapshotBalance || isLoadingChainAddresses ? (
          <Spinner color={'$color'} />
        ) : (
          <Theme reset>
            <Paragraph fontFamily={'$mono'} fontSize={'$7'} fontWeight={'500'} color={'$color12'}>
              {(() => {
                switch (true) {
                  case snapshotBalance === undefined:
                    return 'Error fetching SEND balance'
                  default:
                    return `${formatAmount(snapshotBalance.toString(), 9, 0)} SEND`
                }
              })()}
            </Paragraph>
          </Theme>
        )}
      </YStack>
    </Card>
  )
}
const MinBalanceCard = ({ hodler_min_balance }: { hodler_min_balance: number }) => (
  <Card
    f={2}
    theme="ghost_alt1"
    bw={1}
    br={12}
    $xs={{ p: '$2.5' }}
    p="$4"
    $gtLg={{ p: '$4' }}
    jc="center"
  >
    <YStack gap="$2" $gtLg={{ gap: '$4' }}>
      <Label
        fontFamily={'$mono'}
        fontSize={'$5'}
        theme="green"
        col={'$color2'}
        $theme-light={{ col: '$color12' }}
      >
        Min Balance required
      </Label>
      <Paragraph fontFamily={'$mono'} fontSize={'$7'} fontWeight={'500'} color={'$color12'}>
        {hodler_min_balance ? `${formatAmount(hodler_min_balance, 9, 0)} SEND` : '?'}
      </Paragraph>
    </YStack>
  </Card>
)

const ReferralsCard = ({ referrals }: { referrals: number | null }) => (
  <Card
    f={1}
    borderWidth={1}
    br={12}
    theme="ghost_alt1"
    $xs={{ p: '$2.5' }}
    p="$4"
    $gtLg={{ p: '$4' }}
    jc="center"
  >
    <YStack gap="$2" $gtLg={{ gap: '$4' }}>
      <Label
        fontFamily={'$mono'}
        fontSize={'$5'}
        theme="green"
        col={'$color2'}
        $theme-light={{ col: '$color12' }}
      >
        Referrals
      </Label>

      <Paragraph fontFamily={'$mono'} fontSize={'$7'} fontWeight={'500'} col={'$color12'}>
        {referrals !== null ? referrals : '---'}
      </Paragraph>
    </YStack>
  </Card>
)

const SendRewardsCard = ({
  distribution,
}: { distribution: UseDistributionsResultData[number] }) => {
  const shareAmount = distribution.distribution_shares?.[0]?.amount
  const { data: sendPrice } = useSendPrice()
  const pricePerSend = sendPrice?.['send-token'].usd
  const rewardValue = pricePerSend && shareAmount ? shareAmount * pricePerSend : undefined

  return (
    <Card f={1} mih={198} p="$6" $gtLg={{ f: 1, p: '$6' }} $gtMd={{ f: 2 }} br={12} jc="center">
      <YStack gap="$4" mx="auto" jc="center" ai="center">
        <Stack gap="$6">
          <Label fontFamily={'$mono'} col="$olive" ta="left" fontSize={'$5'}>
            Rewards
          </Label>
          <Stack>
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
            {rewardValue && (
              <Paragraph fontFamily={'$mono'} col="$color8" opacity={0.6}>
                {`${rewardValue.toFixed(2)} USD`}
              </Paragraph>
            )}
          </Stack>
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

const DistributionRewardsList = ({
  distributions,
}: { distributions?: (UseDistributionsResultData[number] | undefined)[] }) => {
  const { isLoading, error } = useDistributions()
  const [queryParams, setParams] = useRewardsScreenParams()

  const isDark = useThemeName().includes('dark')

  if (error) throw error

  if (isLoading) return <DistributionRewardsSkeleton />

  if (!distributions) return <DistributionRewardsSkeleton />

  return (
    <Stack my="auto">
      <ScrollView
        $gtLg={{ f: 1 }}
        my="auto"
        overflow="scroll"
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        pb="$5"
      >
        <XStack w="100%" gap="$2" jc={'space-between'} maw={1072} mx="auto">
          {distributions?.map((distribution, i) => {
            return distribution?.id === undefined ? (
              <Card f={1} maw={84} miw="$7" h="$2" br={6} disabled jc="center" opacity={0.5}>
                <Paragraph
                  size={'$1'}
                  padding={'unset'}
                  ta="center"
                  margin={'unset'}
                  col="$color12"
                >
                  {`# ${i + 1}`}
                </Paragraph>
              </Card>
            ) : queryParams.distribution === distribution?.number ||
              (queryParams.distribution === undefined &&
                distribution?.number === distributions?.length) ? (
              <Stack key={distribution?.number ?? i + 1} maw={84} miw="$7" h="$2" jc="center">
                <View
                  theme="green_alt1"
                  position="absolute"
                  top={-5}
                  left={0}
                  right={0}
                  mx="auto"
                  w={0}
                  h={0}
                  borderLeftColor={'transparent'}
                  borderRightColor={'transparent'}
                  borderBottomColor={'$background'}
                  borderBottomWidth={8}
                  borderLeftWidth={8}
                  borderRightWidth={8}
                />
                <Button
                  theme="green"
                  onPress={() =>
                    setParams({ distribution: distribution?.number }, { webBehavior: 'replace' })
                  }
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
                maw={84}
                miw="$7"
                h="$2"
                br={6}
                theme={isDark ? 'green_alt2' : undefined}
                $theme-light={{ bc: '$color2' }}
                onPress={() =>
                  setParams({ distribution: distribution?.number }, { webBehavior: 'replace' })
                }
              >
                <ButtonText
                  size={'$1'}
                  padding={'unset'}
                  ta="center"
                  margin={'unset'}
                  col="$color12"
                >
                  {`# ${distribution?.number}  `}
                </ButtonText>
              </Button>
            )
          })}
        </XStack>
      </ScrollView>
    </Stack>
  )
}

const DistributionRewardsSkeleton = () => {
  return null
}
