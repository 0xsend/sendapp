import { baseMainnet, usdcAddress } from '@my/wagmi'
import type { CoinWithBalance } from 'app/data/coins'
import { useCoin } from 'app/provider/coins'
import { useRootScreenParams, useSendScreenParams } from 'app/routers/params'

export const useCoinFromTokenParam = () => {
  const [{ token }] = useRootScreenParams()
  const coin = useCoin(token)
  return coin
}

export const useCoinFromSendTokenParam = () => {
  const [sendParams] = useSendScreenParams()
  const sendToken = sendParams.sendToken ?? usdcAddress[baseMainnet.id]
  // its okay to use `as` here because we use usdc as default
  const coin = useCoin(sendToken) as { coin: CoinWithBalance; isLoading: boolean }
  return coin
}
