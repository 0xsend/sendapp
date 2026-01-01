import { FadeCard, Spinner, XStack, YStack } from '@my/ui'
import { JackpotCard } from './JackpotCard'
import { DrawingHistory } from './DrawingHistory'
import SendpotRiskDialog from './SendpotRiskDialog'
import { ClaimWinnings } from './ClaimWinnings'
import { useClaimableWinnings } from './hooks/useClaimableWinnings'
import { useEffect, useRef } from 'react'
import { useAnalytics } from 'app/provider/analytics'

export function SendPotScreen() {
  const { hasClaimableWinnings, isLoading } = useClaimableWinnings()
  const analytics = useAnalytics()
  const hasTrackedView = useRef(false)

  // Track sendpot_viewed on mount
  useEffect(() => {
    if (!hasTrackedView.current) {
      analytics.capture({
        name: 'sendpot_viewed',
        properties: {},
      })
      hasTrackedView.current = true
    }
  }, [analytics])

  if (isLoading) {
    return <Spinner size="large" color="$color12" />
  }

  return (
    <XStack
      w={'100%'}
      $gtLg={{ gap: '$5' }}
      $lg={{ f: 1, pt: '$3' }}
      key="play-body"
      animation="200ms"
    >
      <YStack
        $gtLg={{ display: 'flex', w: '100%', gap: '$5', pb: 0 }}
        display={'flex'}
        width="100%"
        maxWidth={600}
        gap="$5"
      >
        {hasClaimableWinnings ? <ClaimWinnings /> : <JackpotCard />}
        <YStack w={'100%'}>
          <FadeCard>
            <DrawingHistory />
          </FadeCard>
        </YStack>
        <SendpotRiskDialog />
      </YStack>
    </XStack>
  )
}
