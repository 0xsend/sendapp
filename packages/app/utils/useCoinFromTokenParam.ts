import { baseMainnet, usdcAddress } from '@my/wagmi'
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
  const coin = useCoin(sendToken)
  if (!coin) throw new Error(`Coin with token ${sendToken} not found`)
  return coin
}
