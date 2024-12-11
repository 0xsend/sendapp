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
import { type sendTokenAddress, useReadSendTokenBalanceOf } from '@my/wagmi'
import { CheckCircle2 } from '@tamagui/lucide-icons'
import { IconAccount, IconInfoCircle } from 'app/components/icons'
import {
  useDistributionVerifications,
  useMonthlyDistributions,
  type UseDistributionsResultData,
} from 'app/utils/distributions'
import formatAmount from 'app/utils/formatAmount'
import { zeroAddress } from 'viem'
import type { PropsWithChildren } from 'react'
import { DistributionClaimButton } from '../components/DistributionClaimButton'
import { useSendAccount } from 'app/utils/send-accounts'
import type { Tables } from '@my/supabase/database-generated.types'
import type { UseQueryResult } from '@tanstack/react-query'
import type { PostgrestError } from '@supabase/postgrest-js'
import { DistributionSelect } from '../components/DistributionSelect'
import { useRewardsScreenParams } from 'app/routers/params'

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
        {!distributions[selectedDistributionIndex] ? (
          <Paragraph color={'$color10'} size={'$5'}>
            No rewards available
          </Paragraph>
        ) : (
          <>
            <DistributionRequirementsCard
              distribution={distributions[selectedDistributionIndex]}
              verificationsQuery={verificationsQuery}
            />
            <TasksCards
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
        )}
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
  verificationsQuery: UseQueryResult<Tables<'distribution_verifications_summary'>, PostgrestError>
}) => {
  const { data: sendAccount, isLoading: isLoadingSendAccount } = useSendAccount()
  const verifications = verificationsQuery.data
  const {
    data: snapshotBalance,
    isLoading: isLoadingSnapshotBalance,
    error: snapshotBalanceError,
  } = useReadSendTokenBalanceOf({
    chainId: distribution.chain_id as keyof typeof sendTokenAddress,
    args: [sendAccount?.address ?? zeroAddress],
    blockNumber: distribution.snapshot_block_num
      ? BigInt(distribution.snapshot_block_num)
      : undefined,
    query: {
      enabled: Boolean(sendAccount?.address),
    },
  })
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
    (acc, curr) => acc + (curr.type === 'tag_registration' ? curr.weight : 0),
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
                {`${formatAmount(snapshotBalance?.toString() ?? 0, 9, 0)} SEND`}
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
              Min. Balance {formatAmount(distribution.hodler_min_balance, 9, 0)}
            </Paragraph>
            {(() => {
              switch (true) {
                case isLoadingSnapshotBalance:
                  return <Spinner size="small" />
                case distribution.hodler_min_balance === undefined ||
                  distribution.hodler_min_balance > (snapshotBalance ?? 0):
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

const TasksCards = ({
  distribution,
  verificationsQuery,
}: {
  distribution: UseDistributionsResultData[number]
  verificationsQuery: UseQueryResult<Tables<'distribution_verifications_summary'>, PostgrestError>
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
          ?.filter(
            ({ fixed_value, weight }) =>
              (fixed_value > 0 && !isQualificationOver) ||
              (isQualificationOver && weight !== 0 && fixed_value > 0)
          )
          .sort((a, b) => {
            const orderA = Object.keys(verificationTypesAndTitles).indexOf(a.type)
            const orderB = Object.keys(verificationTypesAndTitles).indexOf(b.type)
            return orderA - orderB
          })
          .map(({ type: verificationType, weight, metadata }) => (
            <PerkCard
              key={verificationType}
              type={verificationType}
              isCompleted={Boolean(weight)}
              weight={
                ['send_ten', 'send_one_hundred'].includes(verificationType)
                  ? metadata?.[0]?.value ?? 0
                  : weight
              }
            >
              <H3 fontWeight={'600'} color={'$color12'}>
                {verificationTypesAndTitles[verificationType]?.title}
              </H3>
            </PerkCard>
          ))}
      </Stack>
    </YStack>
  )
}

const PerkCard = ({
  type,
  isCompleted,
  weight,
  children,
}: PropsWithChildren<CardProps> & { type: string; isCompleted: boolean; weight?: number }) => {
  return (
    <Card br={12} gap="$4" p="$6" jc={'space-between'} $gtSm={{ maw: 331 }} w={'100%'}>
      <XStack ai={'center'} jc="space-between">
        {isCompleted ? (
          <>
            <XStack ai="center" gap="$2">
              <CheckCircle2 $theme-light={{ color: '$color12' }} color="$primary" size={'$1.5'} />
              <Paragraph color="$color11">Completed</Paragraph>
            </XStack>
            {(type === 'send_streak' || type === 'tag_registration') && (
              <Paragraph
                ff={'$mono'}
                py={'$size.0.5'}
                px={'$size.0.9'}
                borderWidth={1}
                borderColor={'$primary'}
                $theme-light={{ borderColor: '$color12' }}
                borderRadius={'$4'}
              >
                {weight ?? 0}
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
              {weight ?? 0}
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
  verificationsQuery: UseQueryResult<Tables<'distribution_verifications_summary'>, PostgrestError>
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
      (isQualificationOver && Boolean(value) && value > 1.0)
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
              X {value ?? 1}
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
  verificationsQuery: UseQueryResult<Tables<'distribution_verifications_summary'>, PostgrestError>
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

  const sendSlash = distribution.send_slash.at(0)
  const sendCeiling = verifications?.verification_values?.find(
    ({ type }) => type === 'send_ceiling'
  )

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
      (acc, curr) => acc + curr.amount_after_slash,
      0
    ) || distribution.hodler_min_balance

  const scaledPreviousReward = previousReward / sendSlash?.scaling_divisor
  const sendCeilingWeight = sendCeiling?.weight ?? 0

  const progress = (Math.min(sendCeilingWeight, scaledPreviousReward) / scaledPreviousReward) * 100
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
  const shareAmount = distribution.distribution_shares?.[0]?.amount_after_slash
  if (shareAmount === undefined || shareAmount === 0) return null
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
            {shareAmount === undefined ? 'N/A' : `${formatAmount(shareAmount, 10, 0)} SEND`}
          </Paragraph>
          <DistributionClaimButton distribution={distribution} />
        </Stack>
      </Card>
    </YStack>
  )
}

ActivityRewardsScreen.displayName = 'ActivityRewardsScreen'
