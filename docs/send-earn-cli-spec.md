# Send Earn CLI Specification

## Overview

A standalone CLI package (`@my/send-earn`) for managing Send Earn revenue collection operations. Provides dry-run visualization, harvest execution, and sweep operations against production or local environments.

The package exports a core library that `@my/workflows` imports for Temporal activities, ensuring a single source of truth for revenue collection logic.

## Goals

- Visualize harvestable rewards and sweepable balances (dry-run)
- Execute harvest (Merkl claims) and sweep (vault collect) operations
- Reusable core library that Temporal workflows import
- Clean separation from Temporal-specific code
- Global CLI installation support

## Technical Stack

| Component | Choice | Rationale |
|-----------|--------|-----------|
| CLI Runtime | Bun | Fast startup, native TypeScript |
| Core Library | Node.js compatible | Temporal workers run on Node.js |
| CLI Framework | zx (latest) | Shell scripting, chalk, minimist built-in |
| DB Client | pg (node-postgres) | Works in both Node.js and Bun |
| Blockchain | viem | Already used throughout monorepo |

## Package Structure

```
packages/send-earn/
├── bin/
│   └── send-earn.ts          # CLI entry point (zx)
├── src/
│   ├── index.ts              # Library exports (high-level functions)
│   ├── merkl.ts              # Merkl API client
│   ├── vaults.ts             # Vault operations (balance reading, collect)
│   ├── revenue.ts            # Revenue calculations and aggregation
│   ├── db.ts                 # Database queries (send_earn_create)
│   ├── types.ts              # Shared type definitions
│   └── output/
│       ├── table.ts          # CLI table formatting
│       ├── json.ts           # JSON output
│       ├── csv.ts            # CSV export
│       └── markdown.ts       # Markdown output
├── package.json
└── tsconfig.json
```

## Commands

### `send-earn dry-run`

Display harvestable rewards from Merkl and current vault balances.

```bash
send-earn dry-run \
  --db-url=<postgres-url> \
  --rpc-url=<base-rpc-url> \
  [--vault=<address>]       # Filter to specific vault(s), repeatable
  [--min-morpho=<amount>]   # Override minimum MORPHO threshold (default: 1)
  [--min-well=<amount>]     # Override minimum WELL threshold (default: 10)
  [--format=table|json|csv|markdown]  # Output format (default: table)
```

**Output (table format):**
```
┌─────────────────────────────────────────────────────────────────┐
│                    Send Earn Revenue Dry Run                    │
├──────────────────────────┬──────────────┬──────────────────────┤
│ Vault                    │ MORPHO       │ WELL                 │
├──────────────────────────┼──────────────┼──────────────────────┤
│ 0x1234...abcd            │ 125.50       │ 1,250.00             │
│ 0x5678...efgh            │ 87.25        │ 890.00               │
├──────────────────────────┼──────────────┼──────────────────────┤
│ Total Harvestable        │ 212.75       │ 2,140.00             │
│ Current Vault Balances   │ 50.00        │ 100.00               │
│ Total Sweepable          │ 262.75       │ 2,240.00             │
└──────────────────────────┴──────────────┴──────────────────────┘
```

### `send-earn harvest`

Execute Merkl claim transactions to harvest rewards into vaults.

```bash
send-earn harvest \
  --db-url=<postgres-url> \
  --rpc-url=<base-rpc-url> \
  [--vault=<address>]       # Filter to specific vault(s)
  [--min-morpho=<amount>]   # Override minimum threshold
  [--min-well=<amount>]     # Override minimum threshold
```

**Environment Variables:**
- `REVENUE_COLLECTOR_PRIVATE_KEY` - Required for transaction signing

**Behavior:**
- Fetches fresh Merkl proofs for each vault
- If any proof becomes stale mid-batch: **fail fast, abort entire batch**
- Reports which vaults succeeded before failure
- User must re-run to complete remaining vaults

### `send-earn sweep`

Execute vault sweep transactions to move tokens to revenue safe.

```bash
send-earn sweep \
  --db-url=<postgres-url> \
  --rpc-url=<base-rpc-url> \
  [--vault=<address>]       # Filter to specific vault(s)
```

**Environment Variables:**
- `REVENUE_COLLECTOR_PRIVATE_KEY` - Required for transaction signing

**Behavior:**
- Reads `collections` address from each vault
- If collections != revenue safe: **skip with warning, continue with others**
- Calls `collect(token)` for each token with balance > 0
- Reports all skipped vaults in summary

## Library API

The package exports high-level functions for use by `@my/workflows`:

```typescript
// @my/send-earn

export interface RevenueConfig {
  dbUrl: string
  rpcUrl: string
  collectorPrivateKey?: string
  minMorphoHarvest: bigint
  minWellHarvest: bigint
  merklApiDelayMs: number
  merklApiTimeoutMs: number
}

export interface DryRunResult {
  vaults: VaultRevenue[]
  totals: {
    harvestable: { morpho: bigint; well: bigint }
    vaultBalances: { morpho: bigint; well: bigint }
    sweepable: { morpho: bigint; well: bigint }
  }
}

export interface HarvestResult {
  harvested: { morpho: bigint; well: bigint }
  transactions: TransactionRecord[]
  errors: RevenueError[]
}

export interface SweepResult {
  swept: { morpho: bigint; well: bigint }
  transactions: TransactionRecord[]
  skipped: SkippedVault[]
  errors: RevenueError[]
}

// High-level functions
export async function dryRun(config: RevenueConfig): Promise<DryRunResult>
export async function harvest(config: RevenueConfig): Promise<HarvestResult>
export async function sweep(config: RevenueConfig): Promise<SweepResult>

// Vault filtering
export async function getActiveVaults(dbUrl: string): Promise<string[]>
```

## Integration with Workflows

The `@my/workflows` package imports from `@my/send-earn`:

```typescript
// packages/workflows/src/revenue-collection-workflow/activities.ts
import { dryRun, harvest, sweep, getActiveVaults } from '@my/send-earn'

export async function fetchHarvestableRevenueActivity(input) {
  const result = await dryRun({
    dbUrl: process.env.DATABASE_URL,
    rpcUrl: process.env.BASE_RPC_URL,
    // ... config
  })
  return result
}
```

## Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | For execution | - | PostgreSQL connection string |
| `BASE_RPC_URL` | For execution | - | Base chain RPC endpoint |
| `REVENUE_COLLECTOR_PRIVATE_KEY` | For harvest/sweep | - | Transaction signer private key |

### CLI Flags

| Flag | Default | Description |
|------|---------|-------------|
| `--db-url` | `$DATABASE_URL` | Database connection string |
| `--rpc-url` | `$BASE_RPC_URL` | RPC endpoint |
| `--vault` | All vaults | Filter to specific vault address (repeatable) |
| `--min-morpho` | 1 | Minimum MORPHO to harvest |
| `--min-well` | 10 | Minimum WELL to harvest |
| `--format` | table | Output format: table, json, csv, markdown |

## Error Handling

### Merkl API Errors

- **Rate limited (429)**: Built-in 100ms delay between requests
- **Timeout**: 30s timeout with AbortController (existing behavior)
- **Stale proof during harvest**: Fail fast, abort batch, report progress

### Vault Errors

- **Collections mismatch**: Skip vault with warning, continue others
- **Transaction failure**: Report error, continue with other vaults
- **RPC errors**: Fail with descriptive message

## Output Formats

### Table (default)

Human-readable ASCII table with summary totals.

### JSON

```json
{
  "vaults": [
    {
      "address": "0x1234...",
      "harvestable": { "morpho": "125500000000000000000", "well": "1250000000000000000000" },
      "balance": { "morpho": "0", "well": "0" }
    }
  ],
  "totals": {
    "harvestable": { "morpho": "212750000000000000000", "well": "2140000000000000000000" },
    "vaultBalances": { "morpho": "50000000000000000000", "well": "100000000000000000000" },
    "sweepable": { "morpho": "262750000000000000000", "well": "2240000000000000000000" }
  }
}
```

### CSV

```csv
vault,morpho_harvestable,well_harvestable,morpho_balance,well_balance
0x1234...,125.50,1250.00,0.00,0.00
0x5678...,87.25,890.00,0.00,0.00
```

### Markdown

```markdown
## Send Earn Revenue Dry Run

| Vault | MORPHO | WELL |
|-------|--------|------|
| 0x1234...abcd | 125.50 | 1,250.00 |
| 0x5678...efgh | 87.25 | 890.00 |

**Totals:**
- Harvestable: 212.75 MORPHO, 2,140.00 WELL
- Vault Balances: 50.00 MORPHO, 100.00 WELL
- Sweepable: 262.75 MORPHO, 2,240.00 WELL
```

## Package Configuration

```json
{
  "name": "@my/send-earn",
  "version": "0.0.1",
  "type": "module",
  "bin": {
    "send-earn": "./bin/send-earn.ts"
  },
  "exports": {
    ".": "./src/index.ts"
  },
  "dependencies": {
    "pg": "^8.12.0",
    "viem": "^2.27.2",
    "zx": "^8.3.0"
  }
}
```

## Migration Path

1. Create `packages/send-earn/` with core logic extracted from activities
2. Update `@my/workflows` to depend on `@my/send-earn`
3. Refactor activities to call library functions
4. Add CLI commands
5. Test dry-run against production DB (read-only)
6. Test harvest/sweep against Anvil fork

## Security Considerations

- Private key read from environment variable only (no file/keychain)
- CLI performs safety check before sweep (collections == revenue safe)
- No USD price fetching (reduces external API dependencies)
- All database queries are read-only except for workflow recording

## Success Criteria

- [ ] `send-earn dry-run` displays accurate harvestable/sweepable amounts
- [ ] `send-earn harvest` successfully claims from Merkl distributor
- [ ] `send-earn sweep` successfully moves tokens to revenue safe
- [ ] Temporal workflow activities use shared library
- [ ] All output formats render correctly
- [ ] CLI installable globally via bun/npm
