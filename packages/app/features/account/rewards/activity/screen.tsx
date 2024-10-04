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
} from '@my/ui'
import { sendTokenAddress, useReadSendTokenBalanceOf } from '@my/wagmi'
import { CheckCircle2, ChevronDown, ChevronUp, Dot } from '@tamagui/lucide-icons'
import { IconInfoCircle, IconX } from 'app/components/icons'
import { useRewardsScreenParams } from 'app/routers/params'
import { assert } from 'app/utils/assert'
import { useMonthlyDistributions, type UseDistributionsResultData } from 'app/utils/distributions'
import formatAmount from 'app/utils/formatAmount'
import { useConfirmedTags } from 'app/utils/tags'
import { useChainAddresses } from 'app/utils/useChainAddresses'
import { useId, useState } from 'react'

export function ActivityRewardsScreen() {
  const [queryParams, setRewardsScreenParams] = useRewardsScreenParams()
  const { data: distributions, isLoading } = useMonthlyDistributions()
  const [isOpen, setIsOpen] = useState(false)
  const id = useId()

  const [selectedDistributionIndex, setSelectedDistributionIndex] = useState(
    queryParams.distribution ?? 0
  )

  if (isLoading)
    return (
      <YStack f={1} pb={'$2'} pt={'$6'} gap={'$7'}>
        <Header />
        <Stack w="100%" f={1} jc={'center'} ai={'center'}>
          <Spinner color="$color" size="large" />
        </Stack>
      </YStack>
    )
  if (!distributions || !distributions[selectedDistributionIndex])
    return (
      <YStack f={1} pb={'$2'} pt={'$6'} gap={'$7'}>
        <Header />
        <Stack w="100%" f={1} jc={'center'} ai={'center'}>
          <Paragraph color={'$color10'} size={'$5'}>
            No distribution found
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
    <YStack f={1} pb={'$2'} pt={'$6'} gap={'$7'}>
      <Header />
      <XStack w={'100%'} jc={'space-between'} ai={'center'}>
        <H3 fontWeight={'600'} color={'$color12'}>
          {`${distributionDates[selectedDistributionIndex]} Rewards`}
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
            testID={'SelectDistributionDate'}
            br="$3"
            w={'fit-content'}
            borderWidth={1.5}
            theme={'green'}
            $theme-light={{ boc: '$color12', bc: isOpen ? '$color12' : '$transparent' }}
            $theme-dark={{
              boc: '$color4',
              bc: isOpen ? '$color4' : '$transparent',
            }}
            iconAfter={
              isOpen ? (
                <ChevronUp
                  $theme-dark={{
                    color: '$color0',
                  }}
                  color={'$color11'}
                />
              ) : (
                <ChevronDown
                  $theme-dark={{
                    color: '$color12',
                  }}
                  color="$black"
                />
              )
            }
          >
            <Select.Value
              testID={'SelectDistributionDateValue'}
              fontWeight={'bold'}
              color={'$black'}
              $theme-dark={{
                color: isOpen ? '$color0' : '$color12',
              }}
              placeholder={distributions[selectedDistributionIndex]?.number}
            />
          </Select.Trigger>

          <Adapt when="sm" platform="touch">
            <Sheet native modal dismissOnSnapToBottom snapPoints={[30]} animation={'quick'}>
              <Sheet.Frame maw={738} bc={'$color1'}>
                <Sheet.Handle py="$5" f={1} bc="transparent" jc={'space-between'} opacity={1} m={0}>
                  <XStack ai="center" jc="space-between" w="100%" px="$4">
                    <Paragraph fontSize={'$5'} fontWeight={'700'} color={'$color12'}>
                      Select Distribution
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
            <Select.Viewport br={'$3'} w={320} btrr={0} boc="transparent" bc={'$color1'}>
              <Select.Group>
                {distributions.map((distribution, i) => (
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

    <YStack p="$4" pt={'$3'} maw={463} position="absolute" zIndex={1}>
      <H1 tt={'uppercase'} $theme-light={{ col: '$color0' }} $sm={{ size: '$9' }}>
        Unlock <br />
        Extra Rewards
      </H1>
      <Paragraph
        $theme-light={{ col: '$color2' }}
        color={'$color10'}
        size={'$5'}
        $sm={{ size: '$2' }}
      >
        Register at least 1 Sendtag, maintain the minimum balance, avoid selling, and refer others
        for a bonus multiplier.
      </Paragraph>
    </YStack>
  </Stack>
)

const DistributionRequirementsCard = ({
  distribution,
}: { distribution: UseDistributionsResultData[number] }) => {
  const {
    data: addresses,
    isLoading: isLoadingChainAddresses,
    error: chainAddressesError,
  } = useChainAddresses()

  const tags = useConfirmedTags()
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

  //@todo should display these errors
  if (chainAddressesError) throw chainAddressesError
  if (snapshotBalanceError) throw snapshotBalanceError

  return (
    <Card br={12} $theme-light={{ bc: '$color2' }} $gtMd={{ gap: '$4', p: '$7' }} p="$5">
      <Stack ai="center" jc="space-between" gap="$5" $gtXs={{ flexDirection: 'row' }}>
        <YStack gap="$2">
          <Label fontSize={'$5'} col={'$color10'}>
            Your SEND Balance
          </Label>
          {isLoadingSnapshotBalance || isLoadingChainAddresses ? (
            <Spinner color={'$color12'} />
          ) : (
            <Theme reset>
              <Paragraph
                fontFamily={'$mono'}
                fontSize={'$10'}
                fontWeight={'500'}
                color={'$color12'}
                lh={'$8'}
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
            {distribution.hodler_min_balance > (snapshotBalance ?? Number.POSITIVE_INFINITY) ? (
              <CheckCircle2 $theme-light={{ color: '$color12' }} color="$primary" size={'$1.5'} />
            ) : (
              <Theme name="red">
                <IconInfoCircle color={'$color8'} size={'$1'} />
              </Theme>
            )}
          </XStack>
          <XStack ai="center" gap="$2">
            <Paragraph>Sendtag Registered</Paragraph>
            {Array.isArray(tags) && tags.length > 0 ? (
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
      <XStack gap={'$1'} $gtLg={{ gap: '$3.5' }} w={'100%'} ai={'center'}>
        <Select.ItemText
          display="flex"
          fontSize={'$5'}
          fontWeight={'500'}
          textTransform={'uppercase'}
          color={'$color12'}
          f={1}
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
