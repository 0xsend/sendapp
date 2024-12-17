import { Link, Paragraph, XStack, type LinkProps } from '@my/ui'

import { IconCoin } from 'app/components/icons/IconCoin'
import type { CoinWithBalance } from 'app/data/coins'

import { useCoins } from 'app/provider/coins'
import { useRootScreenParams } from 'app/routers/params'
import formatAmount from 'app/utils/formatAmount'
import { Fragment } from 'react'

export const TokenBalanceList = () => {
  const { coins, isLoading } = useCoins()
  const [{ token: tokenParam }] = useRootScreenParams()

  if (isLoading) return null

  return coins.map((coin) => (
    <Fragment key={`token-balance-list-${coin.label}`}>
      <TokenBalanceItem
        coin={coin}
        jc={'space-between'}
        ai={'center'}
        py={'$3.5'}
        px={'$3'}
        disabled={tokenParam !== undefined && tokenParam !== coin.token}
        disabledStyle={{ opacity: 0.5 }}
        href={{
          pathname: '/',
          query: { token: coin.token },
        }}
      />
    </Fragment>
  ))
}

const TokenBalanceItem = ({
  coin,
  ...props
}: { coin: CoinWithBalance } & Omit<LinkProps, 'children'>) => {
  return (
    <Link display="flex" {...props}>
      <XStack gap={'$2'} $gtLg={{ gap: '$3.5' }} ai={'center'}>
        <IconCoin symbol={coin.symbol} />
        <Paragraph
          fontSize={'$5'}
          fontWeight={'500'}
          textTransform={'uppercase'}
          color={'$color12'}
        >
          {coin.label}
        </Paragraph>
      </XStack>
      <XStack gap={'$3.5'} ai={'center'}>
        <TokenBalance coin={coin} />
      </XStack>
    </Link>
  )
}

const TokenBalance = ({ coin: { decimals, balance } }: { coin: CoinWithBalance }) => {
  if (!balance) return <></>
  return (
    <Paragraph fontSize={'$9'} fontWeight={'600'} col="$color12">
      {formatAmount((Number(balance) / 10 ** decimals).toString(), 10, 5)}
    </Paragraph>
  )
}
