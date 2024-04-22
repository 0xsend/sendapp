import { IconEthereum, IconSend, IconUSDC } from 'app/components/icons'
import {
  baseMainnet,
  usdcAddress as usdcAddresses,
  sendTokenAddress as sendAddresses,
} from '@my/wagmi'

export const coins = [
  { label: 'USDC', token: usdcAddresses[baseMainnet.id], icon: <IconUSDC size={'$2.5'} /> },
  { label: 'Ethereum', token: undefined, icon: <IconEthereum size={'$2.5'} /> },
  { label: 'Send', token: sendAddresses[baseMainnet.id], icon: <IconSend size={'$2.5'} /> },
]
