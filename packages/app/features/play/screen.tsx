import { XStack, YStack, Card, useSafeAreaInsets } from '@my/ui'
import { JackpotCard } from './JackpotCard'
import { DrawingHistory } from './DrawingHistory'

export function PlayScreen() {
  const { bottom } = useSafeAreaInsets()
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
        pb={Math.max(bottom, 24) + 72}
      >
        <JackpotCard />

        <YStack w={'100%'}>
          <Card bc={'$color1'} width="100%" p="$4">
            <DrawingHistory />
          </Card>
        </YStack>
      </YStack>
    </XStack>
  )
}
