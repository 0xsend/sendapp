import { H4, Paragraph, Spinner, YStack } from '@my/ui'
import type { CoinWithBalance } from 'app/data/coins'
import { hexToBytea } from 'app/utils/hexToBytea'
import { toNiceError } from 'app/utils/toNiceError'
import { ActivityDetails } from '../activity/ActivityDetails'
import { TokenActivityFeed } from './TokenActivityFeed'
import { useTokenActivityFeed } from './utils/useTokenActivityFeed'
import { useActivityDetails } from '../activity/context'

export const TokenActivity = ({ coin }: { coin: CoinWithBalance }) => {
  const { isOpen, selectActivity } = useActivityDetails()

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

  if (isOpen) {
    return <ActivityDetails />
  }
  return (
    <YStack gap={'$3'}>
      <H4 fontWeight={'600'} size={'$7'}>
        {!pages || !pages[0]?.length ? 'No Activity' : 'Activity'}
      </H4>
      <TokenActivityFeed
        testID="TokenActivityFeed"
        tokenActivityFeedQuery={tokenActivityFeedQuery}
        onActivityPress={selectActivity}
        $gtLg={{
          p: '$3.5',
        }}
        p="$2"
      />
    </YStack>
  )
}
