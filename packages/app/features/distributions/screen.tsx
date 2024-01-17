import { Button, Container, ScrollView, Theme, XStack, YStack } from '@my/ui'
import { sendAirdropsSafeAddress } from '@my/wagmi'
import { ArrowRight } from '@tamagui/lucide-icons'
import React from 'react'
import { useLink } from 'solito/link'
import { DistributionsTable } from './components/DistributionsTable'
import {
  DistributionProgressCard,
  DistributionTimeCard,
} from './components/distribution-stat-cards'

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
  const etherscanLink = useLink({
    href: `https://etherscan.io/address/${sendAirdropsSafeAddress}`,
  })

  return (
    <YStack gap="$4">
      <XStack px="$4.5" ai="center" gap="$2" jc="flex-end" mb="$4">
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
