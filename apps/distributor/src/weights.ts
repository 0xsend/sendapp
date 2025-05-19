type WeightedShare = { address: `0x${string}`; amount: bigint }

export enum Mode {
  Linear = 'linear',
  Logarithmic = 'logarithmic',
  SquareRoot = 'square_root',
  Exponential = 'exponential',
  EaseInOut = 'ease_in_out',
}

export const PERC_DENOM = 1000n

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
  if (totalBalance === 0n) {
    return 0n
  }

  // t_bn represents the ratio of balance/totalBalance, scaled to PERC_DENOM
  // e.g., if balance is 30% of total and PERC_DENOM is 1000000n, t_bn would be 300000n
  const t_bn = (balance * PERC_DENOM) / totalBalance

  // Cubic Bezier formula components:
  // Term 1: (1-t)³ * p0        - influence of start point
  // Term 2: 3(1-t)²t * p1      - influence of first control point
  // Term 3: 3(1-t)t² * p2      - influence of second control point
  // Term 4: t³ * p3            - influence of end point
  const p0 = 0n
  const p1 = (PERC_DENOM * 20n) / 100n // 0.2 as BigInt
  const p2 = (PERC_DENOM * 80n) / 100n // 0.8 as BigInt
  const p3 = PERC_DENOM

  // inv_t is the inverse of t_bn (distance from 1)
  // e.g., if t_bn is 300000n, inv_t would be 700000n
  const inv_t = PERC_DENOM - t_bn

  // Cubic Bezier formula components:
  // Term 1: (1-t)³ * p0        - influence of start point
  // Term 2: 3(1-t)²t * p1      - influence of first control point
  // Term 3: 3(1-t)t² * p2      - influence of second control point
  // Term 4: t³ * p3            - influence of end point
  const bezier =
    (inv_t ** 3n * p0 +
      3n * inv_t ** 2n * t_bn * p1 +
      3n * inv_t * t_bn ** 2n * p2 +
      t_bn ** 3n * p3) /
    PERC_DENOM ** 3n

  return bezier
}
