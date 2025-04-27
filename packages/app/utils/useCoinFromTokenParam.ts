import { baseMainnet, usdcAddress } from '@my/wagmi'
import { useCoin } from 'app/provider/coins'
import { useRootScreenParams, useSendToken } from 'app/routers/params'

export const useCoinFromTokenParam = () => {
  const [{ token }] = useRootScreenParams()
  return useCoin(token)
}

export const useCoinFromSendTokenParam = () => {
  const [sendToken] = useSendToken()

  return useCoin(sendToken ?? usdcAddress[baseMainnet.id])
}
