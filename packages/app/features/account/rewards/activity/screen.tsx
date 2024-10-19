import {
  YStack,
  H1,
  Paragraph,
  XStack,
  Button,
  Image,
  LinearGradient,
  Stack,
  Spinner,
  Select,
  H3,
  Adapt,
  Sheet,
  type SelectItemProps,
  Card,
  Label,
  Theme,
  type CardProps,
} from '@my/ui'
import { useReadSendTokenBalanceOf } from '@my/wagmi'
import { CheckCircle2, ChevronDown, ChevronUp, Dot } from '@tamagui/lucide-icons'
import { IconAccount, IconInfoCircle, IconX } from 'app/components/icons'
import { useRewardsScreenParams } from 'app/routers/params'
import { useMonthlyDistributions, type UseDistributionsResultData } from 'app/utils/distributions'
import formatAmount from 'app/utils/formatAmount'
import { zeroAddress } from 'viem'
import { type PropsWithChildren, useRef, useId, useState } from 'react'
import { DistributionClaimButton } from '../components/DistributionClaimButton'

//@todo get this from the db
const verificationTypesAndTitles = [
  ['create_passkey', 'Create a Passkey'],
  ['tag_registration', 'Register a Sendtag', '(per tag)'],
  ['send_ten', '10+ Sends'],
  ['send_one_hundred', '100+ Sends'],
  ['tag_referral', 'Referrals'],
  ['total_tag_referrals', 'Total Referrals'],
] as const

export function ActivityRewardsScreen() {
  const [queryParams, setRewardsScreenParams] = useRewardsScreenParams()
  const { data: distributions, isLoading } = useMonthlyDistributions()
  const [isOpen, setIsOpen] = useState(false)
  const id = useId()

  const selectTriggerRef = useRef<HTMLSelectElement>(null)

  const initialDistributionIndex = distributions?.findIndex(
    (d) => d.number === queryParams.distribution
  )

  const [selectedDistributionIndex, setSelectedDistributionIndex] = useState(
    !initialDistributionIndex || initialDistributionIndex === -1 ? 0 : initialDistributionIndex
  )

  if (isLoading)
    return (
      <YStack f={1} gap={'$7'}>
        <Header />
        <Stack w="100%" f={1} jc={'center'} ai={'center'}>
          <Spinner color="$color" size="large" />
        </Stack>
      </YStack>
    )
  if (!distributions || !distributions[selectedDistributionIndex])
    return (
      <YStack f={1} gap={'$7'}>
        <Header />
        <Stack w="100%" f={1} jc={'center'} ai={'center'}>
          <Paragraph color={'$color10'} size={'$5'}>
            No rewards available
          </Paragraph>
        </Stack>
      </YStack>
    )

  const distributionDates = distributions.map(
    (d) =>
      `${d.qualification_end.toLocaleString('default', {
        month: 'long',
      })} ${d.qualification_end.toLocaleString('default', { year: 'numeric' })}`
  )

  const onValueChange = (value: string) => {
    setSelectedDistributionIndex(Number(value))
    setRewardsScreenParams(
      { distribution: distributions[Number(value)]?.number },
      { webBehavior: 'replace' }
    )
  }

  return (
    <YStack f={1} pb={'$12'} gap={'$7'}>
      <Header />
      <XStack w={'100%'} jc={'space-between'} ai={'center'}>
        <H3 fontWeight={'600'} color={'$color12'}>
          {`${distributionDates[selectedDistributionIndex]?.split(' ')[0]} Rewards`}
        </H3>
        <Select
          native={false}
          id={id}
          value={queryParams.distribution?.toString() ?? '0'}
          onValueChange={onValueChange}
          onOpenChange={setIsOpen}
          defaultValue="0"
          open={isOpen}
        >
          <Select.Trigger
            ref={selectTriggerRef}
            testID={'SelectDistributionDate'}
            br="$3"
            w={'fit-content'}
            borderWidth={1.5}
            $theme-light={{
              boc: isOpen ? '$color1' : '$transparent',
              bc: isOpen ? '$color1' : '$primary',
            }}
            $theme-dark={{
              boc: isOpen ? '$color1' : '$transparent',
              bc: isOpen ? '$color1' : '$primary',
              hoverStyle: { bc: '$primary' },
            }}
            iconAfter={
              isOpen ? (
                <ChevronUp
                  $theme-dark={{
                    color: isOpen ? '$color12' : '$black',
                  }}
                  color={'$color11'}
                />
              ) : (
                <ChevronDown
                  $theme-dark={{
                    color: isOpen ? '$color12' : '$black',
                    hoverStyle: { color: '$color12' },
                  }}
                  color="$black"
                />
              )
            }
          >
            <Select.Value
              testID={'SelectDistributionDateValue'}
              fontWeight={'bold'}
              color={isOpen ? '$color12' : '$black'}
              $theme-dark={{
                color: isOpen ? '$color12' : '$black',
              }}
              placeholder={distributions[selectedDistributionIndex]?.number}
            />
          </Select.Trigger>

          <Adapt when="sm" platform="touch">
            <Sheet
              native
              modal
              dismissOnSnapToBottom
              snapPoints={[30]}
              animation={'quick'}
              disableDrag
            >
              <Sheet.Frame maw={738} bc={'$color1'}>
                <Sheet.Handle py="$5" f={1} bc="transparent" jc={'space-between'} opacity={1} m={0}>
                  <XStack ai="center" jc="space-between" w="100%" px="$4">
                    <Paragraph fontSize={'$5'} fontWeight={'700'} color={'$color12'}>
                      Select Month
                    </Paragraph>
                    <Button
                      chromeless
                      unstyled
                      icon={<IconX color={'$color12'} size={'$1.5'} />}
                      onPress={() => setIsOpen(false)}
                    />
                  </XStack>
                </Sheet.Handle>
                <Sheet.ScrollView>
                  <Adapt.Contents />
                </Sheet.ScrollView>
              </Sheet.Frame>
              <Sheet.Overlay />
            </Sheet>
          </Adapt>

          <Select.Content zIndex={200000}>
            <Select.Viewport
              br={'$3'}
              style={{
                left: '66%',
              }}
              w={320}
              btrr={0}
              boc="transparent"
              bc={'$color1'}
              pt={'$5'}
            >
              <Select.Group>
                {distributions.toReversed().map((distribution, i) => (
                  <DistributionItem
                    isActive={
                      distribution.number === distributions[selectedDistributionIndex]?.number
                    }
                    value={i.toString()}
                    index={i}
                    key={distribution?.number}
                  >
                    {distributionDates[i]}
                  </DistributionItem>
                ))}
              </Select.Group>
            </Select.Viewport>
          </Select.Content>
        </Select>
      </XStack>
      <YStack f={1} w={'100%'} gap={'$7'}>
        <DistributionRequirementsCard distribution={distributions[selectedDistributionIndex]} />
        <SendPerksCards distribution={distributions[selectedDistributionIndex]} />
        <MultiplierCards
          distribution={distributions[selectedDistributionIndex]}
          distributionDate={distributionDates[selectedDistributionIndex]}
        />
        <ClaimableRewardsCard distribution={distributions[selectedDistributionIndex]} />
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
}: { distribution: UseDistributionsResultData[number] }) => {
  const {
    data: snapshotBalance,
    isLoading: isLoadingSnapshotBalance,
    error: snapshotBalanceError,
  } = useReadSendTokenBalanceOf({
    chainId: (distribution.chain_id ?? 8453) as keyof typeof sendTokenAddress,
    args: [distribution.distribution_shares.at(0)?.address ?? zeroAddress],
    blockNumber: distribution.snapshot_block_num
      ? BigInt(distribution.snapshot_block_num)
      : undefined,
    query: {
      enabled: !!distribution.distribution_shares.at(0)?.address,
    },
  })

  if (snapshotBalanceError) throw snapshotBalanceError

  const sendTagRegistrations =
    distribution.distribution_verifications_summary.at(0)?.tag_registrations

  return (
    <Card br={12} $gtMd={{ gap: '$4', p: '$7' }} p="$5">
      <Stack ai="center" jc="space-between" gap="$5" $gtXs={{ flexDirection: 'row' }}>
        <YStack gap="$2">
          <Label fontSize={'$5'} col={'$color10'}>
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

          <XStack ai="center" gap="$2">
            <Paragraph>Sendtag Registered</Paragraph>
            {sendTagRegistrations && sendTagRegistrations > 0 ? (
              <CheckCircle2 $theme-light={{ color: '$color12' }} color="$primary" size={'$1.5'} />
            ) : (
              <Theme name="red">
                <IconInfoCircle color={'$color8'} size={'$1'} />
              </Theme>
            )}
          </XStack>
        </YStack>
      </Stack>
    </Card>
  )
}

const SendPerksCards = ({ distribution }: { distribution: UseDistributionsResultData[number] }) => {
  const verificationValues =
    distribution.distribution_verifications_summary.at(0)?.verification_values

  const now = new Date()
  const isQualificationOver = distribution.qualification_end < now

  return (
    <YStack f={1} w={'100%'} gap="$5">
      <H3 fontWeight={'600'} color={'$color12'}>
        Perks
      </H3>
      <Stack flexWrap="wrap" gap="$5" $gtXs={{ fd: 'row' }}>
        {verificationTypesAndTitles
          .filter(
            ([verificationType]) =>
              (verificationValues?.[verificationType].fixed_value > 0 && !isQualificationOver) ||
              (isQualificationOver &&
                verificationValues?.[verificationType].count !== 0 &&
                verificationValues?.[verificationType].fixed_value > 0)
          )
          .map(([verificationType, title, details]) => (
            <PerkCard
              key={verificationType}
              isCompleted={Boolean(verificationValues?.[verificationType].count)}
            >
              <YStack gap="$2">
                <H3 fontWeight={'600'} color={'$color12'}>
                  {title}
                </H3>
                <Paragraph fontSize={'$6'} fontWeight={'400'} color={'$color10'}>
                  + {verificationValues?.[verificationType]?.fixed_value.toLocaleString() ?? 0} SEND{' '}
                  {details ?? ''}
                </Paragraph>
              </YStack>
            </PerkCard>
          ))}
      </Stack>
    </YStack>
  )
}

const PerkCard = ({
  isCompleted,
  children,
}: PropsWithChildren<CardProps> & { isCompleted: boolean }) => {
  return (
    <Card
      br={12}
      $gtLg={{ gap: '$4' }}
      p="$7"
      jc={'space-between'}
      mih={208}
      $gtSm={{ maw: 331 }}
      w={'100%'}
    >
      <XStack ai="center" gap="$2">
        {isCompleted ? (
          <>
            <CheckCircle2 $theme-light={{ color: '$color12' }} color="$primary" size={'$1.5'} />
            <Paragraph color="$color11">Completed</Paragraph>
          </>
        ) : (
          <>
            <Theme name="red">
              <IconInfoCircle color={'$color8'} size={'$1'} />
            </Theme>
            <Paragraph color="$color11">Pending</Paragraph>
          </>
        )}
      </XStack>
      {children}
    </Card>
  )
}

const MultiplierCards = ({
  distribution,
  distributionDate,
}: {
  distribution: UseDistributionsResultData[number]
  distributionDate?: string
}) => {
  const multipliers = distribution.distribution_verifications_summary[0]?.multipliers

  return (
    <YStack f={1} w={'100%'} gap="$5">
      <H3 fontWeight={'600'} color={'$color12'}>
        Multiplier
      </H3>
      <Stack flexWrap="wrap" gap="$5" $gtXs={{ fd: 'row' }}>
        {verificationTypesAndTitles
          .filter(([verificationType]) => multipliers?.[verificationType].multiplier_step > 0)
          .map(([verificationType, title]) => (
            <MultiplierCard key={verificationType}>
              <XStack ai="center" gap="$2">
                <IconAccount size={'2'} color={'$color10'} />
                <H3 fontWeight={'500'} color={'$color10'}>
                  {verificationType === 'tag_referral'
                    ? distributionDate?.split(' ')[0] ?? 'Monthly'
                    : ''}{' '}
                  {title}
                </H3>
              </XStack>
              <Paragraph
                fontSize={'$9'}
                $sm={{ fontSize: '$8' }}
                fontWeight={'600'}
                color={'$color12'}
              >
                X {multipliers?.[verificationType].value ?? 1}
              </Paragraph>
            </MultiplierCard>
          ))}
      </Stack>
    </YStack>
  )
}

const MultiplierCard = ({ children }: PropsWithChildren<CardProps>) => {
  return (
    <Card
      br={'$6'}
      p="$5"
      $gtXs={{ p: '$7' }}
      jc={'center'}
      ai={'center'}
      mih={112}
      w={'fit-content'}
    >
      <XStack ai="center" w={'100%'} jc="space-between" $gtXs={{ gap: '$7' }} gap={'$5'}>
        {children}
      </XStack>
    </Card>
  )
}

const ClaimableRewardsCard = ({
  distribution,
}: { distribution: UseDistributionsResultData[number] }) => {
  const shareAmount = distribution.distribution_shares?.[0]?.amount
  if (shareAmount === undefined || shareAmount === 0) return null
  const now = new Date()
  const isQualificationOver = distribution.qualification_end < now

  const distributionMonth = distribution.qualification_end.toLocaleString('default', {
    month: 'long',
  })

  return (
    <YStack f={1} w={'100%'} gap="$5" $lg={{ display: 'none' }}>
      <H3 fontWeight={'600'} color={'$color12'}>
        {isQualificationOver
          ? `Total ${distributionMonth} Rewards`
          : `Estimated ${distributionMonth} Rewards`}
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

const DistributionItem = ({
  isActive,
  value,
  index,
  children,
  ...props
}: {
  isActive: boolean
} & SelectItemProps) => {
  return (
    <Select.Item index={index} value={value} bc="transparent" f={1} w="100%" {...props}>
      <XStack gap={'$1'} $gtLg={{ gap: '$3.5' }} f={1} ai={'center'} jc={'center'}>
        <Select.ItemText
          display="flex"
          fontSize={'$5'}
          fontWeight={'500'}
          textTransform={'uppercase'}
          color={'$color12'}
          jc={'center'}
          ai={'center'}
        >
          {children}
        </Select.ItemText>
        {isActive && (
          <Theme name="green_active">
            <Dot size={'$3'} />
          </Theme>
        )}
      </XStack>
    </Select.Item>
  )
}
