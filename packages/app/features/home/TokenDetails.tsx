import { YStack } from '@my/ui'
import type { CoinWithBalance } from 'app/data/coins'
import { TokenDetailsHeader } from 'app/features/home/TokenDetailsHeader'
import { TokenAbout } from 'app/features/home/TokenAbout'
import { TokenKeyMetrics } from './TokenKeyMetrics'
import { useCoinData } from 'app/utils/coin-gecko'
import { TokenChartSection } from 'app/features/home/TokenChartSection'

export const TokenDetails = ({ coin }: { coin: CoinWithBalance }) => {
  const { data: coinData, isLoading: isLoadingCoinData } = useCoinData(coin.coingeckoTokenId)
  return (
    <YStack f={1} gap="$3" $gtLg={{ w: '45%', pb: '$0' }} pb="$4">
      <TokenDetailsHeader coin={coin} />
      <TokenChartSection coin={coin} />
      <TokenKeyMetrics coin={coin} coinData={coinData} isLoadingCoinData={isLoadingCoinData} />
      <TokenAbout coin={coin} coinData={coinData} isLoadingCoinData={isLoadingCoinData} />
    </YStack>
  )
}
