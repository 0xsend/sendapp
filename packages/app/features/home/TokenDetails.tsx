import { YStack } from '@my/ui'
import { TokenDetailsHeader } from 'app/features/home/TokenDetailsHeader'
import { TokenAbout } from 'app/features/home/TokenAbout'
import { TokenKeyMetrics } from './TokenKeyMetrics'
import { TokenChartSection } from 'app/features/home/TokenChartSection'
import { baseMainnet, usdcAddress } from '@my/wagmi'
import { useCoinFromTokenParam } from 'app/utils/useCoinFromTokenParam'

export const TokenDetails = () => {
  const { coin } = useCoinFromTokenParam()
  if (coin === undefined) return null

  const isUSDC = coin.token === usdcAddress[baseMainnet.id]

  return (
    <YStack f={1} gap="$5" $gtLg={{ w: '45%', pb: '$0' }} pb="$4">
      <TokenDetailsHeader />
      {!isUSDC ? <TokenChartSection /> : null}
      <TokenKeyMetrics />
      <TokenAbout />
    </YStack>
  )
}
