import { Card, H4, YStack } from '@my/ui'
import type { Timeframe } from '../timeframes'
import { useTokenChartData } from '../useTokenChartData'
import { useCoinFromTokenParam } from 'app/utils/useCoinFromTokenParam'
import { LoadingChartSinWave } from './LoadingChartSinWave'

export function ChartCardSection({
  tf,
  title,
  children,
}: {
  tf: Timeframe
  title: string
  children: React.ReactNode
}) {
  const { coin } = useCoinFromTokenParam()
  const { isLoading } = useTokenChartData(coin?.coingeckoTokenId, tf)
  return (
    <YStack gap={'$3'}>
      <H4 fontWeight={600} size={'$7'}>
        {title}
      </H4>
      <Card padded size={'$5'} w={'100%'} elevation={1} h={344}>
        <YStack f={1} jc="space-between" ov="hidden" gap={'$3'} position="relative">
          {children}
          {isLoading ? (
            <YStack
              position="absolute"
              left={0}
              top={0}
              right={0}
              bottom={0}
              ai="center"
              jc="center"
              pointerEvents="none"
            >
              <LoadingChartSinWave />
            </YStack>
          ) : null}
        </YStack>
      </Card>
    </YStack>
  )
}
