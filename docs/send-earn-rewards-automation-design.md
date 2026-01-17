# Send Earn Revenue Collection Design

Design document for SEND-172: Harvest and Sweep Morpho and Moonwell Revenue

## Purpose

Automate the collection of protocol revenue for Send platform and Send foundation:

1. **Merkl Rewards**: MORPHO and WELL tokens distributed through Merkl to vault addresses
2. **Performance Fees**: 8% of yield earned, paid as vault shares to fee recipients

## Revenue Flows

### Flow 1: Merkl Rewards (MORPHO/WELL)

```
Morpho/Moonwell Markets
        │
        ▼
  Merkl Distribution ─────► SendEarn Vaults ─────► Revenue Safe
  (rewards accrue)          (harvest)              (sweep)
                                                      │
                                                      ▼
                                            0x65049C4B8e970F5bcCDAE8E141AA06346833CeC4
                                            (Send Foundation)
```

### Flow 2: Performance Fees (Vault Shares → USDC)

```
Yield Earned on Deposits
        │
        ▼ (8% fee)
  Fee Shares Minted ──────► Affiliate Contract ────► Platform Vault
  (to feeRecipient)         (pay())                  (75% as shares)
                               │                          │
                               │                          ▼
                               │                    Revenue Safe
                               │                    (owns vault shares)
                               ▼
                          Affiliate Vault
                          (25% as shares)
```

**Note**: Revenue Safe accumulates vault shares from performance fees. Redemption to USDC is a separate manual process.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    Revenue Collection Automation                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────────────┐    │
│  │   Scheduler  │────▶│   Temporal   │────▶│  Revenue Collection  │    │
│  │  (Monthly)   │     │   Workflow   │     │  Activities          │    │
│  └──────────────┘     └──────────────┘     └──────────────────────┘    │
│         │                    │                        │                  │
│         │                    ▼                        ▼                  │
│         │             ┌──────────────┐     ┌──────────────────────┐    │
│    Manual API         │   Database   │     │   On-Chain Actions   │    │
│    Trigger            │   Tracking   │     │                      │    │
│                       └──────────────┘     │  1. Harvest (Merkl)  │    │
│                                            │  2. Sweep (Vaults)   │    │
│                                            │  3. Distribute Fees  │    │
│                                            └──────────────────────┘    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

## Three-Step Collection Process

### Step 1: Harvest (from Merkl)

Call `MerklDistributor.claim()` to transfer revenue tokens FROM Merkl TO vault addresses.

```solidity
// Merkl Distributor: 0x3Ef3D8bA38EBe18DB133cEc108f4D14CE00Dd9Ae
function claim(
    address[] users,    // vault addresses
    address[] tokens,   // MORPHO, WELL
    uint256[] amounts,
    bytes32[][] proofs
) external;
```

- Anyone can call on behalf of revenue recipients
- Tokens land in vault contract addresses
- Proofs fetched from Merkl API

### Step 2: Sweep (from Vaults to Revenue Safe)

Call `SendEarn.collect()` on each vault to transfer tokens TO the revenue safe.

```solidity
// SendEarn vault contract
function collect(address token) external {
    uint256 amount = IERC20(token).balanceOf(address(this));
    IERC20(token).safeTransfer(collections, amount);
}
```

- Anyone can call (no auth required)
- Transfers to pre-configured `collections` address
- **Safety check**: Verify `collections == REVENUE_SAFE` before calling

### Step 3: Distribute Performance Fees (from Affiliate Contracts)

Call `SendEarnAffiliate.pay()` on each affiliate contract to distribute accrued fee shares.

```solidity
// SendEarnAffiliate contract
function pay(IERC4626 vault) external {
    // Redeem all vault shares owned by this contract
    uint256 assets = vault.redeem(vault.maxRedeem(address(this)), address(this), address(this));

    // Split between platform (75%) and affiliate (25%)
    uint256 platformSplit = assets * split / SPLIT_TOTAL;
    uint256 affiliateSplit = assets - platformSplit;

    // Deposit platform's share into platformVault for Revenue Safe
    platformVault.deposit(platformSplit, platform);

    // Deposit affiliate's share into payVault for affiliate
    payVault.deposit(affiliateSplit, affiliate);
}
```

- Anyone can call (no auth required)
- Redeems fee shares → splits USDC → deposits as vault shares
- Platform receives 75% as platformVault shares (owned by Revenue Safe)
- Affiliate receives 25% as payVault shares
- **Note**: Revenue Safe accumulates vault shares, not USDC directly

#### Fee Recipient Types

| Type | feeRecipient | Action | Result |
|------|--------------|--------|--------|
| Affiliate Vault | SendEarnAffiliate contract | Call `pay(vault)` | Revenue Safe gets platformVault shares |
| Platform Vault | Revenue Safe directly | Manual redemption | Revenue Safe must call `redeem()` |

## Components

### 1. Configuration

```typescript
// packages/workflows/src/revenue-collection-workflow/config.ts

export const REVENUE_ADDRESSES = {
  // Revenue tokens
  MORPHO_TOKEN: '0xbaa5cc21fd487b8fcc2f632f3f4e8d37262a0842' as const,
  WELL_TOKEN: '0xA88594D404727625A9437C3f886C7643872296AE' as const,

  // Contracts
  MERKL_DISTRIBUTOR: '0x3Ef3D8bA38EBe18DB133cEc108f4D14CE00Dd9Ae' as const,

  // Revenue destination (Send Foundation)
  REVENUE_SAFE: '0x65049C4B8e970F5bcCDAE8E141AA06346833CeC4' as const,
}

export function getRevenueConfig(env: Record<string, string | undefined>) {
  return {
    // EOA that pays gas for harvest + sweep transactions
    collectorPrivateKey: env.REVENUE_COLLECTOR_PRIVATE_KEY,

    // Minimum amounts to harvest (avoid dust/gas waste)
    minMorphoHarvest: parseUnits(env.MIN_MORPHO_HARVEST ?? '1', 18),
    minWellHarvest: parseUnits(env.MIN_WELL_HARVEST ?? '10', 18),

    // API rate limiting
    merklApiDelayMs: Number(env.MERKL_API_DELAY_MS ?? '100'),
  }
}
```

### 2. Database Schema

Track both harvest and sweep transactions:

```sql
-- Table: send_earn_revenue_harvest
-- Records revenue harvested from Merkl to vault addresses
CREATE TABLE IF NOT EXISTS "public"."send_earn_revenue_harvest" (
    "id" bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    "vault" bytea NOT NULL,           -- SendEarn vault address
    "token" bytea NOT NULL,           -- MORPHO or WELL
    "amount" numeric NOT NULL,        -- Amount harvested
    "tx_hash" bytea NOT NULL,         -- Merkl claim transaction
    "block_num" numeric NOT NULL,
    "block_time" numeric NOT NULL,
    "created_at" timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX u_revenue_harvest ON send_earn_revenue_harvest(vault, token, tx_hash);

-- Table: send_earn_revenue_sweep
-- Records revenue swept from vaults to revenue safe
CREATE TABLE IF NOT EXISTS "public"."send_earn_revenue_sweep" (
    "id" bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    "vault" bytea NOT NULL,           -- Source vault
    "token" bytea NOT NULL,           -- MORPHO or WELL
    "amount" numeric NOT NULL,        -- Amount swept
    "destination" bytea NOT NULL,     -- Revenue safe address
    "tx_hash" bytea NOT NULL,         -- collect() transaction
    "block_num" numeric NOT NULL,
    "block_time" numeric NOT NULL,
    "created_at" timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX u_revenue_sweep ON send_earn_revenue_sweep(vault, token, tx_hash);

-- View: send_earn_revenue_summary
CREATE OR REPLACE VIEW send_earn_revenue_summary AS
SELECT
    token,
    SUM(amount) as total_collected,
    COUNT(DISTINCT vault) as vaults_collected,
    MAX(block_time) as last_collection_time
FROM send_earn_revenue_sweep
GROUP BY token;
```

### 3. Temporal Workflow

```typescript
// packages/workflows/src/revenue-collection-workflow/workflow.ts

export interface RevenueCollectionInput {
  vaultAddresses?: `0x${string}`[]  // Optional: specific vaults, or all if empty
  dryRun?: boolean                   // Simulate without executing
}

export interface RevenueCollectionResult {
  vaultsProcessed: number
  harvested: {
    morpho: bigint
    well: bigint
    transactions: `0x${string}`[]
  }
  swept: {
    morpho: bigint
    well: bigint
    transactions: `0x${string}`[]
  }
  errors: { vault: string; step: 'harvest' | 'sweep'; error: string }[]
  dryRunData?: DryRunData  // Only present if dryRun=true
}

interface DryRunData {
  harvestableFromMerkl: {
    vault: `0x${string}`
    morphoAmount: bigint
    wellAmount: bigint
  }[]
  currentVaultBalances: {
    vault: `0x${string}`
    morphoBalance: bigint
    wellBalance: bigint
  }[]
  expectedRevenue: {
    morpho: bigint  // harvestable + existing balances
    well: bigint
  }
}

export async function RevenueCollectionWorkflow(
  input: RevenueCollectionInput
): Promise<RevenueCollectionResult> {
  // 1. Get list of vaults
  const vaults = input.vaultAddresses ?? await readActivities.getActiveVaultsActivity()

  // 2. Fetch harvestable revenue from Merkl API
  const harvestable = await readActivities.fetchHarvestableRevenueActivity({ vaults })

  // 3. Get current vault balances (for dry run and sweep)
  const balances = await readActivities.getVaultBalancesActivity({ vaults })

  if (input.dryRun) {
    return buildDryRunResult(vaults, harvestable, balances)
  }

  // 4. Harvest: Transfer from Merkl to vault addresses
  const harvestResult = await writeActivities.harvestRevenueActivity({
    vaultRevenue: harvestable.filter(v => v.hasHarvestableRevenue),
  })

  // 5. Record harvest transactions
  if (harvestResult.successful.length > 0) {
    await writeActivities.recordHarvestActivity({ records: harvestResult.successful })
  }

  // 6. Sweep: Transfer from vaults to revenue safe
  //    Include both newly harvested + any existing balances
  const sweepResult = await writeActivities.sweepToRevenueActivity({
    vaults: vaults,
    tokens: [REVENUE_ADDRESSES.MORPHO_TOKEN, REVENUE_ADDRESSES.WELL_TOKEN],
  })

  // 7. Record sweep transactions
  if (sweepResult.successful.length > 0) {
    await writeActivities.recordSweepActivity({ records: sweepResult.successful })
  }

  return {
    vaultsProcessed: vaults.length,
    harvested: {
      morpho: harvestResult.totals.morpho,
      well: harvestResult.totals.well,
      transactions: harvestResult.transactions,
    },
    swept: {
      morpho: sweepResult.totals.morpho,
      well: sweepResult.totals.well,
      transactions: sweepResult.transactions,
    },
    errors: [...harvestResult.errors, ...sweepResult.errors],
  }
}
```

### 4. Activities

```typescript
// packages/workflows/src/revenue-collection-workflow/activities.ts

export interface RevenueCollectionActivities {
  // Read activities (retryable)
  getActiveVaultsActivity: () => Promise<`0x${string}`[]>
  fetchHarvestableRevenueActivity: (params: { vaults: `0x${string}`[] }) => Promise<VaultRevenue[]>
  getVaultBalancesActivity: (params: { vaults: `0x${string}`[] }) => Promise<VaultBalances[]>

  // Write activities (non-retryable)
  harvestRevenueActivity: (params: { vaultRevenue: VaultRevenue[] }) => Promise<HarvestResult>
  sweepToRevenueActivity: (params: { vaults: `0x${string}`[]; tokens: `0x${string}`[] }) => Promise<SweepResult>
  recordHarvestActivity: (params: { records: HarvestRecord[] }) => Promise<void>
  recordSweepActivity: (params: { records: SweepRecord[] }) => Promise<void>
}
```

#### Activity: `sweepToRevenueActivity`

```typescript
async function sweepToRevenueActivity({
  vaults,
  tokens,
}: {
  vaults: `0x${string}`[]
  tokens: `0x${string}`[]
}): Promise<SweepResult> {
  const successful: SweepRecord[] = []
  const errors: { vault: string; step: 'sweep'; error: string }[] = []
  const transactions: `0x${string}`[] = []

  for (const vault of vaults) {
    // Safety check: Verify collections address matches revenue safe
    const collections = await getVaultCollectionsAddress(vault)
    if (collections.toLowerCase() !== REVENUE_ADDRESSES.REVENUE_SAFE.toLowerCase()) {
      errors.push({
        vault,
        step: 'sweep',
        error: `Collections address mismatch: ${collections} !== ${REVENUE_ADDRESSES.REVENUE_SAFE}`,
      })
      continue  // Skip this vault, continue with others
    }

    for (const token of tokens) {
      // Check balance before calling collect
      const balance = await getTokenBalance(token, vault)
      if (balance === 0n) continue

      try {
        const txHash = await callCollect(vault, token)
        const receipt = await waitForTransactionReceipt(baseMainnetClient, { hash: txHash })

        if (receipt.status === 'success') {
          transactions.push(txHash)
          successful.push({
            vault,
            token,
            amount: balance,
            destination: REVENUE_ADDRESSES.REVENUE_SAFE,
            txHash,
            blockNum: receipt.blockNumber,
            blockTime: await getBlockTimestamp(receipt),
          })
        } else {
          errors.push({ vault, step: 'sweep', error: 'Transaction reverted' })
        }
      } catch (error) {
        errors.push({ vault, step: 'sweep', error: error.message ?? 'Unknown error' })
      }
    }
  }

  return {
    transactions,
    totals: calculateTotals(successful),
    successful,
    errors,
  }
}
```

### 5. Wagmi Config Additions

```typescript
// packages/wagmi/wagmi.config.ts

// Add revenue safe address
{
  name: 'SendEarnRevenueSafe',
  address: {
    [base.id]: '0x65049C4B8e970F5bcCDAE8E141AA06346833CeC4',
  },
}

// SendEarn collect function (if not already present)
{
  name: 'SendEarn',
  abi: [
    {
      type: 'function',
      name: 'collect',
      inputs: [{ name: 'token', type: 'address' }],
      outputs: [],
      stateMutability: 'nonpayable',
    },
    {
      type: 'function',
      name: 'collections',
      inputs: [],
      outputs: [{ name: '', type: 'address' }],
      stateMutability: 'view',
    },
  ],
}
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `REVENUE_COLLECTOR_PRIVATE_KEY` | EOA private key for harvest + sweep txs | Required |
| `MIN_MORPHO_HARVEST` | Minimum MORPHO to harvest (in tokens) | `1` |
| `MIN_WELL_HARVEST` | Minimum WELL to harvest (in tokens) | `10` |
| `MERKL_API_DELAY_MS` | Delay between API calls (ms) | `100` |

## Scheduling

- **Automated**: Monthly cron schedule
- **Manual**: API endpoint for on-demand collection

```typescript
// Monthly schedule (1st of each month at 6 AM UTC)
await client.schedule.create({
  scheduleId: 'send-earn-revenue-collection',
  spec: {
    cronExpressions: ['0 6 1 * *'],
  },
  action: {
    type: 'startWorkflow',
    workflowType: 'RevenueCollectionWorkflow',
    args: [{ dryRun: false }],
    taskQueue: 'send-earn-revenue',
  },
})
```

## Dry Run Mode

When `dryRun: true`, the workflow returns simulation data without executing transactions. The `DryRunData` interface (defined in Temporal Workflow section above) includes:

- `harvestableFromMerkl`: Revenue available to harvest from Merkl per vault
- `currentVaultBalances`: Existing MORPHO/WELL balances already in vaults
- `expectedRevenue`: Total expected revenue (harvestable + existing balances)

## Error Handling

| Scenario | Behavior |
|----------|----------|
| Merkl API rate limited (429) | Exponential backoff, max 3 retries |
| Merkl API error (non-429) | Log error, skip vault, continue |
| Harvest tx fails | Log error, skip vault, continue |
| Collections address mismatch | Log error, skip vault, continue |
| Sweep tx fails | Log error, continue with other vaults |
| All vaults fail | Return error summary, no partial data |

## Security Considerations

1. **Collections Address Verification**: Always verify `vault.collections() == REVENUE_SAFE` before calling `collect()`
2. **Private Key Security**: Collector EOA key stored securely, only has gas funds
3. **Proof Validation**: Merkl proofs validated on-chain; invalid proofs revert
4. **Gas Estimation**: Pre-estimate gas to avoid failed transactions

## Monitoring

### Metrics to Track

1. **Revenue Collected**: Total MORPHO and WELL swept to revenue safe
2. **Vaults Processed**: Number of vaults checked per run
3. **Gas Costs**: ETH spent on harvest + sweep transactions
4. **Errors**: Failed harvests, failed sweeps, collections mismatches
5. **Pending Revenue**: Value of revenue waiting to be collected
6. **Total Value Locked (TVL)**: Total assets (USDC) deposited across all Send Earn vaults

## TVL Calculation

Track the total value locked across all Send Earn vaults for analytics and reporting.

### Implementation

```typescript
// packages/send-earn/src/vaults.ts

interface VaultTVL {
  vault: `0x${string}`
  totalAssets: bigint      // USDC (6 decimals)
  totalSupply: bigint      // Vault shares
  underlyingVault: `0x${string}`  // Morpho or Moonwell vault
}

interface TVLResult {
  vaults: VaultTVL[]
  totals: {
    totalAssets: bigint    // Total USDC across all vaults
    vaultCount: number     // Number of active vaults
  }
}

/**
 * Get TVL for all Send Earn vaults.
 * Calls vault.totalAssets() to get the total USDC deposited.
 */
export async function getVaultsTVL(
  config: RevenueConfig,
  vaults: `0x${string}`[]
): Promise<TVLResult> {
  const client = createReadClient(config.rpcUrl)
  const results: VaultTVL[] = []

  for (const vault of vaults) {
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
        abi: sendEarnAbi,
        functionName: 'VAULT',
      }),
    ])

    results.push({
      vault,
      totalAssets,
      totalSupply,
      underlyingVault,
    })
  }

  return {
    vaults: results,
    totals: {
      totalAssets: results.reduce((sum, v) => sum + v.totalAssets, 0n),
      vaultCount: results.length,
    },
  }
}
```

### CLI Command

```bash
# Display TVL for all vaults
send-earn tvl

# Output formats
send-earn tvl --format=json
send-earn tvl --format=table
```

### Output Example (Table)

```
┌─────────────────────────────────────────────────────────────────┐
│ Send Earn TVL                                                    │
├──────────────────────────┬──────────────────┬───────────────────┤
│ Vault                    │ TVL (USDC)       │ Underlying        │
├──────────────────────────┼──────────────────┼───────────────────┤
│ 0x1234...abcd           │   1,234,567.89   │ Morpho            │
│ 0x5678...efgh           │     567,890.12   │ Moonwell          │
├──────────────────────────┼──────────────────┼───────────────────┤
│ Total                    │   1,802,458.01   │ 2 vaults          │
└──────────────────────────┴──────────────────┴───────────────────┘
```

### Use Cases

1. **Analytics Dashboard**: Display total TVL on Send Earn analytics page
2. **Revenue Projections**: Estimate expected fees based on TVL and APY
3. **Protocol Health**: Monitor deposit/withdrawal trends over time
4. **Reporting**: Monthly TVL snapshots for stakeholder updates

### Alerts

- Collections address mismatch on any vault
- Harvest or sweep failure rate > 10%
- No successful collection in 60 days

## Implementation Checklist

- [ ] Update wagmi config with SendEarn collect ABI and revenue safe address
- [ ] Rename workflow from `rewards-claim` to `revenue-collection`
- [ ] Rename activities to use harvest/sweep terminology
- [ ] Add sweepToRevenueActivity with collections address verification
- [ ] Add getVaultBalancesActivity for dry run simulation
- [ ] Update database schema (harvest + sweep tables)
- [ ] Add dry run simulation logic
- [ ] Update environment variable names
- [ ] Add monthly schedule configuration
- [ ] Update tests
