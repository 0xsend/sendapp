import {
  Anchor,
  Button,
  ButtonText,
  Paragraph,
  Stack,
  Text,
  Theme,
  Tooltip,
  TooltipGroup,
  XStack,
  YStack,
} from '@my/ui'
import { sendAirdropsSafeAddress } from '@my/wagmi'
import { ArrowRight } from '@tamagui/lucide-icons'
import React from 'react'
import { useLink } from 'solito/link'

import {
  DistributionProgressCard,
  DistributionTimeCard,
} from './components/distribution-stat-cards'
import { useAccount } from 'wagmi'
import { shorten } from 'app/utils/strings'
import { UseDistributionsResultData, useDistributions } from 'app/utils/distributions'
import { useDistributionNumber } from 'app/routers/params'

export function EarnTokensScreen() {
  const { data: distributions } = useDistributions()

  return (
    <YStack f={1} gap="$6" pb="$8" backgroundColor={'$background05'} px="$6">
      <YStack
        gap="$8"
        f={1}
        overflow={'hidden'}
        borderTopColor="$gray7Dark"
        borderTopWidth="$1"
        py="$4"
      >
        <DistributionSection />
      </YStack>
      <EarnList distributions={distributions} />
    </YStack>
  )
}

const DistributionSection = () => {
  const { chain, address } = useAccount()
  const blockExplorerLink = useLink({
    href: `${chain?.blockExplorers.default.url}/address/${sendAirdropsSafeAddress}`,
  })

  return (
    <YStack gap="$4">
      {chain && (
        <YStack px="$4.5" ai="flex-end" gap="$2" jc="flex-end" alignSelf="flex-end" mb="$4">
          <Theme name="alt2">
            <Button size="$2" chromeless {...blockExplorerLink} iconAfter={ArrowRight}>
              View on {chain.blockExplorers.default.name}
            </Button>
          </Theme>
          <Theme name="alt2">
            <TooltipGroup delay={{ open: 3000, close: 100 }}>
              <Tooltip>
                <Tooltip.Trigger>
                  <Paragraph size="$1">
                    Connected as <Text fontFamily={'$mono'}>{shorten(address)}</Text>
                  </Paragraph>
                </Tooltip.Trigger>
                <Tooltip.Content
                  enterStyle={{ x: 0, y: -5, opacity: 0, scale: 0.9 }}
                  exitStyle={{ x: 0, y: -5, opacity: 0, scale: 0.9 }}
                  scale={1}
                  x={0}
                  y={0}
                  opacity={1}
                  animation={[
                    'quick',
                    {
                      opacity: {
                        overshootClamping: true,
                      },
                    },
                  ]}
                >
                  <Tooltip.Arrow />
                  <Anchor
                    href={`${chain?.blockExplorers.default.url}/address/${address}`}
                    size="$1"
                  >
                    <Text fontFamily={'$mono'}>{address}</Text>
                  </Anchor>
                </Tooltip.Content>
              </Tooltip>
            </TooltipGroup>
          </Theme>
        </YStack>
      )}
      <XStack flexWrap="wrap" ai="flex-start" jc="flex-start" px="$4" gap="$8" mb="$4">
        <DistributionProgressCard />
        <DistributionTimeCard />
      </XStack>
    </YStack>
  )
}

const EarnList = ({ distributions }: { distributions?: UseDistributionsResultData }) => {
  const { isLoading, error, refetch } = useDistributions()
  const [distributionNumberParam, setDistributionNumberParam] = useDistributionNumber()

  if (error)
    return (
      <Stack w={'100%'} jc="center" ai="center">
        <Button onPress={() => refetch()}>Reload</Button>
      </Stack>
    )

  if (isLoading) return <EarnListSkeleton />

  return (
    <XStack w="full" px="$4" gap="$8" mb="$4" jc="flex-start">
      {distributions?.toReversed().map(({ number, id }) => {
        return (distributionNumberParam === undefined && number === distributions.length) ||
          distributionNumberParam === number ? (
          <Button
            key={id}
            bc={'$accent12Dark'}
            w={'$7'}
            h="$2"
            br={6}
            onPress={() => setDistributionNumberParam(number)}
          >
            <ButtonText
              size={'$1'}
              padding={'unset'}
              ta="center"
              margin={'unset'}
              col="$background"
            >
              {`# ${number}  `}
            </ButtonText>
          </Button>
        ) : (
          <Button
            key={id}
            bc={'$decay'}
            w={'$7'}
            h="$2"
            br={6}
            onPress={() => setDistributionNumberParam(number)}
          >
            <ButtonText size={'$1'} padding={'unset'} ta="center" margin={'unset'} col="white">
              {`# ${number}  `}
            </ButtonText>
          </Button>
        )
      })}
    </XStack>
  )
}

const EarnListSkeleton = () => {
  return null
}
