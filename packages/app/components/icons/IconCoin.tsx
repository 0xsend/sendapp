import type { coin } from 'app/data/coins'
import { IconEthereum } from './IconEthereum'
import { IconSend } from './IconSend'
import { IconUSDC } from './IconUSDC'
import { IconSPX6900 } from './IconSPX6900'
import type { SizeTokens } from 'tamagui'

const coinSymbolToIcons: Record<coin['symbol'], (size: SizeTokens) => JSX.Element> = {
  USDC: (size) => <IconUSDC size={size} />,
  ETH: (size) => <IconEthereum size={size} />,
  SEND: (size) => <IconSend size={size} />,
  SPX: (size) => <IconSPX6900 size={size} />,
}

export const IconCoin = ({ coin, size }: { coin: coin; size?: SizeTokens }) => {
  return coinSymbolToIcons[coin.symbol]?.(size || '$2.5')
}
