import type { allCoins, coin } from 'app/data/coins'
import { IconEthereum } from './IconEthereum'
import { IconSend } from './IconSend'
import { IconUSDC } from './IconUSDC'
import { IconSPX6900 } from './IconSPX6900'

const coinSymbolToIcons: Record<coin['symbol'], JSX.Element> = {
  USDC: <IconUSDC size={'$2.5'} />,
  ETH: <IconEthereum size={'$2.5'} />,
  SEND: <IconSend size={'$2.5'} />,
  SPX: <IconSPX6900 size={'$2.5'} />,
}

export const IconCoin = ({ symbol }: { symbol: allCoins[number]['symbol'] }) => {
  return coinSymbolToIcons[symbol]
}
