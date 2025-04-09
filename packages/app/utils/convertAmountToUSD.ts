export const convertAmountToUSD = (amount: bigint, decimals = 0, tokenPrice = 0) => {
  const balance = Number(amount.toString())
  return (balance / 10 ** decimals) * tokenPrice
}
