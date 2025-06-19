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
import { ChevronRight } from '@tamagui/lucide-icons'

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
  return (
    <Link display="flex" {...props}>
      <XStack f={1} gap={'$3.5'} ai={'center'}>
        <IconCoin symbol={coin.symbol} size={'$3.5'} />
        <YStack f={1} jc={'space-between'}>
          <XStack jc={'space-between'} ai={'center'}>
            <Paragraph fontSize={'$6'} fontWeight={'500'} color={'$color12'}>
              {coin.shortLabel || coin.label}
            </Paragraph>
          </XStack>
          <XStack jc={'space-between'} ai={'center'} miw={0}>
            <Paragraph
              fontSize={'$5'}
              color={'$lightGrayTextField'}
              $theme-light={{ color: '$darkGrayTextField' }}
            >
              Base
            </Paragraph>
          </XStack>
        </YStack>
        <XStack ai={'center'} gap="$2">
          <TokenBalance coin={coin} />
          <ChevronRight size={'$1'} color={'$color12'} />
        </XStack>
      </XStack>
    </Link>
  )
}

const TokenBalance = ({
  coin,
}: {
  coin: CoinWithBalance
}) => {
  const { balance, symbol } = coin
  const { data: tokenPrices, isLoading: isLoadingTokenPrices } = useTokenPrices()
  const balanceInUSD = convertBalanceToFiat(coin, symbol === 'USDC' ? 1 : tokenPrices?.[coin.token])

  const { isPriceHidden } = useIsPriceHidden()

  if (balance === undefined) return <></>
  return (
    <Paragraph
      fontSize={'$6'}
      fontWeight={'500'}
      col="$color12"
      $gtSm={{ fontSize: '$8', fontWeight: '600' }}
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
  )
}
