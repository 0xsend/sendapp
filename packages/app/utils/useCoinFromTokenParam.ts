import { baseMainnet, usdcAddress } from '@my/wagmi'
import { useCoins } from 'app/provider/coins'
import { useRootScreenParams, useSendScreenParams } from 'app/routers/params'

export const useCoinFromTokenParam = () => {
  const [{ token: tokenParam }] = useRootScreenParams()
  const { coins } = useCoins()
  const selectedCoin = coins.find((c) => c.token === tokenParam)
  return selectedCoin
}

export const useCoinFromSendTokenParam = () => {
  const { coins } = useCoins()
  const [sendParams] = useSendScreenParams()
  const sendToken = sendParams.sendToken ?? usdcAddress[baseMainnet.id]
  const selectedCoin = coins.find((c) => c.token === sendToken)
  if (!selectedCoin) throw new Error(`Coin with token ${sendToken} not found`)
  return selectedCoin
}
