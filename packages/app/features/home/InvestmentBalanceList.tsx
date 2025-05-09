import { Link, LinkableButton, type LinkProps, Paragraph, XStack, YStack } from '@my/ui'

import { IconCoin } from 'app/components/icons/IconCoin'
import type { CoinWithBalance } from 'app/data/coins'

import { useCoins } from 'app/provider/coins'

import formatAmount from 'app/utils/formatAmount'
import { Fragment } from 'react'
import { useHoverStyles } from 'app/utils/useHoverStyles'
import { convertBalanceToFiat } from 'app/utils/convertBalanceToUSD'
import { useTokenPrices } from 'app/utils/useTokenPrices'
import { type MarketData, useMultipleTokensMarketData } from 'app/utils/coin-gecko'
import { useThemeSetting } from '@tamagui/next-theme'
import { useIsPriceHidden } from 'app/features/home/utils/useIsPriceHidden'
import { IconPlus } from 'app/components/icons'

export const InvestmentsBalanceList = () => {
  const { investmentCoins, isLoading } = useCoins()
  const hoverStyles = useHoverStyles()
  const { data: tokensMarketData, isLoading: isLoadingTokensMarketData } =
    useMultipleTokensMarketData(investmentCoins?.map((c) => c.coingeckoTokenId) || [])

  if (isLoading) return null

  return investmentCoins.map((coin) => (
    <Fragment key={`token-balance-list-${coin.label}`}>
      <TokenBalanceItem
        testID={`token-balance-list-${coin.label}`}
        coin={coin}
        jc={'space-between'}
        ai={'center'}
        p={'$3.5'}
        br={'$4'}
        href={{
          pathname: '/',
          query: { token: coin.token },
        }}
        hoverStyle={hoverStyles}
        tokensMarketData={tokensMarketData}
        isLoadingTokensMarketData={isLoadingTokensMarketData}
      />
    </Fragment>
  ))
}

const TokenBalanceItem = ({
  coin,
  tokensMarketData,
  isLoadingTokensMarketData,
  ...props
}: {
  coin: CoinWithBalance
  tokensMarketData?: MarketData
  isLoadingTokensMarketData: boolean
} & Omit<LinkProps, 'children'>) => {
  const { data: tokenPrices, isLoading: isLoadingTokenPrices } = useTokenPrices()
  const balanceInUSD = convertBalanceToFiat(
    coin,
    coin.symbol === 'USDC' ? 1 : tokenPrices?.[coin.token]
  )
  const { resolvedTheme } = useThemeSetting()
  const isDarkTheme = resolvedTheme?.startsWith('dark')
  const changePercent24h =
    tokensMarketData?.find((marketData) => marketData.id === coin.coingeckoTokenId)
      ?.price_change_percentage_24h ?? null
  const changeText = changePercent24h?.toFixed(2) || ''
  const isNeutral = changeText === '0.00' || changeText === '-0.00'
  const { isPriceHidden } = useIsPriceHidden()

  return (
    <Link display="flex" {...props}>
      <XStack f={1} gap={'$3.5'} ai={'center'}>
        <IconCoin symbol={coin.symbol} size={'$3.5'} />
        <YStack f={1} jc={'space-between'}>
          <XStack jc={'space-between'} ai={'center'}>
            <Paragraph fontSize={'$6'} fontWeight={'500'} color={'$color12'}>
              {coin.shortLabel || coin.label}
            </Paragraph>
            <TokenBalance coin={coin} />
          </XStack>
          <XStack jc={'space-between'} ai={'center'}>
            <Paragraph
              fontSize={'$5'}
              color={'$lightGrayTextField'}
              $theme-light={{ color: '$darkGrayTextField' }}
            >
              {(() => {
                switch (true) {
                  case isLoadingTokenPrices || balanceInUSD === undefined:
                    return '$0.00'
                  case isPriceHidden:
                    return '///////'
                  default:
                    return `$${formatAmount(balanceInUSD, 12, 2)}`
                }
              })()}
            </Paragraph>
            <Paragraph
              color={(() => {
                switch (true) {
                  case isLoadingTokensMarketData || changePercent24h === null || isNeutral:
                    return isDarkTheme ? '$lightGrayTextField' : '$darkGrayTextField'
                  case changePercent24h !== null && changePercent24h >= 0:
                    return '$olive'
                  default:
                    return '$error'
                }
              })()}
            >
              {isLoadingTokensMarketData || changePercent24h === null || isNeutral
                ? '0.00%'
                : `${changePercent24h >= 0 ? '+' : ''}${changePercent24h.toFixed(2)}%`}
            </Paragraph>
          </XStack>
        </YStack>
      </XStack>
    </Link>
  )
}

const TokenBalance = ({
  coin: { decimals, balance, formatDecimals },
}: {
  coin: CoinWithBalance
}) => {
  const { isPriceHidden } = useIsPriceHidden()

  if (balance === undefined) return <></>
  return (
    <Paragraph
      fontSize={'$6'}
      fontWeight={'500'}
      col="$color12"
      $gtSm={{ fontSize: '$8', fontWeight: '600' }}
    >
      {isPriceHidden
        ? '//////'
        : formatAmount((Number(balance) / 10 ** decimals).toString(), 10, formatDecimals ?? 5)}
    </Paragraph>
  )
}

export const AddInvestmentLink = () => {
  const hoverStyles = useHoverStyles()

  return (
    <LinkableButton circular href="/trade" p="$2" size="$5" hoverStyle={hoverStyles}>
      <LinkableButton.Icon>
        <IconPlus size="$5" color="$color10" />
      </LinkableButton.Icon>
    </LinkableButton>
  )
}
