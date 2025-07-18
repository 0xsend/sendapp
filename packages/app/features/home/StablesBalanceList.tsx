import { Link, Paragraph, XStack, YStack } from '@my/ui'

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
import { Platform } from 'react-native'
import { useLink } from 'solito/link'

export const StablesBalanceList = () => {
  const { stableCoins, isLoading } = useCoins()

  if (isLoading) return null

  return stableCoins.map((coin) => (
    <Fragment key={`token-balance-list-${coin.label}`}>
      <TokenBalanceItem coin={coin} />
    </Fragment>
  ))
}

const TokenBalanceItem = ({ coin }: { coin: CoinWithBalance }) => {
  const hoverStyles = useHoverStyles()
  const linkProps = useLink({
    href: {
      pathname: Platform.OS === 'web' ? '/' : '/token',
      query: { token: coin.token },
    },
  })

  const content = (
    <>
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
    </>
  )

  if (Platform.OS === 'web') {
    return (
      <Link
        display="flex"
        jc={'space-between'}
        ai={'center'}
        p={'$3.5'}
        br={'$4'}
        hoverStyle={hoverStyles}
        {...linkProps}
      >
        <XStack f={1} gap={'$3.5'} ai={'center'}>
          {content}
        </XStack>
      </Link>
    )
  }

  return (
    <XStack
      f={1}
      gap={'$3.5'}
      jc={'space-between'}
      ai={'center'}
      p={'$3.5'}
      br={'$4'}
      hoverStyle={hoverStyles}
      {...linkProps}
    >
      {content}
    </XStack>
  )
}

const TokenBalance = ({ coin }: { coin: CoinWithBalance }) => {
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
