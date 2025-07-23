import {
  Card,
  type CardProps,
  FadeCard,
  H3,
  Label,
  Paragraph,
  Spinner,
  Stack,
  Theme,
  XStack,
  YStack,
} from '@my/ui'
import { CheckCircle2 } from '@tamagui/lucide-icons'
import { IconAccount, IconInfoCircle } from 'app/components/icons'
import {
  type DistributionsVerificationsQuery,
  type UseDistributionsResultData,
  useDistributionVerifications,
  useMonthlyDistributions,
  useSnapshotBalance,
} from 'app/utils/distributions'
import formatAmount from 'app/utils/formatAmount'
import { formatUnits } from 'viem'
import { useMemo, type PropsWithChildren } from 'react'
import { DistributionClaimButton } from '../components/DistributionClaimButton'
import { useSendAccount } from 'app/utils/send-accounts'
import { DistributionSelect } from '../components/DistributionSelect'
import { useRewardsScreenParams } from 'app/routers/params'
import { isEqualCalendarDate } from 'app/utils/dateHelper'
import { toNiceError } from 'app/utils/toNiceError'
import { min } from 'app/utils/bigint'
import type { Json } from '@my/supabase/database.types'
import { sendCoin, usdcCoin } from 'app/data/coins'
import { useSendEarnBalancesAtBlock } from 'app/features/earn/hooks'
import { useThemeName } from 'tamagui'
import { Platform } from 'react-native'

//@todo get this from the db
const verificationTypesAndTitles = {
  create_passkey: { title: 'Create a Passkey' },
  tag_registration: { title: 'Purchase a Sendtag', details: '(per tag)' },
  send_ten: { title: '10+ Sends' },
  send_one_hundred: { title: '100+ Sends' },
  tag_referral: { title: 'Referrals' },
  total_tag_referrals: { title: 'Total Referrals' },
  send_streak: { title: 'Send Streak', details: '(per day)' },
} as const

export function ActivityRewardsScreen() {
  const [queryParams, setRewardsScreenParams] = useRewardsScreenParams()
  const distribution = queryParams.distribution
  const { data: distributions, isLoading } = useMonthlyDistributions()
  const selectedDistributionIndex =
    distributions !== undefined && distributions.length <= (distribution ?? 0)
      ? distributions?.findIndex((d) => d.number === distribution)
      : 0

  const verificationsQuery = useDistributionVerifications(
    distribution ?? distributions?.[0]?.number
  )
  const onValueChange = (value: string) => {
    const newDistribution = distributions?.[Number(value)]
    if (newDistribution?.number === distribution) return
    setRewardsScreenParams({ distribution: newDistribution?.number })
  }

  if (isLoading) {
    return (
      <YStack f={1} pt={'$6'} $gtLg={{ pt: '$0' }} gap={'$7'}>
        <Stack w="100%" f={1} jc={'center'} ai={'center'}>
          <Spinner color="$color12" size="large" />
        </Stack>
      </YStack>
    )
  }

  if (!distributions?.length) {
    return (
      <YStack f={1} pt={'$6'} $gtLg={{ pt: '$0' }} gap={'$7'}>
        <Stack w="100%" f={1} jc={'center'} ai={'center'}>
          <Paragraph color={'$color10'} size={'$5'}>
            No rewards available
          </Paragraph>
        </Stack>
      </YStack>
    )
  }

  const distributionDates = distributions?.map(
    (d) =>
      `${d.timezone_adjusted_qualification_end.toLocaleString('default', {
        month: 'long',
      })} ${d.timezone_adjusted_qualification_end.toLocaleString('default', { year: 'numeric' })}`
  )

  return (
    <YStack f={1} pb={'$12'} pt={'$6'} $gtLg={{ pt: '$0' }} gap={'$7'}>
      <XStack w={'100%'} jc={'space-between'} ai={'center'}>
        <H3 fontWeight={'600'} color={'$color12'} pr={'$2'}>
          {`${distributionDates[selectedDistributionIndex]?.split(' ')[0] ?? 'Monthly'} Rewards`}
        </H3>
        {distributions.length > 1 ? (
          <DistributionSelect
            distributions={distributions}
            selectedIndex={selectedDistributionIndex}
            onValueChange={onValueChange}
          />
        ) : null}
      </XStack>
      <YStack f={1} w={'100%'} gap={'$7'}>
        {(() => {
          switch (true) {
            case verificationsQuery.isLoading:
              return <Spinner size="small" color={'$color12'} />
            case verificationsQuery.isError:
              return (
                <Paragraph color={'$error'} size={'$5'}>
                  Error fetching verifications. {toNiceError(verificationsQuery.error)}
                </Paragraph>
              )
            case !distributions[selectedDistributionIndex]:
              return (
                <Paragraph color={'$color10'} size={'$5'}>
                  No rewards available
                </Paragraph>
              )
            default:
              return (
                <>
                  <DistributionRequirementsCard
                    distribution={distributions[selectedDistributionIndex]}
                    verificationsQuery={verificationsQuery}
                  />
                  <TaskCards
                    distribution={distributions[selectedDistributionIndex]}
                    verificationsQuery={verificationsQuery}
                  />
                  <MultiplierCards
                    distribution={distributions[selectedDistributionIndex]}
                    verificationsQuery={verificationsQuery}
                  />
                  <ProgressCard
                    distribution={distributions[selectedDistributionIndex]}
                    previousDistribution={distributions[selectedDistributionIndex + 1]}
                    verificationsQuery={verificationsQuery}
                  />
                  <ClaimableRewardsCard distribution={distributions[selectedDistributionIndex]} />
                </>
              )
          }
        })()}
      </YStack>
    </YStack>
  )
}

const DistributionRequirementsCard = ({
  distribution,
  verificationsQuery,
}: {
  distribution: UseDistributionsResultData[number]
  verificationsQuery: DistributionsVerificationsQuery
}) => {
  const theme = useThemeName()
  const isDark = theme?.startsWith('dark')
  const { data: sendAccount, isLoading: isLoadingSendAccount } = useSendAccount()
  const verifications = verificationsQuery.data
  const {
    data: snapshotBalance,
    isLoading: isLoadingSnapshotBalance,
    error: snapshotBalanceError,
  } = useSnapshotBalance({ distribution, sendAccount })

  const { data: sendEarnBalances, isLoading: isLoadingSendEarnBalances } =
    useSendEarnBalancesAtBlock(
      distribution.snapshot_block_num ? BigInt(distribution.snapshot_block_num) : null
    )

  const totalAssets = useMemo(
    () => sendEarnBalances?.reduce((sum, { assets }) => sum + assets, 0n) ?? 0n,
    [sendEarnBalances]
  )

  const hasMinSavings = totalAssets >= BigInt(distribution.earn_min_balance)

  if (verificationsQuery.isLoading || isLoadingSendAccount) {
    return (
      <FadeCard br={12} $gtMd={{ gap: '$4', p: '$7' }} p="$5">
        <Stack ai="center" jc="center" p="$4">
          <Spinner color="$color12" size="large" />
        </Stack>
      </FadeCard>
    )
  }

  if (snapshotBalanceError) throw snapshotBalanceError

  const sendTagRegistrations = verifications?.verification_values?.reduce(
    (acc, curr) => acc + (curr.type === 'tag_registration' ? 1 : 0),
    0
  )

  return (
    <FadeCard br={12} p="$4" gap="$4" $gtMd={{ gap: '$6', p: '$6' }}>
      <Stack ai="center" jc="space-between" gap="$5" $gtXs={{ flexDirection: 'row' }}>
        <YStack>
          <Label fontSize={'$5'} col={'$color10'} miw={120}>
            Your SEND Balance
          </Label>
          {isLoadingSnapshotBalance ? (
            <Spinner size="small" color={'$color11'} />
          ) : (
            <Theme reset>
              <Paragraph
                fontFamily={'$mono'}
                fontWeight={'500'}
                color={'$color12'}
                lh={35}
                fontSize={'$9'}
                $gtXl={{ fontSize: '$10' }}
              >
                {`${formatAmount(
                  formatUnits(snapshotBalance ?? 0n, distribution.token_decimals ?? 18) ?? 0,
                  9,
                  0
                )} SEND`}
              </Paragraph>
            </Theme>
          )}
        </YStack>
        <YStack gap="$2" ai={'flex-end'}>
          <XStack ai="center" gap="$2">
            <Paragraph>Sendtag Purchased</Paragraph>
            {sendTagRegistrations ? (
              <CheckCircle2 color={isDark ? '$primary' : '$color12'} size={'$1.5'} />
            ) : (
              <Theme name="red">
                <IconInfoCircle color={'$color8'} size={'$2'} />
              </Theme>
            )}
          </XStack>
          <XStack ai="center" gap="$2">
            <Paragraph>
              Balance{' '}
              {formatAmount(
                formatUnits(
                  BigInt(distribution.hodler_min_balance ?? 0n),
                  distribution.token_decimals ?? 18
                ) ?? 0,
                9,
                sendCoin.formatDecimals
              )}
            </Paragraph>
            {(() => {
              switch (true) {
                case isLoadingSnapshotBalance:
                  return <Spinner size="small" />
                case distribution.hodler_min_balance === undefined ||
                  BigInt(distribution.hodler_min_balance ?? 0n) > (snapshotBalance ?? 0):
                  return (
                    <Theme name="red">
                      <IconInfoCircle color={'$color8'} size={'$2'} />
                    </Theme>
                  )
                default:
                  return <CheckCircle2 color={isDark ? '$primary' : '$color12'} size={'$1.5'} />
              }
            })()}
          </XStack>
          {BigInt(distribution.earn_min_balance ?? 0n) > 0n ? (
            <XStack ai="center" gap="$2">
              <Paragraph>
                Savings Deposit $
                {formatAmount(
                  formatUnits(BigInt(distribution.earn_min_balance ?? 0n), usdcCoin.decimals) ?? 0n,
                  9,
                  2
                )}{' '}
              </Paragraph>
              {(() => {
                switch (true) {
                  case isLoadingSendEarnBalances:
                    return <Spinner size="small" />
                  case !hasMinSavings:
                    return (
                      <Theme name="red">
                        <IconInfoCircle color={'$color8'} size={'$2'} />
                      </Theme>
                    )
                  default:
                    return <CheckCircle2 color={isDark ? '$primary' : '$color12'} size={'$1.5'} />
                }
              })()}
            </XStack>
          ) : null}
        </YStack>
      </Stack>
    </FadeCard>
  )
}

const TaskCards = ({
  distribution,
  verificationsQuery,
}: {
  distribution: UseDistributionsResultData[number]
  verificationsQuery: DistributionsVerificationsQuery
}) => {
  const verifications = verificationsQuery.data
  if (verificationsQuery.isLoading) {
    return (
      <YStack f={1} w={'100%'} gap="$5">
        <H3 fontWeight={'600'} color={'$color12'}>
          Tasks
        </H3>
        <Card br={12} $gtMd={{ gap: '$4', p: '$7' }} p="$5">
          <Stack ai="center" jc="center" p="$4">
            <Spinner color="$color12" size="large" />
          </Stack>
        </Card>
      </YStack>
    )
  }

  const now = new Date()
  const isQualificationOver = distribution.qualification_end < now

  return (
    <YStack f={1} w={'100%'} gap="$5">
      <H3 fontWeight={'600'} color={'$color12'}>
        Tasks
      </H3>
      <Stack flexWrap="wrap" gap="$5" $gtXs={{ fd: 'row' }}>
        {verifications?.verification_values
          ?.map((verification) => ({
            ...verification,
            weight: BigInt(verification.weight ?? 0),
            fixed_value: BigInt(verification.fixed_value ?? 0),
          }))
          ?.filter(
            ({ fixed_value, weight }) =>
              (fixed_value > 0 && !isQualificationOver) ||
              (isQualificationOver && weight !== 0n && fixed_value > 0n)
          )
          .sort((a, b) => {
            const orderA = Object.keys(verificationTypesAndTitles).indexOf(a.type)
            const orderB = Object.keys(verificationTypesAndTitles).indexOf(b.type)
            return orderA - orderB
          })
          .map((verification) => (
            <TaskCard
              key={verification.type}
              verification={verification}
              isQualificationOver={isQualificationOver}
            >
              <H3 fontWeight={'600'} color={'$color12'}>
                {verificationTypesAndTitles[verification.type]?.title}
              </H3>
            </TaskCard>
          ))}
      </Stack>
    </YStack>
  )
}

const TaskCard = ({
  verification,
  isQualificationOver,
  children,
}: PropsWithChildren<CardProps> & {
  verification: NonNullable<DistributionsVerificationsQuery['data']>['verification_values'][number]
  isQualificationOver: boolean
}) => {
  const type = verification.type
  const metadata = (verification.metadata ?? []) as Json[]
  const weight = verification.weight
  const value = ['send_ten', 'send_one_hundred'].includes(type)
    ? //@ts-expect-error these two verfiications will always have "value" in the metadata
      BigInt(metadata?.[0]?.value ?? 0)
    : weight
  const isSendStreak = type === 'send_streak'
  const isTagRegistration = type === 'tag_registration'
  const isCompleted = isSendStreak
    ? isEqualCalendarDate(new Date(verification.created_at), new Date()) ||
      (Boolean(weight) && isQualificationOver)
    : Boolean(weight)
  const theme = useThemeName()
  const isDark = theme?.startsWith('dark')

  const displayValue = isTagRegistration ? verification.count.toString() : value.toString()

  const statusConfig = {
    completed: {
      icon: <CheckCircle2 color={isDark ? '$primary' : '$color12'} size={'$1.5'} />,
      text: isSendStreak && !isQualificationOver ? 'Ongoing' : 'Completed',
    },
    pending: {
      icon: (
        <Theme name="red">
          <IconInfoCircle color={'$color8'} size={'$2'} />
        </Theme>
      ),
      text: 'Pending',
    },
  }

  const { icon, text } = statusConfig[isCompleted ? 'completed' : 'pending']

  const status = (
    <XStack ai="center" gap="$2">
      {icon}
      <Paragraph color="$color11">{text}</Paragraph>
    </XStack>
  )

  const shouldShowValue = [
    'send_streak',
    'tag_registration',
    'send_ten',
    'send_one_hundred',
  ].includes(type)

  return (
    <Card br={12} gap="$4" p="$6" jc={'space-between'} $gtSm={{ maw: 331 }} w={'100%'}>
      <XStack ai={'center'} jc="space-between">
        {status}
        {shouldShowValue ? (
          <XStack
            borderWidth={1}
            borderColor={isDark ? '$primary' : '$color12'}
            ai={'center'}
            jc={'center'}
            borderRadius={'$4'}
          >
            <Paragraph ff={'$mono'} p={'$2'} lineHeight={16}>
              {displayValue}
            </Paragraph>
          </XStack>
        ) : null}
      </XStack>
      {children}
    </Card>
  )
}

const MultiplierCards = ({
  distribution,
  verificationsQuery,
}: {
  distribution: UseDistributionsResultData[number]
  verificationsQuery: DistributionsVerificationsQuery
}) => {
  const verifications = verificationsQuery.data
  if (verificationsQuery.isLoading) {
    return (
      <YStack f={1} w={'100%'} gap="$5">
        <H3 fontWeight={'600'} color={'$color12'}>
          Multiplier
        </H3>
        <FadeCard br={12} $gtMd={{ gap: '$4', p: '$7' }} p="$5">
          <Stack ai="center" jc="center" p="$4">
            <Spinner color="$color12" size="large" />
          </Stack>
        </FadeCard>
      </YStack>
    )
  }
  const now = new Date()
  const isQualificationOver = distribution.qualification_end < now
  const multipliers = verifications?.multipliers
  const activeMultipliers = multipliers?.filter(
    ({ value, multiplier_step, multiplier_max }) =>
      (!isQualificationOver && multiplier_step > 0.0 && multiplier_max > 1.0) ||
      (isQualificationOver && Boolean(value) && (value ?? 0) > 1.0)
  )

  const distributionMonth = distribution.timezone_adjusted_qualification_end.toLocaleString(
    'default',
    {
      month: 'long',
    }
  )

  if (!activeMultipliers || activeMultipliers.length === 0) return null

  return (
    <YStack f={1} w={'100%'} gap="$5">
      <H3 fontWeight={'600'} color={'$color12'}>
        Multiplier
      </H3>
      <Stack flexWrap="wrap" gap="$5" $gtXs={{ fd: 'row' }}>
        {activeMultipliers.map(({ type: verificationType, value }) => (
          <MultiplierCard key={verificationType}>
            <XStack ai="center" gap="$2" jc="center">
              <IconAccount size={'$2'} color={'$color10'} />
              <H3 fontWeight={'500'} color={'$color10'}>
                {verificationType === 'tag_referral' ? (distributionMonth ?? 'Monthly') : ''}{' '}
                {verificationTypesAndTitles[verificationType]?.title}
              </H3>
            </XStack>
            <Paragraph
              fontSize={'$9'}
              $sm={{ fontSize: '$8' }}
              fontWeight={'600'}
              color={'$color12'}
              lineHeight={22}
              mx="auto"
            >
              X {(value ?? 1).toString()}
            </Paragraph>
          </MultiplierCard>
        ))}
      </Stack>
    </YStack>
  )
}

const MultiplierCard = ({ children }: PropsWithChildren<CardProps>) => {
  return (
    <FadeCard
      br={'$6'}
      p="$6"
      jc={'center'}
      ai={'center'}
      mih={112}
      style={{ width: 'fit-content' }}
    >
      <XStack
        ai="center"
        w={'100%'}
        jc="space-between"
        $gtXs={{ gap: '$7' }}
        gap={'$5'}
        flexWrap="wrap"
      >
        {children}
      </XStack>
    </FadeCard>
  )
}

const ProgressCard = ({
  distribution,
  previousDistribution,
  verificationsQuery,
}: {
  distribution: UseDistributionsResultData[number]
  previousDistribution?: UseDistributionsResultData[number]
  verificationsQuery: DistributionsVerificationsQuery
}) => {
  const sendSlash = distribution.send_slash.at(0)

  if (!sendSlash) {
    return null
  }

  const verifications = verificationsQuery.data

  if (verificationsQuery.isLoading) {
    return (
      <FadeCard br={12} $gtMd={{ gap: '$4' }} p="$6">
        <Stack ai="center" jc="center" p="$4">
          <Spinner color="$color12" size="large" />
        </Stack>
      </FadeCard>
    )
  }

  if (verificationsQuery.isError || !verifications) {
    return null
  }

  const sendCeiling = verifications.verification_values.find(({ type }) => type === 'send_ceiling')

  if (!sendCeiling) {
    return (
      <YStack f={1} w={'100%'} gap="$5">
        <H3 fontWeight={'600'} color={'$color12'}>
          Progress
        </H3>
        <FadeCard br={'$6'} p="$7" $xs={{ p: '$5' }} w={'100%'} maw={500}>
          <Progress progress={0} />
        </FadeCard>
      </YStack>
    )
  }
  const previousReward =
    previousDistribution?.distribution_shares?.reduce(
      (acc, curr) =>
        acc +
        (verifications.distributionNumber === 11
          ? BigInt(curr.amount) * BigInt(1e16)
          : BigInt(curr.amount)),
      0n
    ) || BigInt(distribution.hodler_min_balance)

  const scaledPreviousReward = BigInt(previousReward) / BigInt(sendSlash?.scaling_divisor)
  const sendCeilingWeight = sendCeiling?.weight ?? BigInt(0)
  // up to 2 decimals for the progress bar
  const progress =
    scaledPreviousReward === 0n
      ? 0
      : Number(
          (min(sendCeilingWeight, scaledPreviousReward) * BigInt(10000)) / scaledPreviousReward
        ) / 100

  return (
    <YStack f={1} w={'100%'} gap="$5">
      <H3 fontWeight={'600'} color={'$color12'}>
        Progress
      </H3>
      <FadeCard br={'$6'} p="$6" w={'100%'} maw={500}>
        <Progress progress={progress} />
      </FadeCard>
    </YStack>
  )
}

const Progress = ({ progress }: { progress: number }) => {
  const theme = useThemeName()
  const isDark = theme?.startsWith('dark')

  return (
    <YStack gap="$4" w="100%">
      <XStack jc="flex-end">
        <XStack borderWidth={1} borderColor={isDark ? '$primary' : '$color12'} borderRadius={'$4'}>
          <Paragraph ff={'$mono'} p={'$2'} lineHeight={16}>
            {progress.toFixed(1)}%
          </Paragraph>
        </XStack>
      </XStack>
      <Stack w="100%" h="$1" br="$10" bc="$color3">
        <Stack
          w={`${progress.toFixed(1)}%`}
          h="100%"
          br="$10"
          animation="quick"
          bc={isDark ? '$primary' : '$color12'}
        />
      </Stack>
    </YStack>
  )
}

const ClaimableRewardsCard = ({
  distribution,
}: {
  distribution: UseDistributionsResultData[number]
}) => {
  const shareAmount = BigInt(distribution.distribution_shares?.[0]?.amount ?? 0n)
  if (shareAmount === undefined || shareAmount === 0n) return null
  const now = new Date()
  const isQualificationOver = distribution.qualification_end < now

  const distributionMonth = distribution.timezone_adjusted_qualification_end.toLocaleString(
    'default',
    {
      month: 'long',
    }
  )

  return (
    <YStack f={1} w={'100%'} gap="$5" $sm={{ display: Platform.OS === 'web' ? 'none' : undefined }}>
      <H3 fontWeight={'600'} color={'$color12'}>
        {isQualificationOver ? `Total ${distributionMonth}` : ` ${distributionMonth} Rewards`}
      </H3>
      <FadeCard br={'$6'} p="$7" ai={'center'} w={'100%'}>
        <Stack
          ai="center"
          jc="space-between"
          fd={Platform.OS === 'web' ? 'row' : 'column'}
          w="100%"
          gap={'$4'}
        >
          <Paragraph
            fontFamily={'$mono'}
            $gtXs={{ fontSize: '$10' }}
            fontSize={'$9'}
            fontWeight={'500'}
            lh={40}
          >
            {shareAmount === undefined
              ? 'N/A'
              : `${formatAmount(
                  formatUnits(shareAmount ?? 0n, distribution.token_decimals ?? 18) ?? 0n,
                  10,
                  sendCoin.formatDecimals
                )} SEND`}
          </Paragraph>
          <DistributionClaimButton distribution={distribution} />
        </Stack>
      </FadeCard>
    </YStack>
  )
}

ActivityRewardsScreen.displayName = 'ActivityRewardsScreen'
