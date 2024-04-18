import { coins } from 'app/data/coins'
import { useToken } from 'app/routers/params'

export const useCoinFromTokenParam = () => {
  const [tokenParam] = useToken()
  const selectedCoin = coins.find((c) => c.token === tokenParam)
  return selectedCoin
}
