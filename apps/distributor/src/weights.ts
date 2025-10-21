import type { Address } from 'viem'

type WeightedShare = { address: `0x${string}`; amount: bigint; userId: string }

export enum Mode {
  Linear = 'linear',
  Logarithmic = 'logarithmic',
  SquareRoot = 'square_root',
  Exponential = 'exponential',
  EaseInOut = 'ease_in_out',
  Sigmoid = 'sigmoid',
}

// Configuration for EaseInOut curve dampening
const EASE_IN_OUT_CONFIG = {
  // Control points for cubic Bezier curve that dampens bottom and top holders
  // Classic ease-in-out curve for strong dampening at both ends
  bottomDampeningControl: 10, // % - Very slow start (dampens bottom 20%)
  topDampeningControl: 90, // % - Very slow end (dampens top 20%)
} as const

// Configuration for Sigmoid curve
const SIGMOID_CONFIG = {
  // Steepness factor - higher values create steeper middle section
  steepness: 12, // Controls how steep the middle transition is
  // Center point - where the steepest part of the curve occurs
  center: 0.5, // Middle of the steep transition range (11% to 89%)
} as const

export const PERC_DENOM = 1000000000000000000n

export function calculatePercentageWithBips(value: bigint, bips: bigint) {
  const bps = bips * PERC_DENOM
  const percentage = value * (bps / PERC_DENOM)
  return percentage / PERC_DENOM
}

/**
 * Creates groups of identical balances and maps each balance to its rank.
 * Balances are assumed to be sorted by balance in descending order (highest first).
 *
 * @param balances Array of balances sorted by balance (18 decimal bigints)
 * @returns Object containing balance groups and rank mapping
 */
function createBalanceGroupsAndRanks(
  balances: readonly {
    address: `0x${string}`
    userId: string
    balance: bigint
  }[]
): {
  balanceGroups: bigint[][]
  rankMap: Map<bigint, number>
} {
  if (balances.length === 0) {
    return { balanceGroups: [], rankMap: new Map() }
  }

  // Group balances by their formatted value (non-18 decimal)
  const balanceGroups: bigint[][] = []
  const rankMap = new Map<bigint, number>()

  let currentGroup: bigint[] = []
  let currentBalance = balances[0]?.balance

  if (!currentBalance) {
    return { balanceGroups: [], rankMap: new Map() }
  }

  for (const { balance } of balances) {
    if (balance === currentBalance) {
      // Same balance, add to current group
      currentGroup.push(balance)
    } else {
      // Different balance, start new group
      if (currentGroup.length > 0) {
        balanceGroups.push([...currentGroup])
      }
      currentGroup = [balance]
      currentBalance = balance
    }
  }

  // Add the last group
  if (currentGroup.length > 0) {
    balanceGroups.push(currentGroup)
  }

  // Create rank mapping - each unique balance gets the index of its group as its rank
  for (let i = 0; i < balanceGroups.length; i++) {
    const group = balanceGroups[i]
    if (group && group.length > 0) {
      const groupBalance = group[0]
      if (groupBalance !== undefined) {
        rankMap.set(groupBalance, i)
      }
    }
  }

  return { balanceGroups, rankMap }
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

  if (mode === Mode.EaseInOut || mode === Mode.Sigmoid) {
    // Create proper ranking based on grouped identical balances
    const { balanceGroups, rankMap } = createBalanceGroupsAndRanks(balances)
    const n = balanceGroups.length

    for (const { address, balance } of balances) {
      const rank = rankMap.get(balance) ?? 0
      let rankNormalized = 0n
      if (n > 1) {
        // Normalize rank to 0-1 range: rank / (n-1)
        rankNormalized = (BigInt(rank) * PERC_DENOM) / BigInt(n - 1)
      }
      poolWeights[address] = calculateWeightByMode(balance, totalBalance, n, mode, rankNormalized)
    }
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

  // Guard: if totalWeight is zero, fall back to equal split to avoid division by zero
  if (totalWeight === 0n) {
    const n = BigInt(balances.length)
    if (n === 0n) return {}
    const base = timeAdjustedAmount / n
    let remainder = timeAdjustedAmount - base * n
    for (const { address, userId } of balances) {
      let amount = base
      if (remainder > 0n) {
        amount += 1n
        remainder -= 1n
      }
      if (amount > 0n) {
        weightedShares[address] = { address, userId, amount }
      }
    }
    handleRoundingErrors(weightedShares, timeAdjustedAmount)
    return weightedShares
  }

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

// Helper function to handle rounding errors (both over- and under-allocation)
function handleRoundingErrors(shares: Record<string, WeightedShare>, targetAmount: bigint) {
  let totalDistributed = 0n
  for (const share of Object.values(shares)) {
    totalDistributed += share.amount
  }

  if (totalDistributed === targetAmount || Object.keys(shares).length === 0) return

  const difference = targetAmount - totalDistributed // may be positive or negative
  const allShares = Object.values(shares)

  if (allShares.length === 0) return

  let idxOfLargest = 0
  for (let i = 1; i < allShares.length; i++) {
    const currentShare = allShares[i]
    const largestShare = allShares[idxOfLargest]
    if (currentShare && largestShare && currentShare.amount > largestShare.amount) {
      idxOfLargest = i
    }
  }

  const targetShare = allShares[idxOfLargest]
  if (targetShare) {
    targetShare.amount += difference
    if (targetShare.amount < 0n) targetShare.amount = 0n
  }
}

function calculateWeightByMode(
  balance: bigint,
  totalBalance: bigint,
  numBalances: number,
  mode: Mode,
  rankNormalized = 0n
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
      return calculateCubicBezierWeight(balance, rankNormalized, numBalances)
    case Mode.Sigmoid:
      return calculateSigmoidWeight(balance, rankNormalized, numBalances)
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
 * @param rankNormalized The holder's rank normalized to 0-1 range (scaled by 1e18)
 * @param totalHolders Total number of holders (unused in new implementation)
 * @returns The weighted balance after applying the curve multiplier
 */
function calculateCubicBezierWeight(
  balance: bigint,
  rankNormalized: bigint,
  totalHolders: number
): bigint {
  if (totalHolders === 0) {
    return 0n
  }

  // Use normalized rank directly (already 1e18-scaled, range 0-1)
  let t_bn = rankNormalized
  if (t_bn < 0n) t_bn = 0n
  if (t_bn > PERC_DENOM) t_bn = PERC_DENOM
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

/**
 * Calculates weight using a sigmoid curve based on holder rank, using fixed-point BigInt math.
 * S-curve: flatter tails, steeper middle.
 * The sigmoid function outputs values between 0 and 1, which are then applied as multipliers to balances.
 *
 * @param balance The holder's actual balance
 * @param rankNormalized The holder's rank normalized to 0-1 range (scaled by 1e18)
 * @param totalHolders Total number of holders (unused in new implementation)
 * @returns The weighted balance after applying the sigmoid multiplier
 */
function calculateSigmoidWeight(
  balance: bigint,
  rankNormalized: bigint,
  totalHolders: number
): bigint {
  if (totalHolders === 0) {
    return 0n
  }

  // y = -steepness * (x - center) ; all values scaled by PERC_DENOM
  const centerScaled = (PERC_DENOM * BigInt(Math.round(SIGMOID_CONFIG.center * 100))) / 100n // 0.5 * 1e18
  const diff = rankNormalized - centerScaled
  const yScaled = -1n * BigInt(SIGMOID_CONFIG.steepness) * diff

  // exp(yScaled/ONE) with fixed-point BigInt using range reduction and series
  function expFixed(yScaled: bigint): bigint {
    const ONE = PERC_DENOM
    const N = 8n // range reduction factor
    const yReduced = yScaled / N // still scaled by ONE

    // Series approximation for e^(z) where z = yReduced/ONE
    const z = yReduced
    const z2 = (z * z) / ONE
    const z3 = (z2 * z) / ONE
    const z4 = (z3 * z) / ONE
    const z5 = (z4 * z) / ONE

    const term1 = z
    const term2 = z2 / 2n
    const term3 = z3 / 6n
    const term4 = z4 / 24n
    const term5 = z5 / 120n

    const base = ONE + term1 + term2 + term3 + term4 + term5

    // Raise to the Nth power to approximate e^{yScaled/ONE}
    let result = ONE
    for (let i = 0n; i < N; i++) {
      result = (result * base) / ONE
    }
    return result
  }

  const eTerm = expFixed(yScaled)
  const sigmoidScaled = (PERC_DENOM * PERC_DENOM) / (PERC_DENOM + eTerm)

  // Ensure sigmoid output is between 0 and PERC_DENOM (0 and 1)
  const clampedSigmoid =
    sigmoidScaled < 0n ? 0n : sigmoidScaled > PERC_DENOM ? PERC_DENOM : sigmoidScaled

  return (balance * clampedSigmoid) / PERC_DENOM
}
