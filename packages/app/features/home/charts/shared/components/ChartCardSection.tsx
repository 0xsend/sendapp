import { Card, H4, Spinner, YStack } from '@my/ui'
import type { Timeframe } from '../timeframes'
import { useTokenChartData } from '../useTokenChartData'
import { useCoinFromTokenParam } from 'app/utils/useCoinFromTokenParam'
import { Platform } from 'react-native'

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
      <Card padded size={'$5'} w={'100%'} elevation={Platform.OS === 'android' ? undefined : 1}>
        <YStack gap={'$3'} position="relative">
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
              <Spinner size="large" color={'$color12'} />
            </YStack>
          ) : null}
        </YStack>
      </Card>
    </YStack>
  )
}
