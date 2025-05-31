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
      <Card.Header padded pb={0} fd="row" ai="center" jc="space-between">
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
      <Card.Footer padded pt={0} jc="space-between" ai="center">
        <YStack jc="space-between">
          <Paragraph color={'$color12'} fontWeight={500} size={'$10'}>
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

  const existingSymbols = new Set(investmentCoins.map((coin) => coin.symbol))
  const coins = [
    ...investmentCoins,
    ...investmentCoinsList
      .filter((coin) => !existingSymbols.has(coin.symbol))
      .map((coin) => ({ ...coin, balance: 0n })),
  ]

  const sortedByBalance = coins.toSorted((a, b) =>
    (b?.balance ?? 0n) > (a?.balance ?? 0n) ? 1 : -1
  )
  return (
    <XStack ai="center">
      <OverlappingCoinIcons coins={sortedByBalance} />
      <ThemeableStack circular ai="center" jc="center" bc="$color0" w={'$3.5'} h="$3.5">
        <Paragraph fontSize={'$4'} fontWeight="500">
          {`+${investmentCoinsList.length - 3}`}
        </Paragraph>
      </ThemeableStack>
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
      {coins.slice(0, length).map(({ symbol }) => (
        <ThemeableStack key={symbol} circular mr={'$-3.5'} bc="transparent" ai="center" jc="center">
          <IconCoin size={'$3'} symbol={symbol} />
        </ThemeableStack>
      ))}
    </XStack>
  )
}

function InvestmentsAggregate() {
  const tokenIds = useCoins()
    .investmentCoins.filter((c) => c?.balance && c.balance > 0n)
    .map((c) => c.coingeckoTokenId)

  const { data: marketData, isLoading, isError } = useMultipleTokensMarketData(tokenIds)
  const aggregatePercentage = useMemo(() => {
    if (!marketData?.length) return 0

    // Simple average of percentage changes
    const aggregatePercentage =
      marketData.reduce((total, coin) => {
        return total + (coin?.price_change_percentage_24h ?? 0)
      }, 0) / marketData.length

    return Number(aggregatePercentage.toFixed(2))
  }, [marketData])

  if (tokenIds.length === 0)
    return (
      <XStack gap="$2" ai="center">
        <Paragraph color="$color10" $gtXs={{ fontSize: 14 }} fontSize={12}>
          Diversify Your Portfolio
        </Paragraph>
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
