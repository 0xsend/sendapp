import type { Address } from 'viem'

type WeightedShare = { address: `0x${string}`; amount: bigint; userId: string }

export enum Mode {
  Linear = 'linear',
  Logarithmic = 'logarithmic',
  SquareRoot = 'square_root',
  Exponential = 'exponential',
  EaseInOut = 'ease_in_out',
}

export const PERC_DENOM = 1000000000000000000n

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
    userId: string
    balance: bigint
  }[],
  timeAdjustedAmount: bigint,
  mode: Mode = Mode.Linear
): Record<Address, WeightedShare> {
  const poolWeights: Record<Address, bigint> = {}

  // First calculate all slashed weights
  const totalBalance = balances.reduce((acc, { balance }) => acc + balance, 0n)

  for (const { address, balance } of balances) {
    poolWeights[address] = calculateWeightByMode(
      BigInt(balance),
      totalBalance,
      balances.length,
      mode
    )
  }

  // Calculate shares using the two sets of weights
  const weightedShares: Record<Address, WeightedShare> = {}

  const totalWeight = Object.values(poolWeights).reduce((acc, w) => acc + w, 0n)

  for (const { address, userId } of balances) {
    const poolWeight = poolWeights[address] ?? 0n

    const amount = (poolWeight * timeAdjustedAmount) / totalWeight

    if (amount > 0n) {
      weightedShares[address] = {
        amount,
        userId,
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

  const t_bn = (balance * PERC_DENOM) / totalBalance
  const inv_t = PERC_DENOM - t_bn

  // Control points:
  // p0 stays at 0
  // p1 should be below 20% (like 10%) to reduce weight of bottom 20%
  // p2 should be below 80% (like 70%) to reduce weight of top 20%
  // p3 stays at PERC_DENOM
  const p0 = 0n
  const p1 = (PERC_DENOM * 7n) / 100n // reduce bottom 7% weights
  const p2 = (PERC_DENOM * 70n) / 100n // Below 80% to reduce top weights
  const p3 = PERC_DENOM

  const t2 = t_bn * t_bn
  const t3 = t2 * t_bn

  const inv_t2 = inv_t * inv_t
  const inv_t3 = inv_t2 * inv_t

  const term1 = inv_t3 * p0
  const term2 = 3n * inv_t2 * t_bn * p1
  const term3 = 3n * inv_t * t2 * p2
  const term4 = t3 * p3

  return (term1 + term2 + term3 + term4) / (PERC_DENOM * PERC_DENOM * PERC_DENOM)
}
