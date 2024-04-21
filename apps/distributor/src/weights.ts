type WeightedShare = { address: `0x${string}`; amount: bigint }
type Weights = {
  /**
   * The total weight of all balances.
   */
  totalWeight: bigint
  /**
   * The weight of each send token in the distribution.
   */
  weightPerSend: bigint
  /**
   * The weight of each balance in the distribution.
   */
  poolWeights: Record<`0x${string}`, bigint>
  /**
   * The weighted share amounts of each balance in the distribution.
   */
  weightedShares: Record<`0x${string}`, WeightedShare>
}

/**
 * Given a list of balances and a distribution amount, calculate the distribution weights and share amounts.
 */
export function calculateWeights(
  balances: readonly { address: `0x${string}`; balance: string }[],
  amount: bigint,
  mode: 'linear' | 'logarithmic' | 'square_root' | 'exponential' = 'linear'
): Weights {
  const poolWeights: Record<`0x${string}`, bigint> = {}
  const totalBalance = balances.reduce((acc, { balance }) => acc + BigInt(balance), 0n)

  for (const { address, balance } of balances) {
    const weight = calculateWeightByMode(BigInt(balance), totalBalance, balances.length, mode)
    if (poolWeights[address] === undefined) {
      poolWeights[address] = 0n
    }
    poolWeights[address] += weight
  }

  const totalWeight = Object.values(poolWeights).reduce((acc, weight) => acc + weight, 0n)
  const weightPerSend = (totalWeight * 10000n) / amount

  const weightedShares: Record<string, WeightedShare> = {}
  for (const [address, weight] of Object.entries(poolWeights)) {
    const amount = (weight * 10000n) / weightPerSend
    if (amount > 0n) {
      weightedShares[address] = {
        amount,
        address: address as `0x${string}`,
      }
    }
  }

  return { totalWeight, weightPerSend, poolWeights, weightedShares }
}

function calculateWeightByMode(
  balance: bigint,
  totalBalance: bigint,
  numBalances: number,
  mode: 'linear' | 'logarithmic' | 'square_root' | 'exponential'
): bigint {
  switch (mode) {
    case 'linear':
      return balance
    case 'logarithmic':
      return calculateLogarithmicWeight(balance, totalBalance)
    case 'square_root':
      return calculateSquareRootWeight(balance, totalBalance)
    case 'exponential':
      return calculateExponentialWeight(balance, totalBalance, numBalances)
  }
}

function calculateLogarithmicWeight(balance: bigint, totalBalance: bigint): bigint {
  return BigInt(Math.floor(10000 * Math.log(1 + Number(balance) / Number(totalBalance))))
}

function calculateSquareRootWeight(balance: bigint, totalBalance: bigint): bigint {
  return BigInt(Math.floor(10000 * Math.sqrt(1 - Number(balance) / Number(totalBalance))))
}

function calculateExponentialWeight(
  balance: bigint,
  totalBalance: bigint,
  numBalances: number
): bigint {
  const k = 0.005 * numBalances
  return BigInt(Math.floor(10000 * Math.exp((-k * Number(balance)) / Number(totalBalance))))
}
