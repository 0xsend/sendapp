# ERC20 Token Indexer Plan

## Overview

This document outlines the plan to implement an ERC20 token indexing system using Shovel for on-chain data ingestion and a separate service for enriching token metadata from external APIs (CoinMarketCap, CoinGecko).

## Architecture

```
┌─────────────────┐
│  Base Chain     │
│  (ERC20 Events) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Shovel         │
│  (Indexer)      │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  PostgreSQL / Supabase              │
│                                     │
│  ┌─────────────────────────────┐  │
│  │ erc20_tokens                │  │
│  │ - address (PK)              │  │
│  │ - chain_id                  │  │
│  │ - name                      │  │
│  │ - symbol                    │  │
│  │ - decimals                  │  │
│  │ - total_supply              │  │
│  │ - block_num                 │  │
│  │ - block_time                │  │
│  │ - tx_hash                   │  │
│  │ - created_at                │  │
│  └──────────┬──────────────────┘  │
│             │                      │
│  ┌──────────▼──────────────────┐  │
│  │ erc20_token_metadata        │  │
│  │ - token_address (FK, PK)    │  │
│  │ - cmc_id                    │  │
│  │ - coingecko_id              │  │
│  │ - logo_url                  │  │
│  │ - description               │  │
│  │ - website                   │  │
│  │ - twitter                   │  │
│  │ - market_cap_usd            │  │
│  │ - price_usd                 │  │
│  │ - volume_24h_usd            │  │
│  │ - last_updated              │  │
│  │ - metadata_source           │  │
│  └─────────────────────────────┘  │
└─────────────────────────────────────┘
         ▲
         │
┌────────┴─────────┐
│ Metadata Service │
│ (Separate        │
│  Process)        │
│                  │
│ - CoinMarketCap  │
│ - CoinGecko      │
└──────────────────┘
```

## Database Design

### Table 1: `erc20_tokens`

Core on-chain token data indexed by Shovel.

```sql
CREATE TABLE public.erc20_tokens (
    -- Token identification
    address bytea NOT NULL,
    chain_id numeric NOT NULL,

    -- Token properties (from ERC20 contract)
    name text,
    symbol text,
    decimals smallint,
    total_supply numeric,

    -- Block/transaction data
    block_num numeric NOT NULL,
    block_time numeric NOT NULL,
    tx_hash bytea NOT NULL,

    -- Shovel metadata
    ig_name text,
    src_name text,
    tx_idx integer,
    log_idx integer,

    -- Timestamps
    created_at timestamp with time zone DEFAULT now() NOT NULL,

    PRIMARY KEY (address, chain_id)
);

-- Indexes
CREATE INDEX erc20_tokens_chain_id_idx ON public.erc20_tokens USING btree(chain_id);
CREATE INDEX erc20_tokens_symbol_idx ON public.erc20_tokens USING btree(symbol);
CREATE INDEX erc20_tokens_block_time_idx ON public.erc20_tokens USING btree(block_time DESC);

-- RLS Policies
ALTER TABLE public.erc20_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read erc20_tokens"
    ON public.erc20_tokens
    FOR SELECT
    USING (true);
```

### Table 2: `erc20_token_metadata`

Off-chain enriched metadata from CoinMarketCap and CoinGecko.

```sql
CREATE TABLE public.erc20_token_metadata (
    -- Foreign key to erc20_tokens
    token_address bytea NOT NULL REFERENCES public.erc20_tokens(address) ON DELETE CASCADE,
    chain_id numeric NOT NULL,

    -- External service IDs
    cmc_id integer,
    coingecko_id text,

    -- Descriptive metadata
    logo_url text,
    description text,
    website text,
    twitter text,
    discord text,
    telegram text,

    -- Market data (cached, updated periodically)
    market_cap_usd numeric,
    price_usd numeric,
    volume_24h_usd numeric,
    circulating_supply numeric,
    max_supply numeric,

    -- Metadata tracking
    last_updated timestamp with time zone DEFAULT now() NOT NULL,
    metadata_source text, -- 'cmc', 'coingecko', 'manual'

    -- Timestamps
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,

    PRIMARY KEY (token_address, chain_id)
);

-- Indexes
CREATE INDEX erc20_token_metadata_updated_idx ON public.erc20_token_metadata USING btree(last_updated);
CREATE INDEX erc20_token_metadata_cmc_id_idx ON public.erc20_token_metadata USING btree(cmc_id);
CREATE INDEX erc20_token_metadata_coingecko_id_idx ON public.erc20_token_metadata USING btree(coingecko_id);

-- RLS Policies
ALTER TABLE public.erc20_token_metadata ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read erc20_token_metadata"
    ON public.erc20_token_metadata
    FOR SELECT
    USING (true);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION public.update_erc20_token_metadata_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_erc20_token_metadata_updated_at
    BEFORE UPDATE ON public.erc20_token_metadata
    FOR EACH ROW
    EXECUTE FUNCTION public.update_erc20_token_metadata_updated_at();
```

## Shovel Integration

### Events to Index

Since we want to discover ALL ERC20 tokens (not just a predefined list), we have a few options:

#### Option A: Index ALL Transfer Events (Recommended for Discovery)

Index all ERC20 Transfer events from a specific block number. This will discover tokens as they're used.

**Pros:**
- Discovers tokens organically as they're transferred
- No need to know token addresses upfront
- Captures real usage

**Cons:**
- High volume of events
- Need post-processing to extract token info
- Requires calling contract methods to get name/symbol/decimals

#### Option B: Index Factory Contract Events

If tokens are deployed via known factories (like Uniswap V2/V3 factory), index those creation events.

**Pros:**
- Lower event volume
- Captures tokens at birth
- Know exactly when token was created

**Cons:**
- Only catches tokens from known factories
- Misses tokens deployed directly
- Multiple factories to track

#### Option C: Hybrid Approach (Best for Comprehensive Coverage)

1. Index known factory creation events for major DEXs
2. Index Transfer events from unknown addresses to discover new tokens
3. Use a threshold (e.g., minimum transfer count or volume) to filter noise

### Implementation Plan for Option A (Discovery via Transfers)

**Step 1:** Create a Shovel integration that captures Transfer events without filtering by address.

**Challenge:** Shovel typically requires knowing the contract addresses upfront. For ERC20 discovery, we need to:

1. Monitor Transfer events broadly
2. Track unique token addresses
3. Call the contract to get token metadata

**Practical Approach:**

Since Shovel filters by address, we'll use a **two-phase approach**:

**Phase 1: Token Discovery (External Script)**
- Run a separate script that queries the chain for Transfer events
- Build a list of active ERC20 token addresses
- Call name(), symbol(), decimals() on each contract
- Populate the `erc20_tokens` table

**Phase 2: Ongoing Monitoring (Shovel)**
- Once tokens are discovered, add their addresses to Shovel config
- Index their Transfer events going forward
- Periodically re-run discovery to find new tokens

### Shovel Integration File

**File:** `packages/shovel/src/integrations/erc20-token-transfers.ts`

```typescript
import type { BlockData, Column, Integration, Table } from '@indexsupply/shovel-config'

export const erc20TokenTransfersTable: Table = {
  name: 'erc20_token_transfers',
  columns: [
    { name: 'chain_id', type: 'numeric' },
    { name: 'log_addr', type: 'bytea' }, // token contract address
    { name: 'block_num', type: 'numeric' },
    { name: 'block_time', type: 'numeric' },
    { name: 'tx_hash', type: 'bytea' },
    { name: 'tx_idx', type: 'integer' },
    { name: 'log_idx', type: 'integer' },
    { name: 'f', type: 'bytea' }, // from
    { name: 't', type: 'bytea' }, // to
    { name: 'v', type: 'numeric' }, // value
  ] as Column[],
} as const

export const erc20TokenTransfersIntegration: Omit<Integration, 'sources'> = {
  name: 'erc20_token_transfers',
  enabled: true,
  table: erc20TokenTransfersTable,
  block: [
    {
      name: 'chain_id',
      column: 'chain_id',
    },
    {
      name: 'block_num',
      column: 'block_num',
    },
    {
      name: 'block_time',
      column: 'block_time',
    },
    {
      name: 'tx_hash',
      column: 'tx_hash',
    },
    {
      name: 'tx_idx',
      column: 'tx_idx',
    },
    {
      name: 'log_idx',
      column: 'log_idx',
    },
    {
      name: 'log_addr',
      column: 'log_addr',
      filter_op: 'contains',
      // This will be populated with discovered token addresses
      filter_arg: [], // Start empty, populate via discovery
    },
  ] as BlockData[],
  event: {
    type: 'event',
    name: 'Transfer',
    anonymous: false,
    inputs: [
      {
        indexed: true,
        name: 'from',
        type: 'address',
        column: 'f',
      },
      {
        indexed: true,
        name: 'to',
        type: 'address',
        column: 't',
      },
      {
        indexed: false,
        name: 'value',
        type: 'uint256',
        column: 'v',
      },
    ],
  },
} as const
```

## Token Discovery Service

Since Shovel requires known addresses, we need a separate **Token Discovery Service** to find new ERC20 tokens.

### Discovery Service Requirements

**Technology Options:**
1. **Standalone Node.js/Bun script** - Simple, can be run as a cron job
2. **Part of distributor service** - Leverage existing infrastructure
3. **Serverless function (Vercel Cron)** - Uses existing Next.js infra
4. **Dedicated service** - More robust, can run continuously

**Recommended:** Standalone script in a new package (`packages/erc20-discovery`)

### Discovery Service Logic

```typescript
// Pseudocode for discovery service

async function discoverTokens() {
  // 1. Query recent Transfer events from chain
  const recentBlocks = await getRecentBlocks(1000) // last 1000 blocks
  const transferEvents = await getTransferEvents(recentBlocks)

  // 2. Extract unique token addresses
  const tokenAddresses = new Set(transferEvents.map(e => e.address))

  // 3. For each token, check if already indexed
  for (const address of tokenAddresses) {
    const exists = await db.query(
      'SELECT address FROM erc20_tokens WHERE address = $1',
      [address]
    )

    if (!exists) {
      // 4. Call contract to get metadata
      try {
        const [name, symbol, decimals, totalSupply] = await Promise.all([
          tokenContract.name(),
          tokenContract.symbol(),
          tokenContract.decimals(),
          tokenContract.totalSupply(),
        ])

        // 5. Insert into erc20_tokens table
        await db.query(`
          INSERT INTO erc20_tokens (
            address, chain_id, name, symbol, decimals,
            total_supply, block_num, block_time, tx_hash
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [address, chainId, name, symbol, decimals, totalSupply, ...])

        // 6. Trigger metadata enrichment
        await enrichTokenMetadata(address)
      } catch (error) {
        // Not a valid ERC20 token
        console.log(`Skipping ${address}: not a valid ERC20`)
      }
    }
  }

  // 7. Update Shovel config with new addresses (optional)
  await updateShovelConfig(tokenAddresses)
}

// Run every N minutes
setInterval(discoverTokens, 5 * 60 * 1000) // Every 5 minutes
```

## Metadata Enrichment Service

A separate service that enriches token data with external metadata from CoinMarketCap and CoinGecko.

### Service Architecture Options

Since you're using **Next.js + Vercel**, here are the options:

#### Option 1: Vercel Cron Jobs (Recommended for Simplicity)

**Pros:**
- Uses existing Next.js infrastructure
- Easy to deploy with Vercel
- No additional services to manage
- Built-in monitoring via Vercel

**Cons:**
- Limited execution time (60s for Pro, 300s for Enterprise)
- May hit API rate limits quickly
- Less control over scheduling

**Implementation:**
```typescript
// apps/next/pages/api/cron/enrich-tokens.ts

export default async function handler(req, res) {
  // Verify cron secret
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  // Enrich tokens
  const result = await enrichTokenMetadata()

  return res.status(200).json({ result })
}
```

**Vercel cron config (vercel.json):**
```json
{
  "crons": [
    {
      "path": "/api/cron/enrich-tokens",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

#### Option 2: Standalone Service in `apps/` (Recommended for Scale)

Create a new app in the monorepo: `apps/token-metadata`

**Pros:**
- Independent deployment
- Can run continuously
- Better control over rate limiting
- Can handle long-running jobs
- Can be deployed to any platform (Fly.io, Railway, etc.)

**Cons:**
- Additional service to manage
- Separate deployment pipeline
- More infrastructure complexity

**Implementation:**
```typescript
// apps/token-metadata/src/index.ts

import { createServer } from './server'
import { startMetadataSync } from './sync'

const server = createServer()
server.listen(3001)

// Start background sync process
startMetadataSync({
  interval: 6 * 60 * 60 * 1000, // Every 6 hours
})
```

#### Option 3: Extend Existing Distributor Service

Add token metadata enrichment to `apps/distributor`.

**Pros:**
- Leverages existing service infrastructure
- Already has database access
- No new service to deploy

**Cons:**
- Couples token metadata with distribution logic
- May complicate the distributor service

### Recommended Approach: Hybrid

1. **Initial enrichment:** Vercel cron job (simple, easy to get started)
2. **Scale to:** Standalone service when volume increases or execution time becomes an issue

## Metadata Enrichment Logic

### Data Sources

#### CoinMarketCap API
- Endpoint: `/v1/cryptocurrency/info`
- Data: name, description, logo, website, social links
- Rate Limit: 333 calls/day (Basic), 10k/day (Startup)

#### CoinGecko API
- Endpoint: `/coins/{id}`
- Data: name, symbol, description, market data, links
- Rate Limit: 10-50 calls/min (Free), higher for paid

### Enrichment Strategy

```typescript
async function enrichTokenMetadata(tokenAddress: string) {
  // 1. Check if metadata already exists and is fresh
  const metadata = await db.query(
    'SELECT * FROM erc20_token_metadata WHERE token_address = $1',
    [tokenAddress]
  )

  if (metadata && isRecentlyUpdated(metadata.last_updated)) {
    return // Skip if updated within last 24h
  }

  // 2. Try CoinGecko first (more generous rate limits)
  let enrichedData = await fetchFromCoinGecko(tokenAddress)

  // 3. Fallback to CoinMarketCap
  if (!enrichedData) {
    enrichedData = await fetchFromCoinMarketCap(tokenAddress)
  }

  // 4. Upsert metadata
  if (enrichedData) {
    await db.query(`
      INSERT INTO erc20_token_metadata (
        token_address, cmc_id, coingecko_id, logo_url,
        description, website, twitter, market_cap_usd,
        price_usd, volume_24h_usd, metadata_source, last_updated
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
      ON CONFLICT (token_address, chain_id)
      DO UPDATE SET
        cmc_id = EXCLUDED.cmc_id,
        coingecko_id = EXCLUDED.coingecko_id,
        logo_url = EXCLUDED.logo_url,
        description = EXCLUDED.description,
        website = EXCLUDED.website,
        twitter = EXCLUDED.twitter,
        market_cap_usd = EXCLUDED.market_cap_usd,
        price_usd = EXCLUDED.price_usd,
        volume_24h_usd = EXCLUDED.volume_24h_usd,
        metadata_source = EXCLUDED.metadata_source,
        last_updated = NOW()
    `, [tokenAddress, ...enrichedData])
  }
}

function isRecentlyUpdated(lastUpdated: Date): boolean {
  const ONE_DAY = 24 * 60 * 60 * 1000
  return Date.now() - lastUpdated.getTime() < ONE_DAY
}
```

### Address Matching Strategy

Both CMC and CoinGecko require mapping blockchain addresses to their internal IDs:

1. **CoinGecko:** Use `/coins/list` to get all coins with platform addresses
2. **CoinMarketCap:** Use `/v1/cryptocurrency/map` to get address mappings

**Cache this mapping data** to avoid excessive API calls.

## Implementation Steps

### Phase 1: Database Schema

1. ✅ Create migration for `erc20_tokens` table
2. ✅ Create migration for `erc20_token_metadata` table
3. ✅ Add RLS policies for public read access
4. ✅ Add indexes for performance
5. ✅ Test migrations with `yarn supabase reset`

### Phase 2: Token Discovery

1. ✅ Create `packages/erc20-discovery` package
2. ✅ Implement discovery script to find ERC20 tokens
3. ✅ Add logic to call contract methods (name, symbol, decimals)
4. ✅ Insert discovered tokens into `erc20_tokens` table
5. ✅ Add filtering logic (e.g., min transfer count)
6. ✅ Set up cron job or continuous process

### Phase 3: Shovel Integration

1. ✅ Create `erc20-token-transfers.ts` integration
2. ✅ Initially populate with common Base tokens (USDC, WETH, etc.)
3. ✅ Add discovered tokens to Shovel config dynamically
4. ✅ Update `packages/shovel/src/index.ts` to include new integration
5. ✅ Generate new Shovel config: `yarn shovel:generate`
6. ✅ Test with local Shovel instance

### Phase 4: Metadata Enrichment

1. ✅ Choose architecture (Vercel Cron vs Standalone Service)
2. ✅ Implement CoinGecko API client
3. ✅ Implement CoinMarketCap API client
4. ✅ Create enrichment logic with fallback
5. ✅ Add rate limiting and caching
6. ✅ Set up scheduling (cron or continuous)
7. ✅ Add monitoring and error handling

### Phase 5: API/Frontend Integration

1. ✅ Create Supabase queries for tokens
2. ✅ Add tRPC endpoints or direct Supabase queries
3. ✅ Create frontend components to display tokens
4. ✅ Add search/filter functionality
5. ✅ Display market data and metadata

### Phase 6: Testing & Optimization

1. ✅ Unit tests for discovery logic
2. ✅ Integration tests for metadata enrichment
3. ✅ Performance testing with large token sets
4. ✅ Monitor API rate limits
5. ✅ Optimize database queries
6. ✅ Add monitoring and alerting

## Alternative Approach: Simpler Discovery Method

If broad token discovery is too complex, start with a **curated list approach**:

1. Manually curate a list of popular Base tokens
2. Add their addresses to Shovel config
3. Index transfers for just those tokens
4. Gradually expand the list

**Starter list for Base:**
- USDC: `0x833589fcd6edb6e08f4c7c32d4f71b54bda02913`
- WETH: `0x4200000000000000000000000000000000000006`
- DAI: `0x50c5725949a6f0c72e6c4a641f24049a917db0cb`
- cbETH: `0x2ae3f1ec7f1f5012cfeab0185bfc7aa3cf0dec22`
- USDT: (if available on Base)

This approach is **simpler to start** and can be expanded later.

## Questions to Resolve

1. **Discovery Scope:** Do you want to index ALL ERC20 tokens or just a curated list?
   - **Recommendation:** Start with curated list, expand to discovery later

2. **Metadata Service Architecture:** Vercel Cron or Standalone Service?
   - **Recommendation:** Vercel Cron for MVP, standalone service for scale

3. **Rate Limits:** Do you have paid API plans for CMC/CoinGecko?
   - Affects how many tokens we can enrich per day

4. **Token Filtering:** Should we filter tokens by minimum activity?
   - Prevents indexing spam/scam tokens
   - **Recommendation:** Yes, filter by minimum transfer count (e.g., >100)

5. **Shovel Config Updates:** Should token addresses be dynamically added to Shovel?
   - Or should we manually update the config periodically?
   - **Recommendation:** Start manual, automate later if needed

## Timeline Estimate

| Phase | Estimated Time |
|-------|----------------|
| Phase 1: Database Schema | 2-4 hours |
| Phase 2: Token Discovery | 1-2 days |
| Phase 3: Shovel Integration | 4-6 hours |
| Phase 4: Metadata Enrichment | 1-2 days |
| Phase 5: API/Frontend Integration | 1-2 days |
| Phase 6: Testing & Optimization | 1-2 days |
| **Total** | **5-7 days** |

## Next Steps

1. **Review this plan** and provide feedback
2. **Answer the questions** above to finalize approach
3. **Create database migrations** (Phase 1)
4. **Decide on discovery approach** (curated vs. broad)
5. **Choose metadata service architecture**

Once these decisions are made, we can proceed with implementation.