import { Link, type LinkProps, Paragraph, XStack, YStack } from '@my/ui'

import { IconCoin } from 'app/components/icons/IconCoin'
import type { CoinWithBalance } from 'app/data/coins'

import { useCoins } from 'app/provider/coins'
import formatAmount from 'app/utils/formatAmount'
import { Fragment } from 'react'
import { useHoverStyles } from 'app/utils/useHoverStyles'
import { convertBalanceToFiat } from 'app/utils/convertBalanceToUSD'
import { useTokenPrices } from 'app/utils/useTokenPrices'
import { useIsPriceHidden } from 'app/features/home/utils/useIsPriceHidden'

export const StablesBalanceList = () => {
  const { stableCoins, isLoading } = useCoins()
  const hoverStyles = useHoverStyles()

  if (isLoading) return null

  return stableCoins.map((coin) => (
    <Fragment key={`token-balance-list-${coin.label}`}>
      <TokenBalanceItem
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
      />
    </Fragment>
  ))
}

const TokenBalanceItem = ({
  coin,

  ...props
}: {
  coin: CoinWithBalance
} & Omit<LinkProps, 'children'>) => {
  const { data: tokenPrices, isLoading: isLoadingTokenPrices } = useTokenPrices()
  const balanceInUSD = convertBalanceToFiat(
    coin,
    coin.symbol === 'USDC' ? 1 : tokenPrices?.[coin.token]
  )
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
