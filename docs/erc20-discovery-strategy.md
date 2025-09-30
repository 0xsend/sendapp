# ERC20 Token Discovery Strategy

## Problem Statement

We want to index ALL ERC20 tokens on Base, but:
- Shovel requires known contract addresses upfront for filtering
- No universal "ERC20Created" event exists
- Tokens can be deployed via factories, direct deployment, or proxies

## Discovery Approaches

### Approach 1: Factory Event Monitoring ⭐ **RECOMMENDED**

Monitor known token factory contracts for creation events.

**Pros:**
- Catches tokens at birth
- Lower event volume than monitoring all Transfers
- Can use Shovel directly for factory events

**Cons:**
- Only catches tokens from known factories
- Misses direct deployments
- Need to maintain factory list

**Known Base Factories:**
```typescript
// DEX Factories (create pair tokens)
const UNISWAP_V2_FACTORY = '0x8909Dc15e40173Ff4699343b6eB8132c65e18eC6' // Base
const UNISWAP_V3_FACTORY = '0x33128a8fC17869897dcE68Ed026d694621f6FDfD' // Base
const AERODROME_FACTORY = '0x420DD381b31aEf6683db6B902084cB0FFECe40Da' // Base

// Token Creator Platforms
// (research popular token creation platforms on Base)
```

**Shovel Integration:**

```typescript
// packages/shovel/src/integrations/uniswap-v2-pair-created.ts

export const uniswapV2PairCreatedIntegration: Omit<Integration, 'sources'> = {
  name: 'uniswap_v2_pair_created',
  enabled: true,
  table: {
    name: 'erc20_tokens_discovered_via_factory',
    columns: [
      { name: 'chain_id', type: 'numeric' },
      { name: 'factory_addr', type: 'bytea' },
      { name: 'pair_addr', type: 'bytea' }, // The new ERC20 token (LP token)
      { name: 'token0', type: 'bytea' },
      { name: 'token1', type: 'bytea' },
      { name: 'block_num', type: 'numeric' },
      { name: 'block_time', type: 'numeric' },
      { name: 'tx_hash', type: 'bytea' },
    ],
  },
  block: [
    { name: 'chain_id', column: 'chain_id' },
    { name: 'block_num', column: 'block_num' },
    { name: 'block_time', column: 'block_time' },
    { name: 'tx_hash', column: 'tx_hash' },
    {
      name: 'log_addr',
      column: 'factory_addr',
      filter_op: 'contains',
      filter_arg: [
        '0x8909Dc15e40173Ff4699343b6eB8132c65e18eC6', // Uniswap V2
        '0x420DD381b31aEf6683db6B902084cB0FFECe40Da', // Aerodrome
      ],
    },
  ],
  event: {
    type: 'event',
    name: 'PairCreated',
    anonymous: false,
    inputs: [
      { indexed: true, name: 'token0', type: 'address', column: 'token0' },
      { indexed: true, name: 'token1', type: 'address', column: 'token1' },
      { indexed: false, name: 'pair', type: 'address', column: 'pair_addr' },
      { indexed: false, name: 'allPairsLength', type: 'uint256' },
    ],
  },
}
```

**Post-Processing:**
- Shovel captures factory events
- Separate service reads discovered addresses
- Calls contract methods to get name/symbol/decimals
- Inserts into `erc20_tokens` table
- Adds both `token0`, `token1`, and `pair` (LP token) to the list

### Approach 2: Contract Creation Monitoring

Monitor contract creation transactions and check for ERC20 interface.

**Pros:**
- Catches ALL token deployments
- No factory list needed
- Comprehensive coverage

**Cons:**
- Very high volume (all contract creations)
- Expensive to check every deployment
- Cannot use Shovel (no standard event)
- Requires external indexer

**Implementation:**
```typescript
// External service (not Shovel)

async function monitorContractCreations() {
  // Get recent contract creation txs
  const creations = await getContractCreationTxs()

  for (const tx of creations) {
    const contractAddr = tx.creates

    // Check if implements ERC20
    const isERC20 = await checkERC20Interface(contractAddr)

    if (isERC20) {
      await addToDatabase(contractAddr)
    }
  }
}

async function checkERC20Interface(address: string): Promise<boolean> {
  try {
    // Try calling ERC20 methods
    await Promise.all([
      contract.name(),
      contract.symbol(),
      contract.decimals(),
      contract.totalSupply(),
    ])
    return true
  } catch {
    return false // Not ERC20
  }
}
```

### Approach 3: Transfer Event Scraping (Fallback)

Monitor Transfer events from unknown addresses as fallback discovery.

**Pros:**
- Catches tokens missed by other methods
- Indicates active tokens (not just deployed)

**Cons:**
- Very high volume
- Cannot use Shovel without address list
- Noisy (includes NFTs)

**Implementation:**
- Run periodically (not real-time)
- Query last N blocks for Transfer events
- Filter for unknown addresses
- Add to discovery queue

## Recommended Hybrid Strategy

Combine multiple approaches for comprehensive coverage:

```
┌────────────────────────────────────────┐
│  Discovery Sources                     │
├────────────────────────────────────────┤
│                                        │
│  1. Factory Events (Shovel)            │
│     ├─ Uniswap V2/V3                   │
│     ├─ Aerodrome                       │
│     └─ Other DEX factories             │
│                                        │
│  2. Curated Seed List                  │
│     ├─ USDC, WETH, DAI                 │
│     ├─ Popular Base tokens             │
│     └─ Manually added                  │
│                                        │
│  3. Transfer Event Scraping (Periodic) │
│     └─ Discovers active unknowns       │
│                                        │
└────────────┬───────────────────────────┘
             │
             ▼
┌────────────────────────────────────────┐
│  Token Processing Pipeline             │
├────────────────────────────────────────┤
│                                        │
│  1. Check if already exists            │
│  2. Read contract (name, symbol, etc)  │
│  3. Validate ERC20 interface           │
│  4. Insert into erc20_tokens           │
│  5. Initialize activity tracking       │
│                                        │
└────────────────────────────────────────┘
```

## Implementation Plan

### Phase 1: Bootstrap (Day 1)

**Manually seed with known tokens:**

```sql
-- Seed with popular Base tokens
INSERT INTO erc20_tokens (address, chain_id, name, symbol, decimals, total_supply, block_num, block_time, tx_hash)
VALUES
  (decode('833589fcd6edb6e08f4c7c32d4f71b54bda02913', 'hex'), 8453, 'USD Coin', 'USDC', 6, 0, 0, 0, decode('', 'hex')),
  (decode('4200000000000000000000000000000000000006', 'hex'), 8453, 'Wrapped Ether', 'WETH', 18, 0, 0, 0, decode('', 'hex')),
  (decode('50c5725949a6f0c72e6c4a641f24049a917db0cb', 'hex'), 8453, 'Dai Stablecoin', 'DAI', 18, 0, 0, 0, decode('', 'hex')),
  (decode('2ae3f1ec7f1f5012cfeab0185bfc7aa3cf0dec22', 'hex'), 8453, 'Coinbase Wrapped Staked ETH', 'cbETH', 18, 0, 0, 0, decode('', 'hex'));
  -- Add more...
```

### Phase 2: Factory Monitoring (Day 2-3)

**Add Shovel integrations for factory events:**

1. Create Shovel integration for Uniswap V2 `PairCreated`
2. Create Shovel integration for Uniswap V3 `PoolCreated`
3. Create Shovel integration for Aerodrome factory
4. Research and add other popular factories

**Post-processing service:**

```typescript
// apps/next/pages/api/cron/process-factory-discoveries.ts

export default async function handler(req, res) {
  // Get newly discovered tokens from Shovel tables
  const discoveries = await getFactoryDiscoveries()

  for (const discovery of discoveries) {
    // Process token0, token1, and pair address
    await processDiscoveredToken(discovery.token0)
    await processDiscoveredToken(discovery.token1)
    await processDiscoveredToken(discovery.pair_addr)
  }

  return res.json({ processed: discoveries.length })
}
```

### Phase 3: Transfer Event Fallback (Day 4-5)

**Periodic discovery from Transfer events:**

```typescript
// apps/next/pages/api/cron/discover-from-transfers.ts

export default async function handler(req, res) {
  const recentBlocks = 1000 // Last 1000 blocks

  // Query Transfer events from unknown addresses
  const unknownTokens = await findUnknownTransfers(recentBlocks)

  for (const token of unknownTokens) {
    await processDiscoveredToken(token)
  }

  return res.json({ discovered: unknownTokens.length })
}
```

## Database Schema Addition

Add a table to track discovery sources:

```sql
CREATE TABLE public.erc20_token_discovery_log (
    token_address bytea NOT NULL,
    chain_id numeric NOT NULL,
    discovery_method text NOT NULL, -- 'factory', 'manual', 'transfer_scan', 'contract_creation'
    discovered_at timestamp with time zone DEFAULT now() NOT NULL,
    source_detail jsonb, -- Factory address, block number, etc.

    PRIMARY KEY (token_address, chain_id, discovery_method),
    FOREIGN KEY (token_address, chain_id) REFERENCES public.erc20_tokens(address, chain_id) ON DELETE CASCADE
);
```

## Shovel Integrations to Create

1. ✅ **Uniswap V2 PairCreated** - Discovers LP tokens and underlying tokens
2. ✅ **Uniswap V3 PoolCreated** - Discovers V3 pool tokens
3. ✅ **Aerodrome Factory** - Popular Base DEX
4. ✅ **Token Factory Events** - If common token creation platforms exist

## Discovery Service Components

### Component 1: Factory Event Processor

```typescript
// packages/erc20-discovery/src/factory-processor.ts

export async function processFactoryDiscoveries() {
  const discoveries = await db.query(`
    SELECT DISTINCT pair_addr as address, token0, token1
    FROM erc20_tokens_discovered_via_factory
    WHERE pair_addr NOT IN (SELECT address FROM erc20_tokens WHERE chain_id = 8453)
       OR token0 NOT IN (SELECT address FROM erc20_tokens WHERE chain_id = 8453)
       OR token1 NOT IN (SELECT address FROM erc20_tokens WHERE chain_id = 8453)
    LIMIT 100
  `)

  const addresses = new Set<string>()

  for (const row of discoveries.rows) {
    addresses.add(row.address)
    addresses.add(row.token0)
    addresses.add(row.token1)
  }

  for (const address of addresses) {
    await processToken(address)
  }
}
```

### Component 2: Transfer Event Scanner

```typescript
// packages/erc20-discovery/src/transfer-scanner.ts

export async function scanTransfersForUnknownTokens() {
  const fromBlock = await getLastScannedBlock()
  const toBlock = fromBlock + 1000n

  const logs = await client.getLogs({
    fromBlock,
    toBlock,
    topics: ['0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'],
  })

  const unknownAddresses = logs
    .map(log => log.address)
    .filter(addr => !isKnownToken(addr))

  const unique = [...new Set(unknownAddresses)]

  for (const address of unique) {
    await processToken(address)
  }

  await saveLastScannedBlock(toBlock)
}
```

### Component 3: Token Processor (Shared)

```typescript
// packages/erc20-discovery/src/token-processor.ts

export async function processToken(address: string) {
  // Check if already processed
  const exists = await db.query(
    'SELECT 1 FROM erc20_tokens WHERE address = $1 AND chain_id = $2',
    [hexToBytes(address), 8453]
  )

  if (exists.rows.length > 0) {
    return // Already processed
  }

  try {
    // Read token metadata
    const [name, symbol, decimals, totalSupply] = await Promise.all([
      readErc20Name(client, address),
      readErc20Symbol(client, address),
      readErc20Decimals(client, address),
      readErc20TotalSupply(client, address),
    ])

    // Insert into database
    await db.query(`
      INSERT INTO erc20_tokens (
        address, chain_id, name, symbol, decimals, total_supply,
        block_num, block_time, tx_hash
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (address, chain_id) DO NOTHING
    `, [hexToBytes(address), 8453, name, symbol, decimals, totalSupply, 0, 0, Buffer.from('')])

    console.log(`✅ Added token: ${symbol} (${address})`)
  } catch (error) {
    console.log(`❌ Not a valid ERC20: ${address}`)
  }
}
```

## Vercel Cron Schedule

```json
{
  "crons": [
    {
      "path": "/api/cron/process-factory-discoveries",
      "schedule": "*/15 * * * *"
    },
    {
      "path": "/api/cron/discover-from-transfers",
      "schedule": "0 */6 * * *"
    },
    {
      "path": "/api/cron/enrich-token-metadata",
      "schedule": "0 */6 * * *"
    },
    {
      "path": "/api/cron/update-token-activity",
      "schedule": "0 * * * *"
    }
  ]
}
```

## Coverage Estimates

| Method | Coverage | Discovery Speed | Volume |
|--------|----------|-----------------|--------|
| **Manual Seed** | Top 50-100 tokens | Immediate | Low |
| **Factory Events** | ~60-70% of tokens | Real-time | Medium |
| **Transfer Scan** | ~90-95% of tokens | Hours to days | High |
| **Combined** | ~95%+ of active tokens | Real-time to days | Medium |

## Next Steps

1. ✅ Research Base factory contracts (Uniswap, Aerodrome, etc.)
2. ✅ Create Shovel integrations for factory events
3. ✅ Build factory event post-processor
4. ✅ Implement transfer event scanner (fallback)
5. ✅ Seed database with popular tokens
6. ✅ Deploy and monitor

This approach gives us comprehensive coverage while being practical to implement.