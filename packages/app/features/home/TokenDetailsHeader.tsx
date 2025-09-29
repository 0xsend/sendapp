import { Card, Paragraph, Theme, useMedia, XStack, YStack, Spinner } from '@my/ui'
import { IconCoin } from 'app/components/icons'
import { type CoinWithBalance, stableCoins } from 'app/data/coins'
import { useTokensMarketData } from 'app/utils/coin-gecko'
import { convertBalanceToFiat } from 'app/utils/convertBalanceToUSD'
import formatAmount, { localizeAmount } from 'app/utils/formatAmount'
import { useTokenPrices } from 'app/utils/useTokenPrices'
import { useMemo } from 'react'
import { Platform } from 'react-native'
import { TokenQuickActions } from './TokenQuickActions'
import { useCoinFromTokenParam } from 'app/utils/useCoinFromTokenParam'
import { calculatePercentageChange } from './utils/calculatePercentageChange'

export const TokenDetailsHeader = () => {
  const { coin } = useCoinFromTokenParam()
  const { data: marketData, isLoading: isLoadingMarketData } = useTokensMarketData()
  const media = useMedia()
  const isSmallScreen = !media.gtXs
  const isStableCoin = useMemo(() => {
    return stableCoins.some((c) => c.token === coin?.token)
  }, [coin])

  if (coin === undefined) return null

  const md = marketData?.find((m) => m.id === coin.coingeckoTokenId)
  const changePercent24h = md?.price_change_percentage_24h ?? null

  return (
    <YStack gap="$3" pb="$3">
      <Card py="$5" px="$4" w={'100%'} jc={'space-between'} elevation={1}>
        <YStack gap="$4">
          <XStack ai={'center'} gap={'$3'}>
            <IconCoin size={'$2'} symbol={coin.symbol} />
            <Paragraph size={isSmallScreen ? '$6' : '$7'} col={'$color12'} fontWeight={'600'}>
              {coin.label}
            </Paragraph>
          </XStack>
          <YStack gap={Platform.OS === 'web' ? '$4' : '$2'}>
            <TokenDetailsBalance
              coin={coin}
              isStableCoin={isStableCoin}
              changePercent24h={changePercent24h}
              isLoadingMarketData={isLoadingMarketData}
            />
          </YStack>
        </YStack>
      </Card>
      <TokenQuickActions coin={coin} />
    </YStack>
  )
}

// Lightweight market data summary used by other screens (e.g., Rewards)
// Shows current price and 24h change pill; hides change for stablecoins
export const TokenDetailsMarketData = ({ coin }: { coin: CoinWithBalance }) => {
  const { data: marketData, isLoading } = useTokensMarketData()
  const md = marketData?.find((m) => m.id === coin.coingeckoTokenId)
  const price = md?.current_price ?? null
  const changePercent24h = md?.price_change_percentage_24h ?? null
  const isStableCoin = useMemo(() => stableCoins.some((c) => c.token === coin.token), [coin.token])
  const changeBadge = (() => {
    if (changePercent24h === null || isStableCoin) return null
    const formatted = `${changePercent24h > 0 ? '+' : ''}${changePercent24h.toFixed(2)}%`
    if (changePercent24h > 0)
      return (
        <Theme name="green_active">
          <XStack
            bc={'$color2'}
            $theme-dark={{ bc: 'rgba(134, 174, 128, 0.2)' }}
            $theme-light={{ bc: 'rgba(134, 174, 128, 0.16)' }}
            px={'$1.5'}
            br={'$2'}
          >
            <Paragraph fontSize={'$3'} fontWeight={500}>
              {formatted}
            </Paragraph>
          </XStack>
        </Theme>
      )
    if (changePercent24h < 0)
      return (
        <Theme name="red_active">
          <XStack
            bc={'$color2'}
            $theme-dark={{ bc: 'rgba(229, 115, 115, 0.2)' }}
            $theme-light={{ bc: 'rgba(229, 115, 115, 0.16)' }}
            px={'$1.5'}
            br={'$2'}
          >
            <Paragraph fontSize={'$3'} fontWeight={500}>
              {formatted}
            </Paragraph>
          </XStack>
        </Theme>
      )
    return <Paragraph fontSize={'$3'}>{formatted}</Paragraph>
  })()

  if (isLoading) return <Spinner size="small" />
  if (price === null) return null

  return (
    <XStack ai="center" jc="space-between">
      <XStack ai="center" gap={'$2'}>
        <Paragraph size={'$6'} fontWeight={500} color={'$color12'}>
          {`$${formatAmount(price, 9, 2)}`}
        </Paragraph>
        {changeBadge}
      </XStack>
    </XStack>
  )
}

const TokenDetailsBalance = ({
  coin,
  isStableCoin,
  changePercent24h,
  isLoadingMarketData,
}: {
  coin: CoinWithBalance
  isStableCoin: boolean
  changePercent24h: number | null
  isLoadingMarketData: boolean
}) => {
  const { data: tokenPrices, isLoading: isLoadingTokenPrices } = useTokenPrices()

  const media = useMedia()
  const isSmallScreen = !media.gtXs

  const balanceInUSD = convertBalanceToFiat(coin, tokenPrices?.[coin.token])

  // Compute the main USD balance and the USD delta for today
  const mainUSDBalance = balanceInUSD ?? 0
  const usdDelta = calculatePercentageChange(mainUSDBalance, changePercent24h)
  const formattedDeltaUSD = localizeAmount(Math.abs(usdDelta).toFixed(2))
  const sign = usdDelta >= 0 ? '+' : '-'

  const changeBadge = (() => {
    if (changePercent24h === null || coin?.balance === 0n) return null
    const formatted = `${changePercent24h > 0 ? '+' : ''}${changePercent24h.toFixed(2)}%`
    if (changePercent24h > 0)
      return (
        <Theme name="green_active">
          <XStack
            bc={'$color2'}
            $theme-dark={{ bc: 'rgba(134, 174, 128, 0.2)' }}
            $theme-light={{ bc: 'rgba(134, 174, 128, 0.16)' }}
            px={'$1.5'}
            br={'$2'}
          >
            <Paragraph fontSize={'$3'} fontWeight={500}>
              {formatted}
            </Paragraph>
          </XStack>
        </Theme>
      )
    if (changePercent24h < 0)
      return (
        <Theme name="red_active">
          <XStack
            bc={'$color2'}
            $theme-dark={{ bc: 'rgba(229, 115, 115, 0.2)' }}
            $theme-light={{ bc: 'rgba(229, 115, 115, 0.16)' }}
            px={'$1.5'}
            br={'$2'}
          >
            <Paragraph fontSize={'$3'} fontWeight={500}>
              {formatted}
            </Paragraph>
          </XStack>
        </Theme>
      )
    return <Paragraph fontSize={'$3'}>{formatted}</Paragraph>
  })()

  if (coin.balance === undefined) {
    return <></>
  }

  return (
    <YStack gap={'$2'}>
      <XStack alignItems={'center'} gap="$4">
        <Paragraph
          $platform-web={{ width: 'fit-content' }}
          $sm={{
            lineHeight: Platform.OS === 'web' ? 32 : 42,
          }}
          fontSize={'$10'}
          fontWeight={'600'}
          lineHeight={isSmallScreen ? 48 : 57}
          color={'$color12'}
        >
          {isLoadingTokenPrices || mainUSDBalance === undefined
            ? ''
            : `$${formatAmount(mainUSDBalance, 9, 2)}`}
        </Paragraph>
        {/* Percent change badge to the right */}
        {!isStableCoin && !isLoadingMarketData && changeBadge}
      </XStack>

      {/* USD delta under main balance */}
      {!isStableCoin && !isLoadingMarketData && changePercent24h !== null ? (
        <Paragraph color={'$color10'} fontWeight={'400'} size={'$5'}>
          {`${sign}$${formattedDeltaUSD} today`}
        </Paragraph>
      ) : null}
    </YStack>
  )
}
