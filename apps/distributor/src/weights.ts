import type { Address } from 'viem'

type WeightedShare = { address: `0x${string}`; amount: bigint; userId: string }

export enum Mode {
  Linear = 'linear',
  Logarithmic = 'logarithmic',
  SquareRoot = 'square_root',
  Exponential = 'exponential',
  EaseInOut = 'ease_in_out',
}

// Configuration for EaseInOut curve dampening
const EASE_IN_OUT_CONFIG = {
  // Control points for cubic Bezier curve that dampens bottom and top holders
  // Classic ease-in-out curve for strong dampening at both ends
  bottomDampeningControl: 10, // % - Very slow start (dampens bottom 20%)
  topDampeningControl: 90, // % - Very slow end (dampens top 20%)
} as const

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
  const totalBalance = balances.reduce((acc, { balance }) => acc + balance, 0n)

  if (mode === Mode.EaseInOut) {
    // For EaseInOut mode, sort by balance and use index as rank
    const sortedBalances = [...balances].sort((a, b) => Number(a.balance - b.balance))
    sortedBalances.forEach((item, index) => {
      poolWeights[item.address] = calculateWeightByMode(
        item.balance,
        totalBalance,
        balances.length,
        mode,
        index // rank is just the index
      )
    })
  } else {
    // For other modes, rank doesn't matter
    for (const { address, balance } of balances) {
      poolWeights[address] = calculateWeightByMode(balance, totalBalance, balances.length, mode)
    }
  }

  // Calculate total weight
  const totalWeight = Object.values(poolWeights).reduce((acc, weight) => acc + weight, 0n)

  // Create weighted shares
  const weightedShares: Record<Address, WeightedShare> = {}

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
  mode: Mode,
  rank = 0
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
      return calculateCubicBezierWeight(balance, rank, numBalances)
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

/**
 * Calculates weight using a cubic Bezier curve based on holder rank.
 * Creates an S-curve that dampens weights for holders at both extremes:
 * - Bottom ~20% of holders (by balance) get reduced weights
 * - Top ~20% of holders (by balance) get reduced weights
 * - Middle ~60% of holders get enhanced weights
 *
 * @param balance The holder's actual balance
 * @param rank The holder's rank (0 = smallest balance, N-1 = largest balance)
 * @param totalHolders Total number of holders
 * @returns The weighted balance after applying the curve multiplier
 */
function calculateCubicBezierWeight(balance: bigint, rank: number, totalHolders: number): bigint {
  if (totalHolders === 0) {
    return 0n
  }

  // Normalize rank to [0, 1] range
  const t_bn = (BigInt(rank) * PERC_DENOM) / BigInt(totalHolders - 1)
  const inv_t = PERC_DENOM - t_bn

  // Cubic Bezier control points: P0(0,0), P1, P2, P3(1,1)
  // P1 and P2 control the curve shape to create dampening at extremes
  const p0 = 0n
  const p1 = (PERC_DENOM * BigInt(EASE_IN_OUT_CONFIG.bottomDampeningControl)) / 100n
  const p2 = (PERC_DENOM * BigInt(EASE_IN_OUT_CONFIG.topDampeningControl)) / 100n
  const p3 = PERC_DENOM

  // Calculate cubic Bezier curve: (1-t)³P0 + 3(1-t)²tP1 + 3(1-t)t²P2 + t³P3
  const t2 = t_bn * t_bn
  const t3 = t2 * t_bn
  const inv_t2 = inv_t * inv_t
  const inv_t3 = inv_t2 * inv_t

  const term1 = inv_t3 * p0
  const term2 = 3n * inv_t2 * t_bn * p1
  const term3 = 3n * inv_t * t2 * p2
  const term4 = t3 * p3

  const curveMultiplier = (term1 + term2 + term3 + term4) / (PERC_DENOM * PERC_DENOM * PERC_DENOM)

  // Apply the curve multiplier to the actual balance
  return (balance * curveMultiplier) / PERC_DENOM
}
