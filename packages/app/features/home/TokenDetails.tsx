import { YStack } from '@my/ui'
import type { CoinWithBalance } from 'app/data/coins'
import { TokenActivity } from './TokenActivity'
import { Platform } from 'react-native'
import { TokenDetailsHeader } from 'app/features/home/TokenDetailsHeader'

export const TokenDetails = ({ coin }: { coin: CoinWithBalance }) => {
  if (Platform.OS === 'web') {
    return (
      <YStack f={1} gap="$3" $gtLg={{ w: '45%', pb: '$0' }} pb="$4">
        <TokenDetailsHeader coin={coin} />
        <TokenActivity coin={coin} />
      </YStack>
    )
  }

  return <TokenActivity coin={coin} />
}
