import { AnimatePresence, YStack } from '@my/ui'
import { RecentActivity } from './RecentActivity'

export function ActivityScreen() {
  return (
    <YStack f={1} width={'100%'} pb="$3" pt="$3" gap="$6" $gtLg={{ pt: 0, gap: '$7' }}>
      <ActivityBody />
    </YStack>
  )
}

function ActivityBody() {
  return (
    <AnimatePresence>
      <YStack
        gap={'$4'}
        key="suggestions"
        animation="quick"
        exitStyle={{
          opacity: 0,
          y: 10,
        }}
        f={1}
      >
        <RecentActivity />
      </YStack>
    </AnimatePresence>
  )
}
