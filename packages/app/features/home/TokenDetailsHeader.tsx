import { Card, Paragraph, Theme, useMedia, XStack, YStack, Spinner } from '@my/ui'
import { IconCoin } from 'app/components/icons'
import { type CoinWithBalance, stableCoins, type erc20Coin } from 'app/data/coins'
import { useTokenMarketData } from 'app/utils/coin-gecko'
import { convertBalanceToFiat } from 'app/utils/convertBalanceToUSD'
import formatAmount from 'app/utils/formatAmount'
import { useTokenPrices } from 'app/utils/useTokenPrices'
import { useMemo } from 'react'
import { Platform } from 'react-native'
import { TokenQuickActions } from './TokenQuickActions'

export const TokenDetailsHeader = ({ coin }: { coin: CoinWithBalance }) => {
  const media = useMedia()
  const isSmallScreen = !media.gtXs
  const isStableCoin = useMemo(() => {
    return stableCoins.some((c) => c.token === coin.token)
  }, [coin])

  return (
    <YStack gap="$3" pb="$3">
      <Card py="$5" px="$4" w={'100%'} jc={'space-between'} elevation={'$0.75'}>
        <YStack gap="$4">
          <XStack ai={'center'} gap={'$3'}>
            <IconCoin size={'$2'} symbol={coin.symbol} />
            <Paragraph size={isSmallScreen ? '$6' : '$7'} col={'$color12'} fontWeight={'600'}>
              {coin.label}
            </Paragraph>
          </XStack>
          <YStack gap={Platform.OS === 'web' ? '$4' : '$2'}>
            <TokenDetailsBalance coin={coin} isStableCoin={isStableCoin} />
          </YStack>
        </YStack>
      </Card>
      <TokenQuickActions coin={coin} />
    </YStack>
  )
}

// Lightweight market data summary used by other screens (e.g., Rewards)
// Shows current price and 24h change pill; hides change for stablecoins
export const TokenDetailsMarketData = ({ coin }: { coin: erc20Coin }) => {
  const { data: tokenMarketData, isLoading } = useTokenMarketData(coin.coingeckoTokenId)
  const md = tokenMarketData?.at(0)
  const price = md?.current_price ?? null
  const changePercent24h = md?.price_change_percentage_24h ?? null
  const isStableCoin = useMemo(() => stableCoins.some((c) => c.token === coin.token), [coin.token])

  const changeBadge = (() => {
    if (changePercent24h === null || isStableCoin) return null
    const formatted = `${changePercent24h > 0 ? '+' : ''}${changePercent24h.toFixed(2)}%`
    if (changePercent24h > 0)
      return (
        <Theme name="green_active">
          <Paragraph
            fontSize={'$3'}
            fontWeight={500}
            bc={'$color2'}
            $theme-dark={{ bc: 'rgba(134, 174, 128, 0.2)' }}
            $theme-light={{ bc: 'rgba(134, 174, 128, 0.16)' }}
            px={'$1.5'}
            br={'$2'}
          >
            {formatted}
          </Paragraph>
        </Theme>
      )
    if (changePercent24h < 0)
      return (
        <Theme name="red_active">
          <Paragraph
            fontSize={'$3'}
            fontWeight={500}
            bc={'$color2'}
            $theme-dark={{ bc: 'rgba(229, 115, 115, 0.2)' }}
            $theme-light={{ bc: 'rgba(229, 115, 115, 0.16)' }}
            px={'$1.5'}
            br={'$2'}
          >
            {formatted}
          </Paragraph>
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
}: { coin: CoinWithBalance; isStableCoin: boolean }) => {
  const { data: tokenPrices, isLoading: isLoadingTokenPrices } = useTokenPrices()
  const { balance, decimals } = coin
  const media = useMedia()
  const isSmallScreen = !media.gtXs

  const balanceInUSD = convertBalanceToFiat(coin, tokenPrices?.[coin.token])

  // fetch market data for 24h percent change
  const { data: tokenMarketData, isLoading: isLoadingMarketData } = useTokenMarketData(
    coin.coingeckoTokenId
  )

  const changePercent24h = tokenMarketData?.at(0)?.price_change_percentage_24h ?? null

  // Compute the main USD balance and the USD delta for today
  const mainUSDBalance = balanceInUSD ?? 0
  let usdDelta = 0
  if (changePercent24h !== null && mainUSDBalance) {
    usdDelta = (mainUSDBalance * changePercent24h) / 100
  }

  const changeBadge = (() => {
    if (changePercent24h === null) return null
    const formatted = `${changePercent24h > 0 ? '+' : ''}${changePercent24h.toFixed(2)}%`
    if (changePercent24h > 0)
      return (
        <Theme name="green_active">
          <Paragraph
            fontSize={'$3'}
            fontWeight={500}
            bc={'$color2'}
            $theme-dark={{ bc: 'rgba(134, 174, 128, 0.2)' }}
            $theme-light={{ bc: 'rgba(134, 174, 128, 0.16)' }}
            px={'$1.5'}
            br={'$2'}
          >
            {formatted}
          </Paragraph>
        </Theme>
      )
    if (changePercent24h < 0)
      return (
        <Theme name="red_active">
          <Paragraph
            fontSize={'$3'}
            fontWeight={500}
            bc={'$color2'}
            $theme-dark={{ bc: 'rgba(229, 115, 115, 0.2)' }}
            $theme-light={{ bc: 'rgba(229, 115, 115, 0.16)' }}
            px={'$1.5'}
            br={'$2'}
          >
            {formatted}
          </Paragraph>
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
          {`${usdDelta >= 0 ? '+' : ''}$${formatAmount(Math.abs(usdDelta), 9, 2)} today`}
        </Paragraph>
      ) : null}
    </YStack>
  )
}
