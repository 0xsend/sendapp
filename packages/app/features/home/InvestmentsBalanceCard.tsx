import {
  Card,
  type CardProps,
  Paragraph,
  Spinner,
  Theme,
  ThemeableStack,
  useMedia,
  XStack,
  type XStackProps,
  YStack,
} from '@my/ui'
import formatAmount from 'app/utils/formatAmount'

import { ChevronLeft, ChevronRight } from '@tamagui/lucide-icons'

import { useIsPriceHidden } from './utils/useIsPriceHidden'

import { useSendAccountBalances } from 'app/utils/useSendAccountBalances'
import { type CoinWithBalance, investmentCoins } from 'app/data/coins'

import { useRootScreenParams } from 'app/routers/params'
import { useMultipleTokensMarketData } from 'app/utils/coin-gecko'
import { useMemo } from 'react'
import { IconCoin, IconError } from 'app/components/icons'
import { useCoins } from 'app/provider/coins'
import { investmentCoins as investmentCoinsList } from 'app/data/coins'
import { formatUnits } from 'viem'
import { HomeBodyCard } from './screen'

export const InvestmentsBalanceCard = (props: CardProps) => {
  const media = useMedia()
  const [queryParams, setParams] = useRootScreenParams()
  const isInvestmentCoin = investmentCoins.some(
    (coin) => coin.token.toLowerCase() === queryParams.token?.toLowerCase()
  )
  const isInvestmentsScreen = queryParams.token === 'investments'

  const toggleSubScreen = () =>
    setParams(
      { ...queryParams, token: queryParams.token === 'investments' ? undefined : 'investments' },
      { webBehavior: 'push' }
    )

  const { isPriceHidden } = useIsPriceHidden()

  const { dollarBalances, isLoading } = useSendAccountBalances()
  const dollarTotal = Object.entries(dollarBalances ?? {})
    .filter(([address]) =>
      investmentCoins.some((coin) => coin.token.toLowerCase() === address.toLowerCase())
    )
    .reduce((total, [, balance]) => total + balance, 0)

  const formattedBalance = formatAmount(dollarTotal, 9, 0)

  return (
    <HomeBodyCard onPress={toggleSubScreen} {...props}>
      <Card.Header padded pb="$4" jc="space-between" fd="row">
        <Paragraph fontSize={'$5'} fontWeight="400">
          Invest
        </Paragraph>
        {isInvestmentCoin || isInvestmentsScreen ? (
          <ChevronLeft
            size={'$1'}
            color={'$primary'}
            $theme-light={{ color: '$color12' }}
            $lg={{ display: 'none' }}
          />
        ) : (
          <ChevronRight
            size={'$1'}
            color={'$lightGrayTextField'}
            $theme-light={{ color: '$darkGrayTextField' }}
          />
        )}
      </Card.Header>
      <Card.Footer padded size="$4" pt={0} jc="space-between" ai="center">
        <YStack jc="space-between" gap="$4">
          <Paragraph color={'$color12'} fontWeight={600} size={'$9'}>
            {(() => {
              switch (true) {
                case isPriceHidden:
                  return '///////'
                case isLoading || !dollarBalances:
                  return <Spinner size={'large'} color={'$color12'} />
                default:
                  return `$${formattedBalance}`
              }
            })()}
          </Paragraph>

          <InvestmentsAggregate />
        </YStack>
        {(!isInvestmentsScreen || media.gtLg) && <InvestmentsPreview />}
      </Card.Footer>
    </HomeBodyCard>
  )
}

function InvestmentsPreview() {
  const { investmentCoins, isLoading } = useCoins()

  if (isLoading) return <Spinner size="small" />

  // Get SEND token
  const sendCoin = investmentCoinsList.find((coin) => coin.symbol === 'SEND')
  if (!sendCoin) return null

  // Filter coins that have a balance > 0 (excluding SEND to handle separately)
  const ownedCoins = investmentCoins.filter(
    (coin) => coin.balance && coin.balance > 0n && coin.symbol !== 'SEND'
  )

  // Get SEND token with its actual balance or 0
  const sendCoinWithBalance = investmentCoins.find((coin) => coin.symbol === 'SEND') || {
    ...sendCoin,
    balance: 0n,
  }

  // Sort owned coins by balance (highest first)
  const sortedOwnedCoins = ownedCoins.sort((a, b) =>
    (b?.balance ?? 0n) > (a?.balance ?? 0n) ? 1 : -1
  )

  // Always start with SEND token, then add other owned tokens
  const allCoinsToShow = [sendCoinWithBalance, ...sortedOwnedCoins]

  // Show up to 3 tokens total (SEND + 2 others max)
  const maxDisplay = 3
  const coinsToShow = allCoinsToShow.slice(0, maxDisplay)
  const remainingCount = allCoinsToShow.length - maxDisplay

  return (
    <XStack ai="center" mr={remainingCount > 0 ? '$0' : '$3.5'}>
      <OverlappingCoinIcons coins={coinsToShow} length={coinsToShow.length} />
      {remainingCount > 0 ? (
        <ThemeableStack circular ai="center" jc="center" bc="$color0" w={'$3.5'} h="$3.5">
          <Paragraph fontSize={'$4'} fontWeight="500">
            +{remainingCount}
          </Paragraph>
        </ThemeableStack>
      ) : null}
    </XStack>
  )
}

function OverlappingCoinIcons({
  coins,
  length = 3,
  ...props
}: { coins: CoinWithBalance[]; length?: number } & XStackProps) {
  return (
    <XStack ai="center" {...props}>
      {coins.slice(0, length).map(({ symbol }, index) => (
        <ThemeableStack
          key={symbol}
          circular
          mr={index === coins.slice(0, length).length - 1 ? '$0' : '$-3.5'}
          bc="transparent"
          ai="center"
          jc="center"
        >
          <IconCoin size={'$3'} symbol={symbol} />
        </ThemeableStack>
      ))}
    </XStack>
  )
}

function InvestmentsAggregate() {
  const coins = useCoins().investmentCoins.filter((c) => c?.balance && c.balance > 0n)

  const tokenIds = coins.map((c) => c.coingeckoTokenId)
  const { data: marketData, isLoading, isError } = useMultipleTokensMarketData(tokenIds)

  const { totalValue, assetValues } = useMemo(() => {
    if (!marketData?.length) return { totalValue: 0, assetValues: [] }

    // Calculate values for each asset and total
    const assetValues = coins.map((coin) => {
      const marketInfo = marketData.find((m) => m.id === coin.coingeckoTokenId)
      if (!marketInfo || !coin.balance) return { value: 0, percentChange: 0 }

      const parsedBalance = formatUnits(coin.balance, coin.decimals)
      return {
        value: Number(parsedBalance) * (marketInfo.current_price ?? 0),
        percentChange: marketInfo.price_change_percentage_24h ?? 0,
      }
    })

    const totalValue = assetValues.reduce((sum, asset) => sum + asset.value, 0)

    return { totalValue, assetValues }
  }, [marketData, coins])

  const aggregatePercentage = useMemo(() => {
    if (totalValue <= 0) return 0

    const weightedPercentage = assetValues.reduce((sum, asset) => {
      const weight = asset.value / totalValue
      return sum + asset.percentChange * weight
    }, 0)

    return Math.round(weightedPercentage * 100) / 100
  }, [totalValue, assetValues])

  if (tokenIds.length === 0)
    return (
      <XStack gap="$2" ai="center">
        <Paragraph color="$color10">Diversify Your Portfolio</Paragraph>
      </XStack>
    )

  if (isLoading) return <Spinner size="small" />

  if (isError)
    return (
      <XStack gap="$2" ai="center">
        <Paragraph color="$color10" $gtXs={{ fontSize: 14 }} fontSize={12}>
          Failed to load market data
        </Paragraph>
        <IconError size="$1.5" color={'$error'} />
      </XStack>
    )

  if (aggregatePercentage > 0)
    return (
      <Theme name={'green_active'}>
        <Paragraph fontSize={'$4'}>+{aggregatePercentage}%</Paragraph>
      </Theme>
    )
  if (aggregatePercentage < 0)
    return (
      <Theme name={'red_active'}>
        <Paragraph fontSize={'$4'}>{aggregatePercentage}%</Paragraph>
      </Theme>
    )
  return (
    <Paragraph fontSize={'$4'} color="$color10">
      {aggregatePercentage}%
    </Paragraph>
  )
}
