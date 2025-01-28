import { H3, YStack } from 'tamagui'
import { TokenDetailsMarketData } from 'app/components/TokenDetailsMarketData'
import { useCoinFromTokenParam } from 'app/utils/useCoinFromTokenParam'
import SwapForm from './components/SwapForm'

export function SwapScreen() {
  const { coin } = useCoinFromTokenParam()

  return (
    <YStack mt="$4" width="100%" $sm={{ maxWidth: 600 }} gap={50} maxWidth={511}>
      <YStack width="100%" gap={8}>
        <H3 fontWeight="400">Swap</H3>
        {coin && <TokenDetailsMarketData coin={coin} />}
      </YStack>
      <SwapForm />
    </YStack>
  )
}
