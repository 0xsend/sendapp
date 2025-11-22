import { Paragraph, Theme, YStack, XStack, useThemeName } from '@my/ui'
import formatAmount from 'app/utils/formatAmount'
import { useState } from 'react'
import { Dimensions } from 'react-native'
import { ChartCardSection } from './charts/shared/components/ChartCardSection'
import { TimeframeTabs } from './charts/shared/components/TimeframeTabs'
import { ChartLineSection } from './charts/shared/components/ChartLineSection'
import { ChartExtremeLabels } from './charts/shared/components/ChartExtremeLabels'
import { useTokenChartData } from './charts/shared/useTokenChartData'
import { useScrubState } from './charts/shared/useScrubState.web'
import type { Timeframe } from './charts/shared/timeframes'
import { useCoinFromTokenParam } from 'app/utils/useCoinFromTokenParam'
import { useTranslation } from 'react-i18next'

export function TokenChartSection() {
  const [tf, setTf] = useState<Timeframe>('1W')
  const { coin } = useCoinFromTokenParam()
  const { points, smoothed, last, change, isLoading, isError } = useTokenChartData(
    coin?.coingeckoTokenId,
    tf
  )

  const [measuredWidth, setMeasuredWidth] = useState<number>(0)
  const theme = useThemeName()
  const isDark = theme?.startsWith('dark')

  const stroke = isDark ? '#40FB50' : '#000000'
  const { t } = useTranslation('home')

  const changeBadge = (() => {
    if (change === null || change === undefined) return null
    const formatted = `${change > 0 ? '+' : ''}${change.toFixed(2)}%`
    if (change > 0)
      return (
        <Theme name="green_active">
          <Paragraph fontSize={'$3'} fontWeight={500} bc={'$color1'} px={'$1.5'} br={'$2'}>
            {formatted}
          </Paragraph>
        </Theme>
      )
    if (change < 0)
      return (
        <Theme name="red_active">
          <Paragraph fontSize={'$3'} fontWeight={500} bc={'$color1'} px={'$1.5'} br={'$2'}>
            {formatted}
          </Paragraph>
        </Theme>
      )
    return <Paragraph fontSize={'$3'}>{formatted}</Paragraph>
  })()

  const onLayoutContainer = (e: import('react-native').LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width
    if (typeof w === 'number' && w > 0 && w !== measuredWidth) {
      setMeasuredWidth(w)
    }
  }

  const containerWidth = measuredWidth || Dimensions.get('window').width

  const { active, price, ts, onScrub } = useScrubState()
  const pathProps = { onScrub }

  // Don't render if coin doesn't have CoinGecko ID
  if (!coin?.coingeckoTokenId) {
    return null
  }

  return (
    <ChartCardSection title={t('token.priceOverview')} tf={tf}>
      <YStack onLayout={onLayoutContainer}>
        <ChartLineSection
          points={points}
          smoothed={smoothed}
          width={containerWidth}
          stroke={stroke}
          pathProps={pathProps}
          childrenBeforePath={
            isLoading ? null : isError && !isLoading ? (
              <Paragraph color={'$color10'}>{t('token.chartError')}</Paragraph>
            ) : (
              <ChartScrubReadoutWeb
                fallbackPrice={last}
                decimals={last > 0.1 ? 2 : 5}
                changeBadge={changeBadge}
                price={price}
                ts={ts}
              />
            )
          }
          childrenAfterPath={<ChartExtremeLabels decimals={last > 0.1 ? 2 : 5} active={active} />}
        />
      </YStack>
      <TimeframeTabs value={tf} onChange={setTf} isDark={isDark} />
    </ChartCardSection>
  )
}

function ChartScrubReadoutWeb({
  fallbackPrice,
  changeBadge,
  decimals,
  price,
  ts,
}: {
  fallbackPrice: number
  changeBadge: React.ReactNode
  decimals: number
  price: number | null
  ts: number | null
}) {
  const displayPrice = price ?? fallbackPrice
  const formattedPrice = `$${formatAmount(displayPrice, 9, decimals)}`

  const timeLabel = (() => {
    if (ts === null)
      return new Date().toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' })
    try {
      const d = new Date(ts)
      return d.toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' })
    } catch {
      return null
    }
  })()

  return (
    <YStack gap="$1" mb={'$5'}>
      <XStack ai="center" gap={'$2'}>
        <Paragraph size={'$5'} fontWeight={500} color={'$color12'}>
          {formattedPrice}
        </Paragraph>
        {price === null ? changeBadge : null}
      </XStack>
      {timeLabel ? (
        <Paragraph size={'$3'} color={'$color10'}>
          {timeLabel}
        </Paragraph>
      ) : null}
    </YStack>
  )
}
