import { Link, Paragraph, XStack, YStack } from '@my/ui'
import { IconCoin } from 'app/components/icons/IconCoin'
import type { CoinWithBalance } from 'app/data/coins'

import formatAmount from 'app/utils/formatAmount'
import { Fragment } from 'react'
import { useHoverStyles } from 'app/utils/useHoverStyles'
import { convertBalanceToFiat } from 'app/utils/convertBalanceToUSD'
import { useTokenPrices } from 'app/utils/useTokenPrices'
import { type MarketData, useTokensMarketData } from 'app/utils/coin-gecko'
import { useThemeSetting } from '@tamagui/next-theme'
import { useIsPriceHidden } from 'app/features/home/utils/useIsPriceHidden'
import { Platform } from 'react-native'
import { useLink } from 'solito/link'

export const InvestmentsBalanceList = ({ coins }: { coins: CoinWithBalance[] }) => {
  const { data: tokensMarketData, isLoading: isLoadingTokensMarketData } = useTokensMarketData()

  return coins.map((coin) => (
    <Fragment key={`token-balance-list-${coin.label}`}>
      <TokenBalanceItem
        coin={coin}
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
}: {
  coin: CoinWithBalance
  tokensMarketData?: MarketData
  isLoadingTokensMarketData: boolean
}) => {
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
  const hoverStyles = useHoverStyles()
  const href = {
    pathname: Platform.OS === 'web' ? '/' : '/token',
    query: { token: coin.token },
  }
  const linkProps = useLink({ href })

  const content = (
    <>
      <IconCoin symbol={coin.symbol} size={'$3.5'} />
      <YStack f={1} jc={'space-between'}>
        <XStack jc={'space-between'} ai={'center'}>
          <Paragraph fontSize={'$5'} fontWeight={'400'} color={'$color12'}>
            {coin.label}
          </Paragraph>
          <TokenUSDBalance coin={coin} />
        </XStack>
        <XStack jc={'space-between'} ai={'center'}>
          <Paragraph
            fontSize={'$5'}
            color={'$lightGrayTextField'}
            $theme-light={{ color: '$darkGrayTextField' }}
          >
            {isPriceHidden
              ? '//////'
              : `${formatAmount(
                  (Number(coin.balance) / 10 ** coin.decimals).toString(),
                  10,
                  coin.formatDecimals ?? 5
                )} ${coin.symbol}`}
          </Paragraph>
          <Paragraph
            color={(() => {
              switch (true) {
                case isLoadingTokenPrices || balanceInUSD === undefined:
                  return isDarkTheme ? '$lightGrayTextField' : '$darkGrayTextField'
                case changePercent24h !== null && changePercent24h >= 0:
                  return '$olive'
                default:
                  return '$error'
              }
            })()}
          >
            {(() => {
              switch (true) {
                case isLoadingTokensMarketData ||
                  changePercent24h === null ||
                  isNeutral ||
                  coin.balance === 0n:
                  return '---'
                case isPriceHidden:
                  return '///////'
                default:
                  return `${changePercent24h >= 0 ? '+' : ''}${changePercent24h.toFixed(2)}%`
              }
            })()}
          </Paragraph>
        </XStack>
      </YStack>
    </>
  )

  if (Platform.OS === 'web') {
    return (
      <Link
        display="flex"
        hoverStyle={hoverStyles}
        jc={'space-between'}
        ai={'center'}
        p={'$3.5'}
        br={'$4'}
        href={href}
      >
        <XStack f={1} gap={'$3.5'} ai={'center'} testID={`token-balance-list-${coin.label}`}>
          {content}
        </XStack>
      </Link>
    )
  }

  return (
    <XStack
      gap={'$3.5'}
      testID={`token-balance-list-${coin.label}`}
      jc={'space-between'}
      ai={'center'}
      p={'$3.5'}
      br={'$4'}
      {...linkProps}
    >
      {content}
    </XStack>
  )
}

const TokenUSDBalance = ({
  coin,
}: {
  coin: CoinWithBalance
}) => {
  const { data: tokenPrices } = useTokenPrices()
  const balanceInUSD = convertBalanceToFiat(
    coin,
    coin.symbol === 'USDC' ? 1 : tokenPrices?.[coin.token]
  )
  const { isPriceHidden } = useIsPriceHidden()

  if (coin.balance === undefined) return <></>
  return (
    <Paragraph fontSize={'$8'} fontWeight={'500'} col="$color12" lineHeight={24}>
      {isPriceHidden ? '//////' : `$${formatAmount(balanceInUSD, 12, 2) || 0}`}
    </Paragraph>
  )
}
