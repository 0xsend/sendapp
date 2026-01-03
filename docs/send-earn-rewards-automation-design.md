# Send Earn Rewards Automation Design

Design document for SEND-172: Claim Morpho and Moonwell Rewards

## Overview

Automate the claiming of MORPHO and WELL token rewards for Send Earn vaults. Both reward types are distributed through the Merkl system and can be claimed in a single transaction.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         Rewards Automation                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────────────┐    │
│  │   Scheduler  │────▶│   Temporal   │────▶│  Claim Rewards       │    │
│  │  (Cron/API)  │     │   Workflow   │     │  Activities          │    │
│  └──────────────┘     └──────────────┘     └──────────────────────┘    │
│                              │                        │                  │
│                              ▼                        ▼                  │
│                       ┌──────────────┐     ┌──────────────────────┐    │
│                       │   Database   │     │   Merkl API          │    │
│                       │   Tracking   │     │   + Distributor      │    │
│                       └──────────────┘     └──────────────────────┘    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

## Components

### 1. Database Schema

New table to track reward claims:

```sql
-- Table: send_earn_reward_claims
CREATE TABLE IF NOT EXISTS "public"."send_earn_reward_claims" (
    "id" bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    "vault" bytea NOT NULL,                    -- SendEarn vault address
    "token" bytea NOT NULL,                    -- Reward token (MORPHO or WELL)
    "amount" numeric NOT NULL,                 -- Amount claimed
    "tx_hash" bytea NOT NULL,                  -- Transaction hash
    "block_num" numeric NOT NULL,
    "block_time" numeric NOT NULL,
    "created_at" timestamptz DEFAULT now()
);

CREATE INDEX idx_reward_claims_vault ON send_earn_reward_claims(vault);
CREATE INDEX idx_reward_claims_token ON send_earn_reward_claims(token);
CREATE INDEX idx_reward_claims_block_time ON send_earn_reward_claims(block_time);
CREATE UNIQUE INDEX u_reward_claims ON send_earn_reward_claims(vault, token, tx_hash);
```

### 2. Temporal Workflow

New workflow: `rewards-claim-workflow`

```typescript
// packages/workflows/src/rewards-claim-workflow/workflow.ts

import { proxyActivities } from '@temporalio/workflow'
import type { RewardsClaimActivities } from './activities'

// Read-only activities can be retried safely
const readActivities = proxyActivities<Pick<RewardsClaimActivities,
  'getActiveVaultsActivity' | 'fetchClaimableRewardsActivity'
>>({
  startToCloseTimeout: '5 minutes',
  retry: {
    maximumAttempts: 3,
    initialInterval: '10 seconds',
    backoffCoefficient: 2,
  },
})

// Non-idempotent activities: no automatic retries to prevent duplicate transactions
const writeActivities = proxyActivities<Pick<RewardsClaimActivities,
  'executeClaimActivity' | 'recordClaimsActivity'
>>({
  startToCloseTimeout: '10 minutes',
  retry: {
    maximumAttempts: 1,  // No retries - claims are non-idempotent
  },
})

export interface RewardsClaimWorkflowInput {
  vaultAddresses?: `0x${string}`[]  // Optional: specific vaults, or all if empty
  dryRun?: boolean                   // If true, only check rewards without claiming
}

export interface RewardsClaimWorkflowResult {
  vaultsProcessed: number
  totalClaimed: {
    morpho: bigint
    well: bigint
  }
  transactions: `0x${string}`[]
  errors: { vault: string; error: string }[]
}

export async function rewardsClaimWorkflow(
  input: RewardsClaimWorkflowInput
): Promise<RewardsClaimWorkflowResult> {
  // 1. Get list of vaults to process
  const vaults = input.vaultAddresses ?? await readActivities.getActiveVaultsActivity()

  // 2. Fetch claimable rewards from Merkl API for all vaults
  const rewardsData = await readActivities.fetchClaimableRewardsActivity({ vaults })

  // 3. Filter vaults with rewards above configured thresholds
  // hasClaimableRewards is set by fetchClaimableRewardsActivity based on min thresholds
  const claimableVaults = rewardsData.filter(r => r.hasClaimableRewards)

  if (claimableVaults.length === 0) {
    return {
      vaultsProcessed: vaults.length,
      totalClaimed: { morpho: 0n, well: 0n },
      transactions: [],
      errors: [],
    }
  }

  if (input.dryRun) {
    return {
      vaultsProcessed: vaults.length,
      totalClaimed: {
        morpho: claimableVaults.reduce((sum, v) => sum + v.morphoAmount, 0n),
        well: claimableVaults.reduce((sum, v) => sum + v.wellAmount, 0n),
      },
      transactions: [],
      errors: [],
    }
  }

  // 4. Execute claim transactions with fallback to individual claims on failure
  const claimResult = await writeActivities.executeClaimActivity({
    claims: claimableVaults,
  })

  // 5. Record successful claims in database (each claim has its own tx metadata)
  if (claimResult.successful.length > 0) {
    await writeActivities.recordClaimsActivity({
      claims: claimResult.successful,
    })
  }

  return {
    vaultsProcessed: vaults.length,
    totalClaimed: claimResult.totals,
    transactions: claimResult.transactions,
    errors: claimResult.errors,
  }
}
```

### 3. Activities

```typescript
// packages/workflows/src/rewards-claim-workflow/activities.ts

export interface RewardsClaimActivities {
  getActiveVaultsActivity: () => Promise<`0x${string}`[]>
  fetchClaimableRewardsActivity: (params: {
    vaults: `0x${string}`[]
  }) => Promise<VaultRewards[]>
  executeClaimActivity: (params: {
    claims: VaultRewards[]
  }) => Promise<ClaimResult>
  recordClaimsActivity: (params: {
    claims: ClaimRecord[]  // Each claim has its own tx metadata
  }) => Promise<void>
}

interface VaultRewards {
  vault: `0x${string}`
  morphoAmount: bigint
  wellAmount: bigint
  morphoProof: `0x${string}`[]
  wellProof: `0x${string}`[]
  hasClaimableRewards: boolean  // True only if amounts exceed configured thresholds
}

// Each claim record includes full transaction metadata for accurate DB insertion
interface ClaimRecord {
  vault: `0x${string}`
  token: `0x${string}`  // MORPHO or WELL token address
  amount: bigint
  txHash: `0x${string}`
  blockNum: bigint
  blockTime: bigint  // Chain timestamp from block, not Date.now()
}

interface ClaimResult {
  transactions: `0x${string}`[]  // All transaction hashes (batch or individual fallbacks)
  totals: { morpho: bigint; well: bigint }
  successful: ClaimRecord[]  // Each claim with its tx metadata
  errors: { vault: string; error: string }[]
}
```

#### Activity: `getActiveVaultsActivity`

Query database for all active Send Earn vaults:

```typescript
async function getActiveVaultsActivity(): Promise<`0x${string}`[]> {
  const supabase = createSupabaseAdminClient()

  // Get unique vaults from send_earn_create
  const { data, error } = await supabase
    .from('send_earn_create')
    .select('send_earn')
    .order('block_num', { ascending: false })

  if (error) throw error

  return [...new Set(data.map(d => byteaToHex(d.send_earn)))]
}
```

#### Activity: `fetchClaimableRewardsActivity`

Fetch rewards from Merkl API with rate limiting, retry on 429, and threshold filtering:

```typescript
async function fetchClaimableRewardsActivity({
  vaults,
}: {
  vaults: `0x${string}`[]
}): Promise<VaultRewards[]> {
  const config = getRewardsConfig(process.env)
  const results: VaultRewards[] = []
  const errors: { vault: string; error: string }[] = []

  for (let i = 0; i < vaults.length; i++) {
    const vault = vaults[i]

    // Rate limiting: delay before EVERY request to respect 10 req/s limit
    if (i > 0) {
      await sleep(config.merklApiDelayMs)
    }

    let retryCount = 0
    const maxRetries = 3

    while (retryCount < maxRetries) {
      try {
        const response = await fetch(
          `https://api.merkl.xyz/v4/users/${vault}/rewards?chainId=8453`
        )

        if (response.status === 429) {
          // Rate limited - exponential backoff and retry same vault
          retryCount++
          if (retryCount >= maxRetries) {
            // Max retries exhausted on 429 - record error and move on
            errors.push({ vault, error: 'Rate limited (429) after max retries' })
            log.error('Rate limited by Merkl API, max retries exhausted', { vault, retryCount })
            break // Exit retry loop, move to next vault
          }
          const backoffMs = config.merklApiDelayMs * Math.pow(2, retryCount) * 10
          log.warn('Rate limited by Merkl API, backing off', { vault, retryCount, backoffMs })
          await sleep(backoffMs)
          continue // Retry same vault
        }

        if (!response.ok) {
          // Non-retryable error - record and move on
          errors.push({ vault, error: `HTTP ${response.status}` })
          log.warn('Failed to fetch rewards for vault', { vault, status: response.status })
          break // Exit retry loop, move to next vault
        }

        const data = await response.json()

        const morphoReward = data[REWARDS_ADDRESSES.MORPHO_TOKEN]
        const wellReward = data[REWARDS_ADDRESSES.WELL_TOKEN]

        const morphoClaimable = morphoReward
          ? BigInt(morphoReward.amount) - BigInt(morphoReward.claimed)
          : 0n
        const wellClaimable = wellReward
          ? BigInt(wellReward.amount) - BigInt(wellReward.claimed)
          : 0n

        // Apply minimum thresholds - only include amounts that exceed configured minimums
        const morphoAboveThreshold = morphoClaimable >= config.minMorphoClaim
        const wellAboveThreshold = wellClaimable >= config.minWellClaim

        results.push({
          vault,
          morphoAmount: morphoAboveThreshold ? morphoClaimable : 0n,
          wellAmount: wellAboveThreshold ? wellClaimable : 0n,
          morphoProof: morphoAboveThreshold ? (morphoReward?.proofs ?? []) : [],
          wellProof: wellAboveThreshold ? (wellReward?.proofs ?? []) : [],
          hasClaimableRewards: morphoAboveThreshold || wellAboveThreshold,
        })
        break // Success - exit retry loop

      } catch (error) {
        retryCount++
        if (retryCount >= maxRetries) {
          errors.push({ vault, error: error.message ?? 'Unknown error' })
          log.error('Failed to fetch rewards after retries', { vault, error, retryCount })
        } else {
          log.warn('Error fetching rewards, retrying', { vault, error, retryCount })
          await sleep(config.merklApiDelayMs * retryCount)
        }
      }
    }
  }

  // Log summary of any errors for monitoring
  if (errors.length > 0) {
    log.warn('Some vaults failed to fetch rewards', { errorCount: errors.length, errors })
  }

  return results
}
```

#### Activity: `executeClaimActivity`

Execute the claim transaction with fallback to individual claims on batch failure:

```typescript
async function executeClaimActivity({
  claims,
}: {
  claims: VaultRewards[]
}): Promise<ClaimResult> {
  const successful: ClaimRecord[] = []
  const errors: { vault: string; error: string }[] = []
  const transactions: `0x${string}`[] = []

  // Build arrays for batch claim
  const batchClaims = buildClaimArrays(claims)

  if (batchClaims.users.length === 0) {
    return {
      transactions: [],
      totals: { morpho: 0n, well: 0n },
      successful: [],
      errors: [],
    }
  }

  // Helper to get block timestamp from receipt
  async function getBlockTimestamp(receipt: TransactionReceipt): Promise<bigint> {
    const block = await baseMainnetClient.getBlock({ blockNumber: receipt.blockNumber })
    return block.timestamp
  }

  // Helper to record claims with tx metadata
  async function recordClaimsFromReceipt(
    claimsToRecord: VaultRewards[],
    receipt: TransactionReceipt
  ): Promise<void> {
    const blockTime = await getBlockTimestamp(receipt)

    for (const claim of claimsToRecord) {
      if (claim.morphoAmount > 0n) {
        successful.push({
          vault: claim.vault,
          token: REWARDS_ADDRESSES.MORPHO_TOKEN,
          amount: claim.morphoAmount,
          txHash: receipt.transactionHash,
          blockNum: receipt.blockNumber,
          blockTime,
        })
      }
      if (claim.wellAmount > 0n) {
        successful.push({
          vault: claim.vault,
          token: REWARDS_ADDRESSES.WELL_TOKEN,
          amount: claim.wellAmount,
          txHash: receipt.transactionHash,
          blockNum: receipt.blockNumber,
          blockTime,
        })
      }
    }
  }

  // Attempt batch claim first
  try {
    const txHash = await claimFromMerkl(batchClaims)
    const receipt = await waitForTransactionReceipt(baseMainnetClient, { hash: txHash })

    if (receipt.status === 'success') {
      transactions.push(txHash)
      await recordClaimsFromReceipt(claims, receipt)
    } else {
      throw new Error('Batch claim reverted')
    }
  } catch (batchError) {
    log.warn('Batch claim failed, falling back to individual claims', { error: batchError })

    // Fallback: try each vault individually
    for (const claim of claims) {
      const individualClaims = buildClaimArrays([claim])

      if (individualClaims.users.length === 0) continue

      try {
        const txHash = await claimFromMerkl(individualClaims)
        const receipt = await waitForTransactionReceipt(baseMainnetClient, { hash: txHash })

        if (receipt.status === 'success') {
          transactions.push(txHash)
          // Record this claim with its own tx metadata
          await recordClaimsFromReceipt([claim], receipt)
        } else {
          errors.push({ vault: claim.vault, error: 'Transaction reverted' })
        }
      } catch (error) {
        errors.push({ vault: claim.vault, error: error.message ?? 'Unknown error' })
      }
    }
  }

  return {
    transactions,
    totals: {
      morpho: successful
        .filter(s => s.token === REWARDS_ADDRESSES.MORPHO_TOKEN)
        .reduce((sum, s) => sum + s.amount, 0n),
      well: successful
        .filter(s => s.token === REWARDS_ADDRESSES.WELL_TOKEN)
        .reduce((sum, s) => sum + s.amount, 0n),
    },
    successful,
    errors,
  }
}

// Helper to build Merkl claim arrays from VaultRewards
function buildClaimArrays(claims: VaultRewards[]): {
  users: `0x${string}`[]
  tokens: `0x${string}`[]
  amounts: bigint[]
  proofs: `0x${string}`[][]
} {
  const users: `0x${string}`[] = []
  const tokens: `0x${string}`[] = []
  const amounts: bigint[] = []
  const proofs: `0x${string}`[][] = []

  for (const claim of claims) {
    if (claim.morphoAmount > 0n) {
      users.push(claim.vault)
      tokens.push(REWARDS_ADDRESSES.MORPHO_TOKEN)
      amounts.push(claim.morphoAmount)
      proofs.push(claim.morphoProof)
    }

    if (claim.wellAmount > 0n) {
      users.push(claim.vault)
      tokens.push(REWARDS_ADDRESSES.WELL_TOKEN)
      amounts.push(claim.wellAmount)
      proofs.push(claim.wellProof)
    }
  }

  return { users, tokens, amounts, proofs }
}
```

### 4. Contract Interaction

Merkl Distributor claim function:

```typescript
// packages/wagmi/src/abis/merkl-distributor.ts

export const merklDistributorAbi = [
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

export const MERKL_DISTRIBUTOR_ADDRESS = '0x3Ef3D8bA38EBe18DB133cEc108f4D14CE00Dd9Ae'
```

### 5. Scheduler Options

#### Option A: Temporal Scheduled Workflow

```typescript
// Schedule workflow to run daily
await client.schedule.create({
  scheduleId: 'send-earn-rewards-claim',
  spec: {
    cronExpressions: ['0 6 * * *'], // Daily at 6 AM UTC
  },
  action: {
    type: 'startWorkflow',
    workflowType: 'rewardsClaimWorkflow',
    args: [{ dryRun: false }],
    taskQueue: 'send-earn-rewards',
  },
})
```

#### Option B: API Endpoint (Manual Trigger)

Add to distributor app:

```typescript
// apps/distributor/src/app.ts

rewardsRouter.post('/claim', checkAuthorization, async (req, res) => {
  const { vaultAddresses, dryRun } = req.body

  const handle = await temporalClient.workflow.start('rewardsClaimWorkflow', {
    taskQueue: 'send-earn-rewards',
    workflowId: `rewards-claim-${Date.now()}`,
    args: [{ vaultAddresses, dryRun }],
  })

  res.json({
    workflowId: handle.workflowId,
    runId: handle.firstExecutionRunId,
  })
})
```

### 6. Claiming Authority

**Question: Who can claim rewards?**

The Merkl system allows anyone to claim on behalf of the reward recipient. The rewards go to the address specified in the proof, not the caller.

**Options:**

1. **EOA Claimer**: Dedicated EOA with ETH for gas
   - Simpler setup
   - Gas costs from operations wallet

2. **Safe Multisig**: SendEarnRevenueSafe (`0x65049C4B8e970F5bcCDAE8E141AA06346833CeC4`)
   - More secure
   - Requires Safe SDK integration
   - Can batch with other operations

3. **Paymaster-Sponsored**: Use existing paymaster infrastructure
   - Leverages existing AA setup
   - May need adjustments for batch operations

**Recommendation:** Start with EOA claimer for simplicity, migrate to Safe later.

## Configuration

```typescript
// packages/workflows/src/rewards-claim-workflow/config.ts

import { parseUnits } from 'viem'

// Static addresses (Base chain)
export const REWARDS_ADDRESSES = {
  MORPHO_TOKEN: '0xbaa5cc21fd487b8fcc2f632f3f4e8d37262a0842' as const,
  WELL_TOKEN: '0xA88594D404727625A9437C3f886C7643872296AE' as const,
  MERKL_DISTRIBUTOR: '0x3Ef3D8bA38EBe18DB133cEc108f4D14CE00Dd9Ae' as const,
}

// Environment-based configuration
export function getRewardsConfig(env: Record<string, string | undefined>) {
  return {
    // Claiming authority (dedicated EOA)
    claimerPrivateKey: env.REWARDS_CLAIMER_PRIVATE_KEY,

    // Minimum amounts to claim (configurable, defaults provided)
    minMorphoClaim: parseUnits(env.MIN_MORPHO_CLAIM ?? '1', 18),   // Default: 1 MORPHO
    minWellClaim: parseUnits(env.MIN_WELL_CLAIM ?? '10', 18),      // Default: 10 WELL

    // API rate limiting
    merklApiDelayMs: Number(env.MERKL_API_DELAY_MS ?? '100'),  // 10 req/s max

    // Schedule
    claimFrequencyHours: Number(env.CLAIM_FREQUENCY_HOURS ?? '24'),
  }
}
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `REWARDS_CLAIMER_PRIVATE_KEY` | Private key for EOA claimer | Required |
| `MIN_MORPHO_CLAIM` | Minimum MORPHO to claim (in tokens) | `1` |
| `MIN_WELL_CLAIM` | Minimum WELL to claim (in tokens) | `10` |
| `MERKL_API_DELAY_MS` | Delay between API calls (ms) | `100` |
| `CLAIM_FREQUENCY_HOURS` | Hours between claim runs | `24` |

### Reward Destination

**Important**: Rewards are claimed directly to the vault address (the address in the Merkl proof). The EOA claimer only pays gas - it does not receive the rewards.

This means:
- MORPHO and WELL tokens go to each SendEarn vault that earned them
- Vault depositors benefit proportionally via the vault's share accounting
- No additional sweep mechanism is needed for Phase 1

**Future Enhancement**: If consolidating rewards to a revenue safe is needed, it would require:
1. The vault contract to have a `collect()` or similar function allowing authorized withdrawal
2. A separate workflow to sweep accumulated rewards from vaults
3. This is out of scope for SEND-172 and should be a separate issue

## Monitoring & Alerting

### Metrics to Track

1. **Rewards Claimed**: Total MORPHO and WELL claimed per run
2. **Vaults Processed**: Number of vaults checked
3. **Gas Costs**: ETH spent on claims
4. **Errors**: Failed claims, API errors
5. **Unclaimed Value**: Value of rewards pending claim

### Database Views

```sql
-- View: send_earn_rewards_summary
CREATE OR REPLACE VIEW send_earn_rewards_summary AS
SELECT
    vault,
    token,
    SUM(amount) as total_claimed,
    COUNT(*) as claim_count,
    MAX(block_time) as last_claim_time
FROM send_earn_reward_claims
GROUP BY vault, token;
```

## Implementation Plan

### Phase 1: Core Infrastructure
1. Add Merkl Distributor ABI to wagmi config
2. Create database table for reward tracking
3. Implement Merkl API client with rate limiting

### Phase 2: Temporal Workflow
4. Create activities for fetching and claiming rewards
5. Implement workflow with error handling
6. Add workflow tests

### Phase 3: Integration
7. Add scheduler (cron or API trigger)
8. Set up monitoring and alerting
9. Deploy to staging environment

### Phase 4: Production
10. Deploy to production
11. Monitor initial runs
12. Adjust thresholds based on data

## Security Considerations

1. **API Key Management**: Store Merkl API key securely if needed for higher rate limits
2. **Transaction Signing**: Private key for EOA claimer must be secured
3. **Proof Validation**: Merkl proofs are validated on-chain; invalid proofs revert
4. **Gas Estimation**: Pre-estimate gas to avoid failed transactions

## Design Decisions

1. **Reward Destination**: Rewards go directly to vault addresses
   - Merkl proofs specify the recipient (vault address)
   - No post-claim sweep needed for Phase 1
   - Future: separate issue for revenue consolidation if needed

2. **Claiming Authority**: Dedicated EOA
   - Simple setup with private key management
   - Gas funded from operations wallet
   - EOA only pays gas; rewards go to vaults

3. **Minimum Thresholds**: Configurable via environment variables
   - `MIN_MORPHO_CLAIM` and `MIN_WELL_CLAIM`
   - Applied in `fetchClaimableRewardsActivity` before filtering
   - Prevents dust claims that waste gas

4. **Retry Strategy**: Split by activity type
   - Read activities (fetch vaults, API calls): retryable with backoff
   - Write activities (on-chain claims, DB writes): no automatic retries
   - Prevents duplicate transactions from non-idempotent operations

5. **Batch Failure Handling**: Fallback to individual claims
   - First attempts batch claim for all vaults
   - On failure, retries each vault individually
   - Records partial successes and errors for monitoring

6. **API Rate Limiting**: Enforced delay between Merkl API calls
   - Configurable via `MERKL_API_DELAY_MS` (default 100ms)
   - Backoff on 429 responses
   - Prevents incomplete reward coverage

## Open Questions

1. **Batch Size**: How many vaults can be claimed in one transaction?
   - Need to test gas limits during implementation
   - May need to split into multiple batches
