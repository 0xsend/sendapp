import { XStack, YStack, Button, Container, ScrollView, H4, Theme } from '@my/ui'
import {
  DistributionProgressCard,
  DistributionTimeCard,
} from './components/distribution-stat-cards'
import React from 'react'
import { ArrowRight } from '@tamagui/lucide-icons'
import { useLink } from 'solito/link'
import { sendAirdropsSafeAddress } from '@my/wagmi'
import { DistributionsTable } from './components/DistributionsTable'

export function DistributionsScreen() {
  return (
    <Container>
      <ScrollView f={3} fb={0}>
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
  const etherscanLink = useLink({ href: `https://etherscan.io/address/${sendAirdropsSafeAddress}` })

  return (
    <YStack gap="$4">
      <XStack px="$4.5" ai="center" gap="$2" jc="space-between" mb="$4">
        <H4 fontWeight="400">Distributions</H4>
        <Theme name="alt2">
          <Button size="$2" chromeless {...etherscanLink} iconAfter={ArrowRight}>
            View on Etherscan
          </Button>
        </Theme>
      </XStack>

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
