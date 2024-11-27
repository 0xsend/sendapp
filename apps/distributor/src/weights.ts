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

export enum Mode {
  Linear = 'linear',
  Logarithmic = 'logarithmic',
  SquareRoot = 'square_root',
  Exponential = 'exponential',
}

export const PERC_DENOM = 10000000n

export function calculatePercentageWithBips(value: bigint, bips: bigint) {
  const bps = bips * PERC_DENOM
  const percentage = value * (bps / PERC_DENOM)
  return percentage / PERC_DENOM
}

/**
 * Given a list of balances and a distribution amount, calculate the distribution weights and share amounts.
 */
export function calculateWeights(
  balances: readonly {
    address: `0x${string}`
    balance: string
    balanceAfterSlash: string
  }[],
  amount: bigint,
  timeAdjustedAmount: bigint,
  mode: Mode = Mode.Linear
): {
  weightedShares: Record<string, WeightedShare>
  weightedSharesAfterSlash: Record<string, WeightedShare>
} {
  const poolWeights: Record<`0x${string}`, bigint> = {}
  const poolWeightsAfterSlash: Record<`0x${string}`, bigint> = {}

  // First calculate all slashed weights
  const totalBalanceAfterSlash = balances.reduce(
    (acc, { balanceAfterSlash }) => acc + BigInt(balanceAfterSlash),
    0n
  )

  for (const { address, balanceAfterSlash } of balances) {
    poolWeightsAfterSlash[address] = calculateWeightByMode(
      BigInt(balanceAfterSlash),
      totalBalanceAfterSlash,
      balances.length,
      mode
    )
  }

  // Now calculate potential weights using slashed weights for all except current
  for (const current of balances) {
    const totalWeight =
      totalBalanceAfterSlash - BigInt(current.balanceAfterSlash) + BigInt(current.balance)
    poolWeights[current.address] = calculateWeightByMode(
      BigInt(current.balance),
      totalWeight,
      balances.length,
      mode
    )
  }

  // Calculate shares using the two sets of weights
  const weightedShares: Record<string, WeightedShare> = {}
  const weightedSharesAfterSlash: Record<string, WeightedShare> = {}

  const totalWeightAfterSlash = Object.values(poolWeightsAfterSlash).reduce((acc, w) => acc + w, 0n)

  for (const { address } of balances) {
    const poolWeight = poolWeights[address] ?? 0n
    const poolWeightAfterSlash = poolWeightsAfterSlash[address] ?? 0n
    const totalWeight = totalWeightAfterSlash - poolWeightAfterSlash + poolWeight

    // with capped slashed balances:
    // totalWeightAfterSlash = sum of all capped slashed balances
    // -poolWeightAfterSlash = remove this user's capped slashed balance
    // +poolWeight = add their full unslashed balance

    const potentialAmount = (poolWeight * amount) / totalWeight
    const slashedAmount = (poolWeightAfterSlash * timeAdjustedAmount) / totalWeightAfterSlash

    if (potentialAmount > 0n) {
      weightedShares[address] = {
        amount: potentialAmount > amount ? amount : potentialAmount,
        address,
      }
    }

    if (slashedAmount > 0n) {
      weightedSharesAfterSlash[address] = {
        amount: slashedAmount,
        address,
      }
    }
  }

  handleRoundingErrors(weightedSharesAfterSlash, timeAdjustedAmount)

  return { weightedShares, weightedSharesAfterSlash }
}

// Helper function to handle rounding errors
function handleRoundingErrors(shares: Record<string, WeightedShare>, targetAmount: bigint) {
  let totalDistributed = 0n
  for (const share of Object.values(shares)) {
    totalDistributed += share.amount
  }

  if (totalDistributed > targetAmount) {
    const difference = targetAmount - totalDistributed
    const largestShare = Object.values(shares).reduce((a, b) => (a.amount > b.amount ? a : b))
    largestShare.amount += difference
  }
}

function calculateWeightByMode(
  balance: bigint,
  totalBalance: bigint,
  numBalances: number,
  mode: Mode
): bigint {
  switch (mode) {
    case Mode.Linear:
      return balance
    case Mode.Logarithmic:
      return calculateLogarithmicWeight(balance, totalBalance)
    case Mode.SquareRoot:
      return calculateSquareRootWeight(balance, totalBalance)
    case Mode.Exponential:
      return calculateExponentialWeight(balance, totalBalance, numBalances)
    default:
      throw new Error(`Unknown weight mode: ${mode}`)
  }
}

function calculateLogarithmicWeight(balance: bigint, totalBalance: bigint): bigint {
  return BigInt(
    Math.floor(Number(PERC_DENOM) * Math.log(1 + Number(balance) / Number(totalBalance)))
  )
}

function calculateSquareRootWeight(balance: bigint, totalBalance: bigint): bigint {
  return BigInt(
    Math.floor(Number(PERC_DENOM) * Math.sqrt(1 - Number(balance) / Number(totalBalance)))
  )
}

function calculateExponentialWeight(
  balance: bigint,
  totalBalance: bigint,
  numBalances: number
): bigint {
  const k = 0.005 * numBalances
  return BigInt(
    Math.floor(Number(PERC_DENOM) * Math.exp((-k * Number(balance)) / Number(totalBalance)))
  )
}
