import { baseMainnet, usdcAddress } from '@my/wagmi'
import { useCoin } from 'app/provider/coins'
import { useRootScreenParams, useSendScreenParams } from 'app/routers/params'

export const useCoinFromTokenParam = () => {
  const [{ subPage }] = useRootScreenParams()
  return useCoin(subPage)
}

export const useCoinFromSendTokenParam = () => {
  const [sendParams] = useSendScreenParams()
  const sendToken = sendParams.sendToken ?? usdcAddress[baseMainnet.id]
  return useCoin(sendToken)
}
