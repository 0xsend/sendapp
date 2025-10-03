import { XStack, YStack, Switch, Label, H4 } from '@my/ui'
import { ActivityDetails } from 'app/features/activity/ActivityDetails'
import { useActivityFeed } from './utils/useActivityFeed'
import { useActivityDetails } from 'app/provider/activity-details'
import ActivityFeed from 'app/features/activity/RecentActivityFeed'
import { useState } from 'react'

export function RecentActivity() {
  const [groupTransfers, setGroupTransfers] = useState(false)
  const result = useActivityFeed({ pageSize: 50, groupTransfers })
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
        gap="$3"
      >
        <XStack jc="space-between" ai="center" px="$2">
          <H4 fontWeight={'600'} size={'$7'}>
            Recent Activity
          </H4>
          <XStack ai="center" gap="$2">
            <Label htmlFor="group-transfers" fontSize="$3" color="$color10">
              Group
            </Label>
            <Switch
              id="group-transfers"
              checked={groupTransfers}
              onCheckedChange={setGroupTransfers}
              size="$3"
            />
          </XStack>
        </XStack>
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
