import type { allCoins, coin } from 'app/data/coins'
import { IconEthereum } from './IconEthereum'
import { IconSend } from './IconSend'
import { IconUSDC } from './IconUSDC'
import { IconSPX6900 } from './IconSPX6900'
import type { IconProps } from '@tamagui/helpers-icon'
import type { NamedExoticComponent } from 'react'

const coinSymbolToIcons: Record<coin['symbol'], NamedExoticComponent<IconProps>> = {
  USDC: IconUSDC,
  ETH: IconEthereum,
  SEND: IconSend,
  SPX: IconSPX6900,
}

export const IconCoin = ({
  symbol,
  ...props
}: { symbol: allCoins[number]['symbol'] } & IconProps) => {
  const Icon = coinSymbolToIcons[symbol]

  if (!Icon) {
    return null
  }

  return <Icon size={'$2.5'} {...props} />
}
