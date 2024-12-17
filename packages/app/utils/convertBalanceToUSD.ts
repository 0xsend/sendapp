// convertBalanceToFiat.ts
import type { CoinWithBalance } from 'app/data/coins'

export const convertBalanceToFiat = (coin: CoinWithBalance, tokenPrice = 0) => {
  if (!tokenPrice || !coin.balance) return undefined

  // Convert BigInt to number safely
  const balance = Number(coin.balance.toString())
  const decimals = 10 ** coin.decimals

  return (balance / decimals) * tokenPrice
}
