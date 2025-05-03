type WeightedShare = { address: `0x${string}`; amount: bigint }

export enum Mode {
  Linear = 'linear',
  Logarithmic = 'logarithmic',
  SquareRoot = 'square_root',
  Exponential = 'exponential',
  EaseInOut = 'ease_in_out',
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
  }[],
  timeAdjustedAmount: bigint,
  mode: Mode = Mode.Linear
): Record<string, WeightedShare> {
  const poolWeights: Record<`0x${string}`, bigint> = {}

  // First calculate all slashed weights
  const totalBalance = balances.reduce((acc, { balance }) => acc + BigInt(balance), 0n)

  for (const { address, balance } of balances) {
    poolWeights[address] = calculateWeightByMode(
      BigInt(balance),
      totalBalance,
      balances.length,
      mode
    )
  }

  // Calculate shares using the two sets of weights
  const weightedShares: Record<string, WeightedShare> = {}

  const totalWeight = Object.values(poolWeights).reduce((acc, w) => acc + w, 0n)

  for (const { address } of balances) {
    const poolWeight = poolWeights[address] ?? 0n

    const amount = (poolWeight * timeAdjustedAmount) / totalWeight

    if (amount > 0n) {
      weightedShares[address] = {
        amount,
        address,
      }
    }
  }

  handleRoundingErrors(weightedShares, timeAdjustedAmount)

  return weightedShares
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
    case Mode.EaseInOut:
      return calculateCubicBezierWeight(balance, totalBalance)
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

function calculateCubicBezierWeight(balance: bigint, totalBalance: bigint): bigint {
  // Normalize the balance to [0,1]
  const t = Number(balance) / Number(totalBalance)

  // Control points for flat behavior at extremes
  const p0 = 0
  const p1 = 0.2 // Close to start for flat beginning
  const p2 = 0.8 // Close to end for flat ending
  const p3 = 1

  // Cubic Bezier formula
  const bezier =
    (1 - t) ** 3 * p0 + 3 * (1 - t) ** 2 * t * p1 + 3 * (1 - t) * t ** 2 * p2 + t ** 3 * p3

  return BigInt(Math.floor(Number(PERC_DENOM) * bezier))
}
