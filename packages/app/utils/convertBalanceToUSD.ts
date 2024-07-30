import { coinsDict } from 'app/data/coins'

// Takes token price, decimals and token balance and returns the balance in USD
export const convertBalanceToFiat = (
  token: keyof coinsDict,
  tokenBalance: bigint,
  tokenPrice = 0
) => {
  if (!tokenPrice) return undefined
  return (Number(tokenBalance) / 10 ** coinsDict[token].decimals) * tokenPrice
}
