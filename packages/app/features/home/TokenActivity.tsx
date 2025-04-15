import { H4, Paragraph, Spinner, YStack } from '@my/ui'
import type { CoinWithBalance } from 'app/data/coins'
import { hexToBytea } from 'app/utils/hexToBytea'
import { toNiceError } from 'app/utils/toNiceError'
import type { Activity } from 'app/utils/zod/activity'
import { useState } from 'react'
import { ActivityDetails } from '../activity/ActivityDetails'
import { TokenActivityFeed } from './TokenActivityFeed'
import { useTokenActivityFeed } from './utils/useTokenActivityFeed'

export const TokenActivity = ({ coin }: { coin: CoinWithBalance }) => {
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null)

  const handleActivityPress = (activity: Activity) => {
    setSelectedActivity(activity)
  }
  const handleCloseActivityDetails = () => {
    setSelectedActivity(null)
  }
  const tokenActivityFeedQuery = useTokenActivityFeed({
    pageSize: 10,
    address: coin.token === 'eth' ? undefined : hexToBytea(coin.token),
  })

  const { data, isLoading, error } = tokenActivityFeedQuery

  const { pages } = data ?? {}

  if (isLoading) return <Spinner size="small" />
  if (error !== null) {
    return (
      <Paragraph maxWidth={600} fontFamily={'$mono'} fontSize={'$5'} color={'$color12'}>
        {toNiceError(error)}
      </Paragraph>
    )
  }

  if (selectedActivity) {
    return <ActivityDetails activity={selectedActivity} onClose={handleCloseActivityDetails} />
  }
  return (
    <YStack gap={'$3'}>
      <H4 fontWeight={'600'} size={'$7'}>
        {!pages || !pages[0]?.length ? 'No Activity' : 'Activity'}
      </H4>
      <TokenActivityFeed
        testID="TokenActivityFeed"
        tokenActivityFeedQuery={tokenActivityFeedQuery}
        onActivityPress={handleActivityPress}
        $gtLg={{
          p: '$3.5',
        }}
        p="$2"
      />
    </YStack>
  )
}
