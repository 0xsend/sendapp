import { createPublicClient, createWalletClient, http, erc20Abi } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { base } from 'viem/chains'
import type {
  RevenueConfig,
  VaultBalances,
  SweepResult,
  SweepRecord,
  RevenueError,
  SkippedVault,
  HarvestResult,
  TransactionRecord,
  VaultRevenue,
  FeeRecipientInfo,
  FeeDistributionResult,
  FeeDistributionRecord,
  SkippedFeeRecipient,
  FeeDistributionError,
  FeeDistributionDryRunResult,
  AffiliateDetails,
  VaultTVL,
  TVLResult,
  UnderlyingVaultType,
} from './types'
import { REVENUE_ADDRESSES } from './types'
import { buildClaimArrays } from './merkl'

/**
 * SendEarn ABI subset for collections() and collect() functions.
 */
const sendEarnAbi = [
  {
    type: 'function',
    name: 'collections',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'collect',
    inputs: [{ name: 'token', type: 'address' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
] as const

/**
 * Merkl Distributor ABI subset for claim() function.
 */
const merklDistributorAbi = [
  {
    type: 'function',
    name: 'claim',
    inputs: [
      { name: 'users', type: 'address[]' },
      { name: 'tokens', type: 'address[]' },
      { name: 'amounts', type: 'uint256[]' },
      { name: 'proofs', type: 'bytes32[][]' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
] as const

/**
 * SendEarn ABI subset for feeRecipient().
 */
const sendEarnFeeAbi = [
  {
    type: 'function',
    name: 'feeRecipient',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
  },
] as const

/**
 * ERC4626 ABI subset for maxRedeem(), totalAssets(), and totalSupply().
 */
const erc4626Abi = [
  {
    type: 'function',
    name: 'maxRedeem',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'totalAssets',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'totalSupply',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
] as const

/**
 * SendEarn ABI subset for VAULT() getter (underlying vault address).
 */
const sendEarnVaultAbi = [
  {
    type: 'function',
    name: 'VAULT',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
  },
] as const

/**
 * MetaMorpho ABI subset for detecting Morpho vaults.
 * MetaMorpho vaults have a `MORPHO()` function that returns the Morpho contract address.
 */
const metaMorphoAbi = [
  {
    type: 'function',
    name: 'MORPHO',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
  },
] as const

/**
 * SendEarnAffiliate ABI subset for querying state and calling pay().
 */
const sendEarnAffiliateAbi = [
  {
    type: 'function',
    name: 'affiliate',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'platformVault',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'payVault',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'splitConfig',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'pay',
    inputs: [{ name: 'vault', type: 'address' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
] as const

/**
 * IPartnerSplitConfig ABI subset for platform().
 */
const splitConfigAbi = [
  {
    type: 'function',
    name: 'platform',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
  },
] as const

/**
 * Internal: Create a public client for reading from the chain.
 */
function createReadClient(rpcUrl: string) {
  return createPublicClient({
    chain: base,
    transport: http(rpcUrl),
  })
}

/**
 * Internal: Create a wallet client for writing transactions.
 */
function createWriteClient(rpcUrl: string, privateKey: string) {
  const account = privateKeyToAccount(privateKey as `0x${string}`)
  const walletClient = createWalletClient({
    account,
    chain: base,
    transport: http(rpcUrl),
  })
  return { walletClient, account }
}

/**
 * Get current MORPHO and WELL balances for vaults.
 */
export async function getVaultBalances(
  config: RevenueConfig,
  vaults: `0x${string}`[]
): Promise<VaultBalances[]> {
  const client = createReadClient(config.rpcUrl)
  const results: VaultBalances[] = []

  for (const vault of vaults) {
    try {
      const [morphoBalance, wellBalance] = await Promise.all([
        client.readContract({
          address: REVENUE_ADDRESSES.MORPHO_TOKEN as `0x${string}`,
          abi: erc20Abi,
          functionName: 'balanceOf',
          args: [vault],
        }),
        client.readContract({
          address: REVENUE_ADDRESSES.WELL_TOKEN as `0x${string}`,
          abi: erc20Abi,
          functionName: 'balanceOf',
          args: [vault],
        }),
      ])

      results.push({ vault, morphoBalance, wellBalance })
    } catch (error) {
      console.warn(`Failed to fetch balances for vault ${vault}:`, error)
      results.push({ vault, morphoBalance: 0n, wellBalance: 0n })
    }
  }

  return results
}

/**
 * Execute harvest transactions (Merkl.claim).
 * FAIL FAST: If batch claim fails (e.g., stale proofs), abort the entire batch.
 * User must re-run with fresh proofs to complete remaining vaults.
 */
export async function executeHarvest(
  config: RevenueConfig,
  vaultRevenue: VaultRevenue[]
): Promise<HarvestResult> {
  if (!config.collectorPrivateKey) {
    throw new Error('REVENUE_COLLECTOR_PRIVATE_KEY not configured')
  }

  const transactions: TransactionRecord[] = []

  const batchClaim = buildClaimArrays(vaultRevenue)

  if (batchClaim.users.length === 0) {
    return { harvested: { morpho: 0n, well: 0n }, transactions: [], errors: [] }
  }

  const client = createReadClient(config.rpcUrl)
  const { walletClient, account } = createWriteClient(config.rpcUrl, config.collectorPrivateKey)

  console.log(`Executing harvest for ${batchClaim.users.length} claims from ${account.address}`)

  // Helper to get block timestamp
  async function getBlockTimestamp(blockNumber: bigint): Promise<bigint> {
    const block = await client.getBlock({ blockNumber })
    return block.timestamp
  }

  // Helper to record harvests
  async function recordHarvests(
    harvestsToRecord: VaultRevenue[],
    txHash: `0x${string}`,
    blockNumber: bigint
  ): Promise<void> {
    const blockTime = await getBlockTimestamp(blockNumber)

    for (const revenue of harvestsToRecord) {
      if (revenue.morphoAmount > 0n) {
        transactions.push({
          vault: revenue.vault,
          token: REVENUE_ADDRESSES.MORPHO_TOKEN as `0x${string}`,
          amount: revenue.morphoAmount,
          txHash,
          blockNum: blockNumber,
          blockTime,
        })
      }
      if (revenue.wellAmount > 0n) {
        transactions.push({
          vault: revenue.vault,
          token: REVENUE_ADDRESSES.WELL_TOKEN as `0x${string}`,
          amount: revenue.wellAmount,
          txHash,
          blockNum: blockNumber,
          blockTime,
        })
      }
    }
  }

  // Execute batch harvest - fail fast on any error (e.g., stale proofs)
  const txHash = await walletClient.writeContract({
    address: REVENUE_ADDRESSES.MERKL_DISTRIBUTOR as `0x${string}`,
    abi: merklDistributorAbi,
    functionName: 'claim',
    args: [batchClaim.users, batchClaim.tokens, batchClaim.amounts, batchClaim.proofs],
  })

  console.log(`Batch harvest tx submitted: ${txHash}`)

  const receipt = await client.waitForTransactionReceipt({ hash: txHash })

  if (receipt.status !== 'success') {
    // Transaction reverted - fail fast with error
    throw new Error(
      `Harvest batch reverted (tx: ${txHash}). Proofs may be stale. Re-run with fresh proofs.`
    )
  }

  await recordHarvests(vaultRevenue, txHash, receipt.blockNumber)
  console.log(`Batch harvest successful: ${transactions.length} harvests`)

  const morphoTotal = transactions
    .filter((t) => t.token.toLowerCase() === REVENUE_ADDRESSES.MORPHO_TOKEN.toLowerCase())
    .reduce((sum, t) => sum + t.amount, 0n)
  const wellTotal = transactions
    .filter((t) => t.token.toLowerCase() === REVENUE_ADDRESSES.WELL_TOKEN.toLowerCase())
    .reduce((sum, t) => sum + t.amount, 0n)

  return {
    harvested: { morpho: morphoTotal, well: wellTotal },
    transactions,
    errors: [],
  }
}

/**
 * Sweep tokens from vaults to revenue safe via SendEarn.collect().
 * CRITICAL: Reads FRESH balances internally - do not pass pre-harvest balances.
 */
export async function executeSweep(
  config: RevenueConfig,
  vaults: `0x${string}`[]
): Promise<SweepResult> {
  if (!config.collectorPrivateKey) {
    throw new Error('REVENUE_COLLECTOR_PRIVATE_KEY not configured')
  }

  const transactions: SweepRecord[] = []
  const errors: RevenueError[] = []
  const skipped: SkippedVault[] = []

  const client = createReadClient(config.rpcUrl)
  const { walletClient, account } = createWriteClient(config.rpcUrl, config.collectorPrivateKey)
  const revenueSafe = REVENUE_ADDRESSES.REVENUE_SAFE

  const tokens = [
    REVENUE_ADDRESSES.MORPHO_TOKEN as `0x${string}`,
    REVENUE_ADDRESSES.WELL_TOKEN as `0x${string}`,
  ]

  console.log(`Sweeping ${vaults.length} vaults to ${revenueSafe} from ${account.address}`)

  for (const vault of vaults) {
    // Safety check: Verify collections address matches revenue safe
    try {
      const collections = await client.readContract({
        address: vault,
        abi: sendEarnAbi,
        functionName: 'collections',
      })

      if (collections.toLowerCase() !== revenueSafe.toLowerCase()) {
        const reason = `Collections mismatch: ${collections} !== ${revenueSafe}`
        skipped.push({ vault, reason })
        errors.push({ vault, step: 'sweep', error: reason })
        console.warn(`Skipping vault ${vault}: ${reason}`)
        continue
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      errors.push({ vault, step: 'sweep', error: `Failed to read collections: ${errorMessage}` })
      console.error(`Failed to read collections for ${vault}: ${errorMessage}`)
      continue
    }

    for (const token of tokens) {
      // Read FRESH balance
      let balance: bigint
      try {
        balance = await client.readContract({
          address: token,
          abi: erc20Abi,
          functionName: 'balanceOf',
          args: [vault],
        })
      } catch (error) {
        console.warn(`Failed to read balance for ${vault}/${token}`)
        continue
      }

      if (balance === 0n) {
        continue
      }

      try {
        const txHash = await walletClient.writeContract({
          address: vault,
          abi: sendEarnAbi,
          functionName: 'collect',
          args: [token],
        })

        console.log(`Sweep tx for ${vault}/${token}: ${txHash}`)

        const receipt = await client.waitForTransactionReceipt({ hash: txHash })

        if (receipt.status === 'success') {
          const block = await client.getBlock({ blockNumber: receipt.blockNumber })
          transactions.push({
            vault,
            token,
            amount: balance,
            destination: revenueSafe as `0x${string}`,
            txHash: receipt.transactionHash,
            blockNum: receipt.blockNumber,
            blockTime: block.timestamp,
          })
          console.log(`Sweep successful for ${vault}/${token}: ${balance.toString()}`)
        } else {
          errors.push({ vault, step: 'sweep', error: `Transaction reverted for token ${token}` })
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        errors.push({ vault, step: 'sweep', error: `${token}: ${errorMessage}` })
        console.error(`Sweep failed for ${vault}/${token}: ${errorMessage}`)
      }
    }
  }

  const morphoTotal = transactions
    .filter((t) => t.token.toLowerCase() === REVENUE_ADDRESSES.MORPHO_TOKEN.toLowerCase())
    .reduce((sum, t) => sum + t.amount, 0n)
  const wellTotal = transactions
    .filter((t) => t.token.toLowerCase() === REVENUE_ADDRESSES.WELL_TOKEN.toLowerCase())
    .reduce((sum, t) => sum + t.amount, 0n)

  return {
    swept: { morpho: morphoTotal, well: wellTotal },
    transactions,
    skipped,
    errors,
  }
}

/**
 * Check if an address is a contract (has code).
 */
async function isContract(
  client: ReturnType<typeof createReadClient>,
  address: `0x${string}`
): Promise<boolean> {
  const code = await client.getCode({ address })
  return code !== undefined && code !== '0x'
}

/**
 * Try to read affiliate contract details. Returns undefined if not a valid affiliate contract.
 */
async function tryGetAffiliateDetails(
  client: ReturnType<typeof createReadClient>,
  feeRecipient: `0x${string}`
): Promise<AffiliateDetails | undefined> {
  try {
    const [affiliate, platformVault, payVault, splitConfig] = await Promise.all([
      client.readContract({
        address: feeRecipient,
        abi: sendEarnAffiliateAbi,
        functionName: 'affiliate',
      }),
      client.readContract({
        address: feeRecipient,
        abi: sendEarnAffiliateAbi,
        functionName: 'platformVault',
      }),
      client.readContract({
        address: feeRecipient,
        abi: sendEarnAffiliateAbi,
        functionName: 'payVault',
      }),
      client.readContract({
        address: feeRecipient,
        abi: sendEarnAffiliateAbi,
        functionName: 'splitConfig',
      }),
    ])

    // Get platform address from split config
    const platform = await client.readContract({
      address: splitConfig,
      abi: splitConfigAbi,
      functionName: 'platform',
    })

    return {
      affiliate: affiliate as `0x${string}`,
      platformVault: platformVault as `0x${string}`,
      payVault: payVault as `0x${string}`,
      platform: platform as `0x${string}`,
    }
  } catch {
    // Not a valid affiliate contract
    return undefined
  }
}

/**
 * Get fee recipient info for vaults.
 * Identifies whether each vault's feeRecipient is an affiliate contract or direct recipient.
 */
export async function getFeeRecipientInfo(
  config: RevenueConfig,
  vaults: `0x${string}`[]
): Promise<FeeRecipientInfo[]> {
  const client = createReadClient(config.rpcUrl)
  const results: FeeRecipientInfo[] = []
  const revenueSafe = REVENUE_ADDRESSES.REVENUE_SAFE.toLowerCase()

  for (const vault of vaults) {
    try {
      // Get fee recipient address
      const feeRecipient = await client.readContract({
        address: vault,
        abi: sendEarnFeeAbi,
        functionName: 'feeRecipient',
      })

      // Get redeemable shares (how many vault shares the fee recipient holds)
      const redeemableShares = await client.readContract({
        address: vault,
        abi: erc4626Abi,
        functionName: 'maxRedeem',
        args: [feeRecipient],
      })

      // Determine if affiliate contract or direct recipient
      // Per spec: non-Revenue Safe contracts are affiliates; Revenue Safe or EOAs are direct
      if (feeRecipient.toLowerCase() === revenueSafe) {
        // Direct to Revenue Safe
        results.push({
          vault,
          feeRecipient: feeRecipient as `0x${string}`,
          type: 'direct',
          redeemableShares,
        })
      } else if (await isContract(client, feeRecipient as `0x${string}`)) {
        // Non-Revenue Safe contract = affiliate (per spec)
        // Affiliate details are optional metadata - failure to read them doesn't change classification
        const affiliateDetails = await tryGetAffiliateDetails(client, feeRecipient as `0x${string}`)
        if (!affiliateDetails) {
          console.warn(
            `Could not read affiliate details for ${feeRecipient} (vault ${vault}); treating as affiliate without metadata`
          )
        }
        results.push({
          vault,
          feeRecipient: feeRecipient as `0x${string}`,
          type: 'affiliate',
          redeemableShares,
          affiliateDetails, // May be undefined if metadata read failed
        })
      } else {
        // EOA - treat as direct
        results.push({
          vault,
          feeRecipient: feeRecipient as `0x${string}`,
          type: 'direct',
          redeemableShares,
        })
      }
    } catch (error) {
      console.warn(`Failed to get fee recipient for vault ${vault}:`, error)
    }
  }

  return results
}

/**
 * Get fee distribution dry run data.
 * Shows pending fee shares for affiliate contracts and direct recipients.
 */
export async function getFeeDistributionDryRun(
  config: RevenueConfig,
  vaults: `0x${string}`[]
): Promise<FeeDistributionDryRunResult> {
  const feeRecipients = await getFeeRecipientInfo(config, vaults)

  const affiliates = feeRecipients.filter((r) => r.type === 'affiliate')
  const directRecipients = feeRecipients.filter((r) => r.type === 'direct')

  const affiliateShares = affiliates.reduce((sum, r) => sum + r.redeemableShares, 0n)
  const directShares = directRecipients.reduce((sum, r) => sum + r.redeemableShares, 0n)

  return {
    affiliates,
    directRecipients,
    totals: {
      affiliateShares,
      directShares,
    },
  }
}

/**
 * Execute fee distribution by calling pay() on affiliate contracts.
 * Only distributes for affiliate-type fee recipients with redeemable shares > 0.
 */
export async function executeFeeDistribution(
  config: RevenueConfig,
  vaults: `0x${string}`[]
): Promise<FeeDistributionResult> {
  if (!config.collectorPrivateKey) {
    throw new Error('REVENUE_COLLECTOR_PRIVATE_KEY not configured')
  }

  const transactions: FeeDistributionRecord[] = []
  const skipped: SkippedFeeRecipient[] = []
  const errors: FeeDistributionError[] = []

  const client = createReadClient(config.rpcUrl)
  const { walletClient, account } = createWriteClient(config.rpcUrl, config.collectorPrivateKey)

  // Get fee recipient info for all vaults
  const feeRecipients = await getFeeRecipientInfo(config, vaults)

  console.log(`Processing ${feeRecipients.length} vault fee recipients from ${account.address}`)

  for (const recipient of feeRecipients) {
    // Skip direct recipients (not automatable)
    if (recipient.type === 'direct') {
      skipped.push({
        vault: recipient.vault,
        feeRecipient: recipient.feeRecipient,
        reason: 'Direct recipient (not an affiliate contract)',
      })
      continue
    }

    // Skip if no shares to distribute
    if (recipient.redeemableShares === 0n) {
      skipped.push({
        vault: recipient.vault,
        feeRecipient: recipient.feeRecipient,
        reason: 'No redeemable shares',
      })
      continue
    }

    const affiliateContract = recipient.feeRecipient

    try {
      console.log(
        `Distributing fees for vault ${recipient.vault}: ${recipient.redeemableShares.toString()} shares`
      )

      const txHash = await walletClient.writeContract({
        address: affiliateContract,
        abi: sendEarnAffiliateAbi,
        functionName: 'pay',
        args: [recipient.vault],
      })

      console.log(`Fee distribution tx: ${txHash}`)

      const receipt = await client.waitForTransactionReceipt({ hash: txHash })

      if (receipt.status === 'success') {
        const block = await client.getBlock({ blockNumber: receipt.blockNumber })

        transactions.push({
          vault: recipient.vault,
          affiliateContract,
          sharesRedeemed: recipient.redeemableShares,
          txHash: receipt.transactionHash,
          blockNum: receipt.blockNumber,
          blockTime: block.timestamp,
        })

        console.log(`Fee distribution successful for vault ${recipient.vault}`)
      } else {
        errors.push({
          vault: recipient.vault,
          affiliateContract,
          error: 'Transaction reverted',
        })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      errors.push({
        vault: recipient.vault,
        affiliateContract,
        error: errorMessage,
      })
      console.error(`Fee distribution failed for vault ${recipient.vault}: ${errorMessage}`)
    }
  }

  // Calculate totals
  const totalShares = transactions.reduce((sum, t) => sum + t.sharesRedeemed, 0n)

  return {
    distributed: {
      totalShares,
      vaultCount: transactions.length,
    },
    transactions,
    skipped,
    errors,
  }
}

/**
 * Detect the underlying vault type (Morpho or Moonwell).
 * MetaMorpho vaults have a MORPHO() function, Moonwell vaults don't.
 */
async function detectVaultType(
  client: ReturnType<typeof createReadClient>,
  underlyingVault: `0x${string}`
): Promise<UnderlyingVaultType> {
  try {
    // MetaMorpho vaults have a MORPHO() function
    await client.readContract({
      address: underlyingVault,
      abi: metaMorphoAbi,
      functionName: 'MORPHO',
    })
    return 'Morpho'
  } catch {
    // If MORPHO() doesn't exist, assume Moonwell
    // (Moonwell vaults don't have this function)
    return 'Moonwell'
  }
}

/**
 * Get TVL (Total Value Locked) for all Send Earn vaults.
 * Calls vault.totalAssets() to get the total USDC deposited.
 */
export async function getVaultsTVL(
  config: RevenueConfig,
  vaults: `0x${string}`[]
): Promise<TVLResult> {
  const client = createReadClient(config.rpcUrl)
  const results: VaultTVL[] = []

  for (const vault of vaults) {
    try {
      const [totalAssets, totalSupply, underlyingVault] = await Promise.all([
        client.readContract({
          address: vault,
          abi: erc4626Abi,
          functionName: 'totalAssets',
        }),
        client.readContract({
          address: vault,
          abi: erc4626Abi,
          functionName: 'totalSupply',
        }),
        client.readContract({
          address: vault,
          abi: sendEarnVaultAbi,
          functionName: 'VAULT',
        }),
      ])

      // Detect the underlying vault type
      const vaultType = await detectVaultType(client, underlyingVault as `0x${string}`)

      results.push({
        vault,
        totalAssets,
        totalSupply,
        underlyingVault: underlyingVault as `0x${string}`,
        vaultType,
      })
    } catch (error) {
      console.warn(`Failed to fetch TVL for vault ${vault}:`, error)
    }
  }

  return {
    vaults: results,
    totals: {
      totalAssets: results.reduce((sum, v) => sum + v.totalAssets, 0n),
      vaultCount: results.length,
    },
  }
}
