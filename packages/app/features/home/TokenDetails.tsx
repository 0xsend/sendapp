import { YStack } from '@my/ui'
import type { CoinWithBalance } from 'app/data/coins'
import { TokenDetailsHeader } from 'app/features/home/TokenDetailsHeader'
import { TokenAbout } from 'app/features/home/TokenAbout'
import { TokenKeyMetrics } from './TokenKeyMetrics'
import { useCoinData, type CoinData } from 'app/utils/coin-gecko'
import { TokenChartSection } from 'app/features/home/TokenChartSection'

export const TokenDetails = ({
  coin,
  serverCoinData,
}: {
  coin: CoinWithBalance
  serverCoinData?: CoinData
}) => {
  const { data: fetchedCoinData, isLoading: isLoadingCoinData } = useCoinData(coin.coingeckoTokenId)
  const coinData = serverCoinData ?? fetchedCoinData
  return (
    <YStack f={1} gap="$5" $gtLg={{ w: '45%', pb: '$0' }} pb="$4">
      <TokenDetailsHeader coin={coin} />
      <TokenChartSection coin={coin} />
      <TokenKeyMetrics
        coin={coin}
        coinData={coinData}
        isLoadingCoinData={isLoadingCoinData && !serverCoinData}
      />
      <TokenAbout
        coin={coin}
        coinData={coinData}
        isLoadingCoinData={isLoadingCoinData && !serverCoinData}
      />
    </YStack>
  )
}
