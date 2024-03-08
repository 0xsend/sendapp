import {
  Anchor,
  Button,
  Container,
  Paragraph,
  ScrollView,
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
import { DistributionsTable } from './components/DistributionsTable'
import {
  DistributionProgressCard,
  DistributionTimeCard,
} from './components/distribution-stat-cards'
import { useAccount } from 'wagmi'
import { shorten } from 'app/utils/strings'

export function DistributionsScreen() {
  return (
    <Container>
      <ScrollView f={3} fb={0} backgroundColor={'$background05'}>
        <YStack gap="$6" pt="$5" pb="$8">
          <YStack gap="$8">
            <DistributionSection />
          </YStack>
        </YStack>
      </ScrollView>
    </Container>
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

      <XStack px="$4" gap="$8" mb="$4" jc="center">
        <DistributionsTable />
      </XStack>
    </YStack>
  )
}
