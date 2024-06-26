import { coins } from 'app/data/coins'
import { useRootScreenParams } from 'app/routers/params'

export const useCoinFromTokenParam = () => {
  const [{ token: tokenParam }] = useRootScreenParams()
  const selectedCoin = coins.find((c) => c.token === tokenParam)
  return selectedCoin
}
