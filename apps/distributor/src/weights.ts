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

export const PERC_DENOM = 10000n

export function calculatePercentageWithBips(value: bigint, bips: bigint) {
  const bps = bips * PERC_DENOM
  const percentage = value * (bps / PERC_DENOM)
  return percentage / PERC_DENOM
}

/**
 * Given a list of balances and a distribution amount, calculate the distribution weights and share amounts.
 */
export function calculateWeights(
  balances: readonly { address: `0x${string}`; balance: string }[],
  amount: bigint,
  mode: Mode = Mode.Linear
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
  const weightPerSend = (totalWeight * PERC_DENOM) / amount

  const weightedShares: Record<string, WeightedShare> = {}
  for (const [address, weight] of Object.entries(poolWeights)) {
    const amount = (weight * PERC_DENOM) / weightPerSend
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
