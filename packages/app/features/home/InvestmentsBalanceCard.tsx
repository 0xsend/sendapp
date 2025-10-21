import {
  Card,
  type CardProps,
  Paragraph,
  type ParagraphProps,
  Theme,
  ThemeableStack,
  withStaticProperties,
  XStack,
  type XStackProps,
  YStack,
  useMedia,
  type ButtonProps,
  Button,
  View,
  Shimmer,
} from '@my/ui'
import formatAmount, { localizeAmount } from 'app/utils/formatAmount'
import { ChevronRight } from '@tamagui/lucide-icons'
import { useIsPriceHidden } from './utils/useIsPriceHidden'
import { useSendAccountBalances } from 'app/utils/useSendAccountBalances'
import {
  type CoinWithBalance,
  investmentCoins,
  investmentCoins as investmentCoinsList,
} from 'app/data/coins'
import { useRootScreenParams } from 'app/routers/params'
import { useTokensMarketData } from 'app/utils/coin-gecko'
import { useMemo, useRef } from 'react'
import { IconCoin, IconError } from 'app/components/icons'
import { useCoins } from 'app/provider/coins'
import { formatUnits } from 'viem'
import { calculatePercentageChange } from './utils/calculatePercentageChange'
import { HomeBodyCard } from './screen'
import { Platform } from 'react-native'
import { useRouter } from 'solito/router'

const InvestmentsBalanceCardContent = (props: CardProps) => {
  const [queryParams, setParams] = useRootScreenParams()
  const router = useRouter()
  const { gtMd } = useMedia()

  const toggleSubScreen = () => {
    if (Platform.OS === 'web') {
      setParams(
        {
          ...queryParams,
          token: queryParams.token === 'investments' && gtMd ? undefined : 'investments',
        },
        { webBehavior: 'push' }
      )
      return
    }

    router.push('/investments')
  }

  return (
    <HomeBodyCard materialInteractive onPress={toggleSubScreen} {...props}>
      {props.children}
    </HomeBodyCard>
  )
}

const InvestmentsBalanceCardHomeScreenHeader = () => {
  const [queryParams] = useRootScreenParams()
  const isInvestmentCoin = investmentCoins.some(
    (coin) => coin.token.toLowerCase() === queryParams.token?.toLowerCase()
  )
  const isInvestmentsScreen = queryParams.token === 'investments'

  const isChevronLeft = isInvestmentCoin || isInvestmentsScreen

  return (
    <Card.Header p={0} jc="space-between" fd="row">
      <Paragraph
        fontSize={'$5'}
        fontWeight="400"
        color={'$lightGrayTextField'}
        $theme-light={{ color: '$darkGrayTextField' }}
      >
        Invest
      </Paragraph>

      <View animateOnly={['transform']} animation="fast" rotate={isChevronLeft ? '180deg' : '0deg'}>
        <ChevronRight
          size="$1"
          color={isChevronLeft ? '$primary' : '$lightGrayTextField'}
          $theme-light={{ color: isChevronLeft ? '$color12' : '$darkGrayTextField' }}
          $lg={{ display: isChevronLeft ? 'none' : 'flex' }}
        />
      </View>
    </Card.Header>
  )
}

const InvestmentsBalanceCardFooter = ({ onInvest }: { onInvest?: () => void }) => {
  return (
    <Card.Footer jc="center" ai="center">
      {onInvest ? <InvestmentsBalanceCardInvestButton onPress={onInvest} /> : null}
    </Card.Footer>
  )
}

// Primary Invest button
const InvestmentsBalanceCardInvestButton = ({
  children = 'INVEST',
  ...props
}: ButtonProps & { children?: React.ReactNode }) => (
  <Button
    theme="neon_active"
    borderRadius={'$4'}
    jc="center"
    ai="center"
    position="relative"
    f={1}
    mah={32}
    {...props}
  >
    <Button.Text color="$black">{children}</Button.Text>
  </Button>
)

const InvestmentsBalanceCardBody = () => (
  <YStack w={'100%'} gap={'$3'}>
    <XStack ai="center" gap={'$2.5'}>
      <InvestmentsBalanceCardBalance />
      <InvestmentsAggregate />
    </XStack>
    <InvestmentsWeeklyDelta />
  </YStack>
)

const InvestmentsBalanceCardBalance = (props: ParagraphProps) => {
  const media = useMedia()
  const [queryParams] = useRootScreenParams()
  const isInvestmentsScreen = queryParams.token === 'investments'
  const { isPriceHidden, isPriceHiddenLoading } = useIsPriceHidden()
  const { dollarBalances } = useSendAccountBalances()

  /**
   *  Why this ? to avoid ui flickering when balance is switching from undefined to defined multiple times
   *  */

  const lastValidDollarBalance = useRef(dollarBalances)
  if (dollarBalances !== undefined) {
    lastValidDollarBalance.current = dollarBalances
  }

  const dollarTotal = Object.entries(lastValidDollarBalance.current ?? {})
    .filter(([address]) =>
      investmentCoins.some((coin) => coin.token.toLowerCase() === address.toLowerCase())
    )
    .reduce((total, [, balance]) => total + balance, 0)

  const formattedBalance = formatAmount(dollarTotal, 6, 0)

  const loading = isPriceHiddenLoading || !lastValidDollarBalance.current

  return (
    <Paragraph
      color={'$color12'}
      fontWeight={600}
      size={media.lg && isInvestmentsScreen ? '$10' : '$9'}
      lineHeight={34}
      {...props}
    >
      {(() => {
        switch (true) {
          case loading:
            return <Shimmer w={80} h={34} br={5} />
          case isPriceHidden:
            return '******'
          default:
            return `$${formattedBalance}`
        }
      })()}
    </Paragraph>
  )
}

function InvestmentsPreview(props: XStackProps) {
  const { investmentCoins } = useCoins()

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
    <XStack ai="center" {...props}>
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
          mr={index === coins.slice(0, length).length - 1 ? '$0' : -8}
          bc="transparent"
          ai="center"
          jc="center"
        >
          <IconCoin size={'$2.5'} symbol={symbol} />
        </ThemeableStack>
      ))}
    </XStack>
  )
}

function InvestmentsAggregate() {
  const coins = useCoins().investmentCoins.filter((c) => c?.balance && c.balance > 0n)

  const { data: marketData, isLoading } = useTokensMarketData()

  const { totalValue, assetValues } = useMemo(() => {
    if (!marketData?.length) return { totalValue: 0, assetValues: [] }

    // Calculate values for each asset and total
    const assetValues = coins.map((coin) => {
      const marketInfo = marketData.find((m) => m.id === coin.coingeckoTokenId)
      if (!marketInfo || !coin.balance) return { value: 0, percentChange7d: 0 }

      const parsedBalance = formatUnits(coin.balance, coin.decimals)
      const percentChange7d =
        ('price_change_percentage_7d_in_currency' in marketInfo &&
        marketInfo.price_change_percentage_7d_in_currency !== null
          ? marketInfo.price_change_percentage_7d_in_currency
          : 0) ?? 0
      return {
        value: Number(parsedBalance) * (marketInfo.current_price ?? 0),
        percentChange7d,
      }
    })

    const totalValue = assetValues.reduce((sum, asset) => sum + asset.value, 0)

    return { totalValue, assetValues }
  }, [marketData, coins])

  const aggregatePercentage = useMemo(() => {
    if (totalValue <= 0) return 0

    const weightedPercentage = assetValues.reduce((sum, asset) => {
      const weight = asset.value / totalValue
      return sum + asset.percentChange7d * weight
    }, 0)

    return Math.round(weightedPercentage * 100) / 100
  }, [totalValue, assetValues])

  if (isLoading) return <Shimmer w={40} h={20} br={5} />

  const formatted = `${aggregatePercentage > 0 ? '+' : ''}${aggregatePercentage}%`

  if (aggregatePercentage > 0)
    return (
      <Theme name={'green_active'}>
        <XStack
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
  if (aggregatePercentage < 0)
    return (
      <Theme name={'red_active'}>
        <XStack
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
  return null
}

function InvestmentsWeeklyDelta() {
  const { investmentCoins, isLoading: isLoadingCoins } = useCoins()
  const coins = investmentCoins.filter((c) => c?.balance && c.balance > 0n)
  const { data: marketData, isLoading, isError } = useTokensMarketData()
  const { isPriceHidden } = useIsPriceHidden()

  const deltaUSD = useMemo(() => {
    if (!marketData?.length) return 0
    return coins.reduce((sum, coin) => {
      const md = marketData.find((m) => m.id === coin.coingeckoTokenId)
      if (!md || !coin.balance) return sum
      const value = Number(formatUnits(coin.balance, coin.decimals)) * (md.current_price ?? 0)
      const pct7d =
        ('price_change_percentage_7d_in_currency' in md &&
        md.price_change_percentage_7d_in_currency !== null
          ? md.price_change_percentage_7d_in_currency
          : 0) ?? 0

      const actualChange = calculatePercentageChange(value, pct7d)

      return sum + actualChange
    }, 0)
  }, [marketData, coins])

  if (isLoading || isLoadingCoins) return <Shimmer w={120} h={20} br={5} />

  if (coins.length === 0)
    return (
      <XStack gap="$2" ai="center">
        <Paragraph color="$color10">Diversify Your Portfolio</Paragraph>
      </XStack>
    )

  if (isError)
    return (
      <XStack gap="$2" ai="center">
        <Paragraph color="$color10" $gtXs={{ fontSize: 14 }} fontSize={12}>
          Failed to load market data
        </Paragraph>
        <IconError size="$1.5" color={'$error'} />
      </XStack>
    )

  const sign = deltaUSD >= 0 ? '+' : '-'
  const formattedDeltaUSD = localizeAmount(Math.abs(deltaUSD).toFixed(2))
  return (
    <Paragraph color={'$color10'} fontWeight={400} size={'$5'}>
      {isPriceHidden ? '******' : `${sign}$${formattedDeltaUSD} this week`}
    </Paragraph>
  )
}

const InvestmentsBalanceCardStaticContent = (props: CardProps) => {
  return (
    <Card w={'100%'} {...props}>
      {props.children}
    </Card>
  )
}

export const InvestmentsBalanceCard = withStaticProperties(InvestmentsBalanceCardContent, {
  HomeScreenHeader: InvestmentsBalanceCardHomeScreenHeader,
  Footer: InvestmentsBalanceCardFooter,
  Body: InvestmentsBalanceCardBody,
  Button: InvestmentsBalanceCardInvestButton,
  Preview: InvestmentsPreview,
  Aggregate: InvestmentsAggregate,
  WeeklyDelta: InvestmentsWeeklyDelta,
  Balance: InvestmentsBalanceCardBalance,
})

export const InvestmentsPortfolioCard = withStaticProperties(InvestmentsBalanceCardStaticContent, {
  HomeScreenHeader: InvestmentsBalanceCardHomeScreenHeader,
  Footer: InvestmentsBalanceCardFooter,
  Body: InvestmentsBalanceCardBody,
  Button: InvestmentsBalanceCardInvestButton,
  Preview: InvestmentsPreview,
  Aggregate: InvestmentsAggregate,
  WeeklyDelta: InvestmentsWeeklyDelta,
  Balance: InvestmentsBalanceCardBalance,
})
