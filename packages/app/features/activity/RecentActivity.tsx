import { XStack, YStack } from '@my/ui'
import { ActivityDetails } from 'app/features/activity/ActivityDetails'
import { useActivityFeed } from './utils/useActivityFeed'
import { useActivityDetails } from 'app/provider/activity-details'
import ActivityFeed from 'app/features/activity/RecentActivityFeed'

export function RecentActivity() {
  const result = useActivityFeed({ pageSize: 50 })
  const { isOpen, selectActivity } = useActivityDetails()

  return (
    <XStack w={'100%'} gap={'$5'} f={1}>
      <YStack
        f={1}
        display={isOpen ? 'none' : 'flex'}
        $gtLg={{
          display: 'flex',
          maxWidth: '50%',
        }}
      >
        <ActivityFeed activityFeedQuery={result} onActivityPress={selectActivity} />
      </YStack>
      {isOpen && (
        <ActivityDetails
          w={'100%'}
          $platform-web={{
            height: 'fit-content',
            position: 'sticky',
            top: 10,
          }}
          $gtLg={{
            maxWidth: '47%',
          }}
        />
      )}
    </XStack>
  )
}
