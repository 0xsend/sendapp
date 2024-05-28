import type { coin } from 'app/data/coins'
import { IconEthereum } from './IconEthereum'
import { IconSend } from './IconSend'
import { IconUSDC } from './IconUSDC'

const coinSymbolToIcons: Record<coin['symbol'], JSX.Element> = {
  USDC: <IconUSDC size={'$2.5'} />,
  ETH: <IconEthereum size={'$2.5'} />,
  SEND: <IconSend size={'$2.5'} />,
}

export const IconCoin = ({ coin }: { coin: coin }) => {
  return coinSymbolToIcons[coin.symbol]
}
