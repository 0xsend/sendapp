import type { allCoins, coin } from 'app/data/coins'
import { IconEthereum } from './IconEthereum'
import { IconSend } from './IconSend'
import { IconUSDC } from './IconUSDC'
import { IconSPX6900 } from './IconSPX6900'
import type { IconProps } from '@tamagui/helpers-icon'
import type { NamedExoticComponent } from 'react'
import { IconMopho } from './IconMorpho'
import { IconAerodrome } from './IconAerodrome'
import { IconMoonwell } from './IconMoonwell'
import { IconCbBtc } from './IconCbBtc'
import { IconEURC } from './IconEURC'
import { IconMAMO } from './IconMAMO'

const coinSymbolToIcons: Record<coin['symbol'], NamedExoticComponent<IconProps>> = {
  USDC: IconUSDC,
  ETH: IconEthereum,
  SEND: IconSend,
  SPX: IconSPX6900,
  WELL: IconMoonwell,
  MORPHO: IconMopho,
  AERO: IconAerodrome,
  CBBTC: IconCbBtc,
  EURC: IconEURC,
  MAMO: IconMAMO,
}

export const IconCoin = ({
  symbol,
  ...props
}: { symbol: allCoins[number]['symbol'] } & IconProps) => {
  const Icon = coinSymbolToIcons[symbol]

  if (!Icon) {
    console.warn(`No icon found for symbol ${symbol}`)
    return null
  }

  return <Icon size={'$2.5'} {...props} />
}
