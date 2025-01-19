import {
  YStack,
  H1,
  Paragraph,
  XStack,
  Image,
  LinearGradient,
  Stack,
  Spinner,
  H3,
  Card,
  Label,
  Theme,
  type CardProps,
} from '@my/ui'
import { CheckCircle2 } from '@tamagui/lucide-icons'
import { IconAccount, IconInfoCircle } from 'app/components/icons'
import {
  type DistributionsVerificationsQuery,
  useDistributionVerifications,
  useMonthlyDistributions,
  type UseDistributionsResultData,
  useSnapshotBalance,
} from 'app/utils/distributions'
import formatAmount from 'app/utils/formatAmount'
import { formatUnits } from 'viem'
import type { PropsWithChildren } from 'react'
import { DistributionClaimButton } from '../components/DistributionClaimButton'
import { useSendAccount } from 'app/utils/send-accounts'
import { DistributionSelect } from '../components/DistributionSelect'
import { useRewardsScreenParams } from 'app/routers/params'
import { isEqualCalendarDate } from 'app/utils/dateHelper'
import { toNiceError } from 'app/utils/toNiceError'
import { min } from 'app/utils/bigint'

//@todo get this from the db
const verificationTypesAndTitles = {
  create_passkey: { title: 'Create a Passkey' },
  tag_registration: { title: 'Register a Sendtag', details: '(per tag)' },
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

  const verificationsQuery = useDistributionVerifications(distribution ?? distributions?.[0]?.id)
  const onValueChange = (value: string) => {
    const newDistribution = distributions?.[Number(value)]
    if (newDistribution?.number === distribution) return
    setRewardsScreenParams({ distribution: newDistribution?.number })
  }

  if (isLoading) {
    return (
      <YStack f={1} pt={'$6'} $gtLg={{ pt: '$0' }} gap={'$7'}>
        <Header />
        <Stack w="100%" f={1} jc={'center'} ai={'center'}>
          <Spinner color="$color12" size="large" />
        </Stack>
      </YStack>
    )
  }

  if (!distributions?.length) {
    return (
      <YStack f={1} pt={'$6'} $gtLg={{ pt: '$0' }} gap={'$7'}>
        <Header />
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
      <Header />
      <XStack w={'100%'} jc={'space-between'} ai={'center'}>
        <H3 fontWeight={'600'} color={'$color12'} pr={'$2'}>
          {`${distributionDates[selectedDistributionIndex]?.split(' ')[0] ?? 'Monthly'} Rewards`}
        </H3>
        {distributions.length > 1 && (
          <DistributionSelect
            distributions={distributions}
            selectedIndex={selectedDistributionIndex}
            onValueChange={onValueChange}
          />
        )}
      </XStack>
      <YStack f={1} w={'100%'} gap={'$7'}>
        {(() => {
          switch (true) {
            case verificationsQuery.isLoading:
              return <Spinner size="small" color={'$color12'} />
            case verificationsQuery.isError:
              return (
                <Paragraph color={'$color10'} size={'$5'}>
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

const Header = () => (
  <Stack w={'100%'} h={224} position="relative" jc={'center'} br={'$6'} overflow="hidden">
    <Image
      pos={'absolute'}
      br={'$6'}
      t={0}
      zIndex={0}
      bc="$black"
      source={{
        height: 1024,
        width: 1024,
        uri: 'https://ghassets.send.app/app_images/flower.jpg',
      }}
      h={'100%'}
      w={'100%'}
      $sm={{
        scale: 1.5,
      }}
      objectFit="cover"
    />
    <LinearGradient
      pos={'absolute'}
      br={'$6'}
      t={0}
      start={[0, 0]}
      end={[0, 1]}
      fullscreen
      colors={['$darkest', 'transparent', '$darkest']}
    />

    <YStack p="$4" pt={'$3'} position="absolute" zIndex={1}>
      <H1 tt={'uppercase'} color={'white'} size={'$9'} $gtMd={{ size: '$10' }}>
        Unlock <br />
        Extra Rewards
      </H1>
      <Paragraph
        color="$darkAlabaster"
        size={'$2'}
        $gtMd={{
          size: '$5',
        }}
      >
        Register at least 1 Sendtag, maintain the minimum balance,
        <br /> avoid selling, and refer others for a bonus multiplier.
      </Paragraph>
    </YStack>
  </Stack>
)

const DistributionRequirementsCard = ({
  distribution,
  verificationsQuery,
}: {
  distribution: UseDistributionsResultData[number]
  verificationsQuery: DistributionsVerificationsQuery
}) => {
  const { data: sendAccount, isLoading: isLoadingSendAccount } = useSendAccount()
  const verifications = verificationsQuery.data
  const {
    data: snapshotBalance,
    isLoading: isLoadingSnapshotBalance,
    error: snapshotBalanceError,
  } = useSnapshotBalance({ distribution, sendAccount })
  if (verificationsQuery.isLoading || isLoadingSendAccount) {
    return (
      <Card br={12} $gtMd={{ gap: '$4', p: '$7' }} p="$5">
        <Stack ai="center" jc="center" p="$4">
          <Spinner color="$color12" size="large" />
        </Stack>
      </Card>
    )
  }

  if (snapshotBalanceError) throw snapshotBalanceError

  const sendTagRegistrations = verifications?.verification_values?.reduce(
    (acc, curr) => acc + (curr.type === 'tag_registration' ? Number(curr.weight) : 0),
    0
  )

  return (
    <Card br={12} p="$6" gap="$4" $gtMd={{ gap: '$6' }}>
      <Stack ai="center" jc="space-between" gap="$5" $gtXs={{ flexDirection: 'row' }}>
        <YStack gap="$2">
          <Label fontSize={'$5'} col={'$color10'} miw={120} lh={20}>
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
                lh={'$8'}
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
            <Paragraph>Sendtag Registered</Paragraph>
            {sendTagRegistrations ? (
              <CheckCircle2 $theme-light={{ color: '$color12' }} color="$primary" size={'$1.5'} />
            ) : (
              <Theme name="red">
                <IconInfoCircle color={'$color8'} size={'$1'} />
              </Theme>
            )}
          </XStack>
          <XStack ai="center" gap="$2">
            <Paragraph>
              Min. Balance{' '}
              {formatAmount(
                formatUnits(
                  BigInt(distribution.hodler_min_balance ?? 0n),
                  distribution.token_decimals ?? 18
                ) ?? 0,
                9,
                0
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
                      <IconInfoCircle color={'$color8'} size={'$1'} />
                    </Theme>
                  )
                default:
                  return (
                    <CheckCircle2
                      $theme-light={{ color: '$color12' }}
                      color="$primary"
                      size={'$1.5'}
                    />
                  )
              }
            })()}
          </XStack>
        </YStack>
      </Stack>
    </Card>
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
  const metadata = (verification.metadata ?? {}) as Record<string, number | string>
  const weight = verification.weight
  const value = ['send_ten', 'send_one_hundred'].includes(type)
    ? BigInt(metadata?.value ?? 0)
    : weight
  const isSendStreak = type === 'send_streak'
  const isTagRegistration = type === 'tag_registration'
  const isCompleted = (() => {
    if (isSendStreak) {
      // send streak is completed if the `created_at` date is same as today or the distribution is over and a weight is present
      const createdAt = new Date(verification.created_at)
      const today = new Date()
      return isEqualCalendarDate(createdAt, today) || (Boolean(weight) && isQualificationOver)
    }
    return Boolean(weight)
  })()

  return (
    <Card br={12} gap="$4" p="$6" jc={'space-between'} $gtSm={{ maw: 331 }} w={'100%'}>
      <XStack ai={'center'} jc="space-between">
        {isCompleted ? (
          <>
            <XStack ai="center" gap="$2">
              <CheckCircle2 $theme-light={{ color: '$color12' }} color="$primary" size={'$1.5'} />
              <Paragraph color="$color11">
                {isSendStreak && !isQualificationOver ? 'Ongoing' : 'Completed'}
              </Paragraph>
            </XStack>
            {(isSendStreak || isTagRegistration) && (
              <Paragraph
                ff={'$mono'}
                py={'$size.0.5'}
                px={'$size.0.9'}
                borderWidth={1}
                borderColor={'$primary'}
                $theme-light={{ borderColor: '$color12' }}
                borderRadius={'$4'}
              >
                {(value ?? 0).toString()}
              </Paragraph>
            )}
          </>
        ) : (
          <>
            <XStack ai="center" gap="$2">
              <Theme name="red">
                <IconInfoCircle color={'$color8'} size={'$1'} />
              </Theme>
              <Paragraph color="$color11">Pending</Paragraph>
            </XStack>
            <Paragraph
              ff={'$mono'}
              py={'$size.0.5'}
              px={'$size.0.9'}
              borderWidth={1}
              borderColor={'$primary'}
              $theme-light={{ borderColor: '$color12' }}
              borderRadius={'$4'}
            >
              {(value ?? 0).toString()}
            </Paragraph>
          </>
        )}
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
              <IconAccount size={'2'} color={'$color10'} />
              <H3 fontWeight={'500'} color={'$color10'}>
                {verificationType === 'tag_referral' ? distributionMonth ?? 'Monthly' : ''}{' '}
                {verificationTypesAndTitles[verificationType]?.title}
              </H3>
            </XStack>
            <Paragraph
              fontSize={'$9'}
              $sm={{ fontSize: '$8' }}
              fontWeight={'600'}
              color={'$color12'}
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
    <Card br={'$6'} p="$6" jc={'center'} ai={'center'} mih={112} w={'fit-content'}>
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
    </Card>
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
  const verifications = verificationsQuery.data

  if (verificationsQuery.isLoading) {
    return (
      <Card br={12} $gtMd={{ gap: '$4' }} p="$6">
        <Stack ai="center" jc="center" p="$4">
          <Spinner color="$color12" size="large" />
        </Stack>
      </Card>
    )
  }

  if (verificationsQuery.isError || !verifications) {
    return null
  }

  const sendSlash = distribution.send_slash.at(0)
  const sendCeiling = verifications.verification_values.find(({ type }) => type === 'send_ceiling')

  if (!sendSlash || !sendCeiling) {
    return (
      <YStack f={1} w={'100%'} gap="$5">
        <H3 fontWeight={'600'} color={'$color12'}>
          Progress
        </H3>
        <Card br={'$6'} p="$7" $xs={{ p: '$5' }} w={'100%'} maw={500}>
          <Progress progress={0} />
        </Card>
      </YStack>
    )
  }
  const previousReward =
    previousDistribution?.distribution_shares?.reduce(
      (acc, curr) => acc + BigInt(curr.amount_after_slash),
      0n
    ) ?? BigInt(distribution.hodler_min_balance)

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
      <Card br={'$6'} p="$6" w={'100%'} maw={500}>
        <Progress progress={progress} />
      </Card>
    </YStack>
  )
}

const Progress = ({
  progress,
}: {
  progress: number
}) => {
  return (
    <YStack gap="$4" w="100%">
      <XStack jc="flex-end">
        <Paragraph
          ff={'$mono'}
          py={'$size.0.5'}
          px={'$size.0.9'}
          borderWidth={1}
          borderColor={'$primary'}
          $theme-light={{ borderColor: '$color12' }}
          borderRadius={'$4'}
        >
          {progress.toFixed(1)}%
        </Paragraph>
      </XStack>
      <Stack w="100%" h="$1" br="$10" bc="$color3">
        <Stack
          w={`${progress.toFixed(1)}%`}
          h="100%"
          br="$10"
          animation="quick"
          $theme-light={{
            bc: '$color12',
          }}
          $theme-dark={{
            bc: '$primary',
          }}
        />
      </Stack>
    </YStack>
  )
}

const ClaimableRewardsCard = ({
  distribution,
}: { distribution: UseDistributionsResultData[number] }) => {
  const shareAmount = BigInt(distribution.distribution_shares?.[0]?.amount_after_slash ?? 0n)
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
    <YStack f={1} w={'100%'} gap="$5" $sm={{ display: 'none' }}>
      <H3 fontWeight={'600'} color={'$color12'}>
        {isQualificationOver ? `Total ${distributionMonth}` : ` ${distributionMonth} Rewards`}
      </H3>
      <Card br={'$6'} p="$7" ai={'center'} w={'100%'}>
        <Stack ai="center" jc="space-between" fd="row" w="100%">
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
                  0
                )} SEND`}
          </Paragraph>
          <DistributionClaimButton distribution={distribution} />
        </Stack>
      </Card>
    </YStack>
  )
}

ActivityRewardsScreen.displayName = 'ActivityRewardsScreen'
