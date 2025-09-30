# ERC20 Token Indexer - Implementation Plan

## Finalized Decisions

1. ✅ **Discovery Scope:** Index ALL ERC20 tokens
2. ✅ **Metadata Service:** Vercel Cron (Next.js API routes)
3. ✅ **API Plans:** Free tier for CMC/CoinGecko
4. ✅ **Token Prioritization:** Process metadata by activity level (no filtering)
5. ✅ **Discovery Method:** Dynamic discovery service + Shovel for monitoring

## Revised Architecture

Since we need to index ALL ERC20 tokens, we cannot rely on Shovel's address filtering alone. Here's the updated approach:

```
┌─────────────────────────────────────────────┐
│  Base Chain                                 │
└──────────┬──────────────────┬───────────────┘
           │                  │
           ▼                  ▼
    ┌─────────────┐    ┌──────────────┐
    │  Discovery  │    │   Shovel     │
    │   Service   │    │  (Known      │
    │  (New ERC20)│    │   Tokens)    │
    └──────┬──────┘    └──────┬───────┘
           │                  │
           ▼                  ▼
    ┌──────────────────────────────────┐
    │  PostgreSQL / Supabase           │
    │                                  │
    │  erc20_tokens                    │
    │  erc20_token_metadata            │
    │  erc20_token_activity (new)      │
    └──────────────────────────────────┘
           ▲
           │
    ┌──────┴──────────┐
    │  Metadata Cron  │
    │  (Vercel)       │
    │                 │
    │  - CoinGecko    │
    │  - CoinMarketCap│
    └─────────────────┘
```

## Updated Database Schema

### Table 1: `erc20_tokens` (unchanged)

```sql
CREATE TABLE public.erc20_tokens (
    address bytea NOT NULL,
    chain_id numeric NOT NULL,
    name text,
    symbol text,
    decimals smallint,
    total_supply numeric,

    -- Discovery metadata
    block_num numeric NOT NULL,
    block_time numeric NOT NULL,
    tx_hash bytea NOT NULL,

    -- Shovel metadata (nullable, only if indexed by Shovel)
    ig_name text,
    src_name text,
    tx_idx integer,
    log_idx integer,

    created_at timestamp with time zone DEFAULT now() NOT NULL,

    PRIMARY KEY (address, chain_id)
);

CREATE INDEX erc20_tokens_chain_id_idx ON public.erc20_tokens(chain_id);
CREATE INDEX erc20_tokens_symbol_idx ON public.erc20_tokens(symbol);
CREATE INDEX erc20_tokens_block_time_idx ON public.erc20_tokens(block_time DESC);

ALTER TABLE public.erc20_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read erc20_tokens"
    ON public.erc20_tokens FOR SELECT USING (true);
```

### Table 2: `erc20_token_activity` (new for prioritization)

```sql
CREATE TABLE public.erc20_token_activity (
    token_address bytea NOT NULL,
    chain_id numeric NOT NULL,

    -- Activity metrics (last 24h)
    transfer_count_24h integer DEFAULT 0,
    unique_holders_24h integer DEFAULT 0,
    volume_24h numeric DEFAULT 0,

    -- Activity metrics (last 7d)
    transfer_count_7d integer DEFAULT 0,
    unique_holders_7d integer DEFAULT 0,
    volume_7d numeric DEFAULT 0,

    -- Activity metrics (last 30d)
    transfer_count_30d integer DEFAULT 0,
    unique_holders_30d integer DEFAULT 0,
    volume_30d numeric DEFAULT 0,

    -- All-time metrics
    total_transfers integer DEFAULT 0,
    total_unique_holders integer DEFAULT 0,
    total_volume numeric DEFAULT 0,

    -- Prioritization
    priority_score numeric DEFAULT 0, -- Calculated score for metadata enrichment

    -- Timestamps
    last_updated timestamp with time zone DEFAULT now() NOT NULL,

    PRIMARY KEY (token_address, chain_id),
    FOREIGN KEY (token_address, chain_id) REFERENCES public.erc20_tokens(address, chain_id) ON DELETE CASCADE
);

CREATE INDEX erc20_token_activity_priority_idx ON public.erc20_token_activity(priority_score DESC);
CREATE INDEX erc20_token_activity_updated_idx ON public.erc20_token_activity(last_updated);

ALTER TABLE public.erc20_token_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read erc20_token_activity"
    ON public.erc20_token_activity FOR SELECT USING (true);

-- Function to calculate priority score
CREATE OR REPLACE FUNCTION public.calculate_token_priority_score(
    transfers_24h integer,
    holders_24h integer,
    volume_24h numeric,
    transfers_7d integer,
    holders_7d integer,
    volume_7d numeric
) RETURNS numeric AS $$
BEGIN
    -- Weighted formula: recent activity matters more
    RETURN (
        (transfers_24h * 10) +
        (holders_24h * 5) +
        (COALESCE(volume_24h, 0) / 1e18) + -- Normalize volume
        (transfers_7d * 2) +
        (holders_7d * 1)
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger to update priority score
CREATE OR REPLACE FUNCTION public.update_token_priority_score()
RETURNS TRIGGER AS $$
BEGIN
    NEW.priority_score = public.calculate_token_priority_score(
        NEW.transfer_count_24h,
        NEW.unique_holders_24h,
        NEW.volume_24h,
        NEW.transfer_count_7d,
        NEW.unique_holders_7d,
        NEW.volume_7d
    );
    NEW.last_updated = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_token_priority_score_trigger
    BEFORE INSERT OR UPDATE ON public.erc20_token_activity
    FOR EACH ROW
    EXECUTE FUNCTION public.update_token_priority_score();
```

### Table 3: `erc20_token_metadata` (updated)

```sql
CREATE TABLE public.erc20_token_metadata (
    token_address bytea NOT NULL,
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

    -- Market data (cached)
    market_cap_usd numeric,
    price_usd numeric,
    volume_24h_usd numeric,
    circulating_supply numeric,
    max_supply numeric,

    -- Enrichment tracking
    enrichment_attempts integer DEFAULT 0, -- Track failed attempts
    last_enrichment_attempt timestamp with time zone,
    last_successful_enrichment timestamp with time zone,
    metadata_source text, -- 'coingecko', 'cmc', 'manual', null

    -- Timestamps
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,

    PRIMARY KEY (token_address, chain_id),
    FOREIGN KEY (token_address, chain_id) REFERENCES public.erc20_tokens(address, chain_id) ON DELETE CASCADE
);

CREATE INDEX erc20_token_metadata_enrichment_idx ON public.erc20_token_metadata(last_successful_enrichment NULLS FIRST);
CREATE INDEX erc20_token_metadata_attempts_idx ON public.erc20_token_metadata(enrichment_attempts);
CREATE INDEX erc20_token_metadata_cmc_id_idx ON public.erc20_token_metadata(cmc_id);
CREATE INDEX erc20_token_metadata_coingecko_id_idx ON public.erc20_token_metadata(coingecko_id);

ALTER TABLE public.erc20_token_metadata ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read erc20_token_metadata"
    ON public.erc20_token_metadata FOR SELECT USING (true);
```

## Implementation Components

### 1. Token Discovery Service

**Package:** `packages/erc20-discovery`

This service discovers new ERC20 tokens by monitoring Transfer events on-chain.

#### Approach: Log Scraping

Since Shovel requires known addresses, we'll use a separate discovery service that:
1. Queries recent blocks for Transfer events
2. Identifies unique token addresses
3. Calls contract methods to get token metadata
4. Inserts into `erc20_tokens` table

#### Key Files:

```
packages/erc20-discovery/
├── package.json
├── src/
│   ├── index.ts              # Main entry point
│   ├── discovery.ts          # Discovery logic
│   ├── contract-reader.ts    # Read ERC20 metadata from contracts
│   ├── db.ts                 # Database operations
│   └── types.ts              # TypeScript types
└── tsconfig.json
```

#### Discovery Logic (Pseudocode)

```typescript
// packages/erc20-discovery/src/discovery.ts

import { createPublicClient, http } from 'viem'
import { base } from 'viem/chains'

const TRANSFER_EVENT_SIGNATURE = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'

async function discoverTokens(fromBlock: bigint, toBlock: bigint) {
  const client = createPublicClient({
    chain: base,
    transport: http(process.env.BASE_RPC_URL)
  })

  // 1. Get all Transfer events in block range
  const logs = await client.getLogs({
    fromBlock,
    toBlock,
    topics: [TRANSFER_EVENT_SIGNATURE], // Transfer event
  })

  // 2. Extract unique token addresses
  const tokenAddresses = new Set<string>()
  for (const log of logs) {
    tokenAddresses.add(log.address)
  }

  console.log(`Found ${tokenAddresses.size} unique token addresses`)

  // 3. Process each token
  for (const address of tokenAddresses) {
    await processToken(address, client)
  }
}

async function processToken(address: string, client: PublicClient) {
  // Check if already exists
  const exists = await db.query(
    'SELECT address FROM erc20_tokens WHERE address = $1 AND chain_id = $2',
    [hexToBytes(address), base.id]
  )

  if (exists.rows.length > 0) {
    return // Already indexed
  }

  try {
    // Read token metadata from contract
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
    `, [
      hexToBytes(address),
      base.id,
      name,
      symbol,
      decimals,
      totalSupply,
      // block data from first transfer log
    ])

    // Initialize activity tracking
    await db.query(`
      INSERT INTO erc20_token_activity (token_address, chain_id)
      VALUES ($1, $2)
      ON CONFLICT (token_address, chain_id) DO NOTHING
    `, [hexToBytes(address), base.id])

    console.log(`✅ Discovered token: ${symbol} (${address})`)
  } catch (error) {
    console.error(`❌ Failed to process ${address}:`, error.message)
    // Not a valid ERC20 token or missing methods
  }
}
```

#### Contract Reader

```typescript
// packages/erc20-discovery/src/contract-reader.ts

import { PublicClient } from 'viem'

const ERC20_ABI = [
  { name: 'name', outputs: [{ type: 'string' }], stateMutability: 'view', type: 'function' },
  { name: 'symbol', outputs: [{ type: 'string' }], stateMutability: 'view', type: 'function' },
  { name: 'decimals', outputs: [{ type: 'uint8' }], stateMutability: 'view', type: 'function' },
  { name: 'totalSupply', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
] as const

export async function readErc20Name(client: PublicClient, address: string): Promise<string> {
  try {
    const result = await client.readContract({
      address: address as `0x${string}`,
      abi: ERC20_ABI,
      functionName: 'name',
    })
    return result as string
  } catch {
    return 'Unknown'
  }
}

export async function readErc20Symbol(client: PublicClient, address: string): Promise<string> {
  try {
    const result = await client.readContract({
      address: address as `0x${string}`,
      abi: ERC20_ABI,
      functionName: 'symbol',
    })
    return result as string
  } catch {
    return 'UNKNOWN'
  }
}

export async function readErc20Decimals(client: PublicClient, address: string): Promise<number> {
  try {
    const result = await client.readContract({
      address: address as `0x${string}`,
      abi: ERC20_ABI,
      functionName: 'decimals',
    })
    return result as number
  } catch {
    return 18 // Default to 18 decimals
  }
}

export async function readErc20TotalSupply(client: PublicClient, address: string): Promise<bigint> {
  try {
    const result = await client.readContract({
      address: address as `0x${string}`,
      abi: ERC20_ABI,
      functionName: 'totalSupply',
    })
    return result as bigint
  } catch {
    return 0n
  }
}
```

#### Running the Discovery Service

**Option 1: Continuous Service**
```typescript
// packages/erc20-discovery/src/index.ts

import { discoverTokens } from './discovery'

const POLL_INTERVAL = 5 * 60 * 1000 // 5 minutes
const BLOCKS_PER_BATCH = 1000

async function main() {
  let currentBlock = await getCurrentBlock()

  while (true) {
    try {
      const latestBlock = await getLatestBlock()

      if (latestBlock > currentBlock) {
        const toBlock = Math.min(currentBlock + BLOCKS_PER_BATCH, latestBlock)

        await discoverTokens(currentBlock, toBlock)

        currentBlock = toBlock + 1
      }

      await sleep(POLL_INTERVAL)
    } catch (error) {
      console.error('Discovery error:', error)
      await sleep(POLL_INTERVAL)
    }
  }
}

main()
```

**Option 2: Vercel Cron (Recommended)**
```typescript
// apps/next/pages/api/cron/discover-tokens.ts

export default async function handler(req, res) {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const fromBlock = await getLastProcessedBlock()
  const toBlock = await getLatestBlock()

  const discovered = await discoverTokens(fromBlock, toBlock)

  return res.json({
    discovered: discovered.length,
    fromBlock,
    toBlock
  })
}
```

### 2. Activity Tracking Service

**Package:** `packages/erc20-activity` or integrate into discovery service

This service calculates activity metrics for prioritization.

```typescript
// Calculate activity metrics from Transfer events

async function updateActivityMetrics(tokenAddress: string) {
  const now = Date.now()
  const day_ago = now - 24 * 60 * 60 * 1000
  const week_ago = now - 7 * 24 * 60 * 60 * 1000
  const month_ago = now - 30 * 24 * 60 * 60 * 1000

  // Query transfer events (from Shovel data or direct chain query)
  const metrics24h = await calculateMetrics(tokenAddress, day_ago)
  const metrics7d = await calculateMetrics(tokenAddress, week_ago)
  const metrics30d = await calculateMetrics(tokenAddress, month_ago)

  // Update activity table
  await db.query(`
    INSERT INTO erc20_token_activity (
      token_address, chain_id,
      transfer_count_24h, unique_holders_24h, volume_24h,
      transfer_count_7d, unique_holders_7d, volume_7d,
      transfer_count_30d, unique_holders_30d, volume_30d
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    ON CONFLICT (token_address, chain_id) DO UPDATE SET
      transfer_count_24h = EXCLUDED.transfer_count_24h,
      unique_holders_24h = EXCLUDED.unique_holders_24h,
      volume_24h = EXCLUDED.volume_24h,
      transfer_count_7d = EXCLUDED.transfer_count_7d,
      unique_holders_7d = EXCLUDED.unique_holders_7d,
      volume_7d = EXCLUDED.volume_7d,
      transfer_count_30d = EXCLUDED.transfer_count_30d,
      unique_holders_30d = EXCLUDED.unique_holders_30d,
      volume_30d = EXCLUDED.volume_30d
  `, [...])
}
```

### 3. Metadata Enrichment Service (Vercel Cron)

**Location:** `apps/next/pages/api/cron/enrich-token-metadata.ts`

This cron job enriches token metadata from CoinGecko and CoinMarketCap, prioritized by activity.

```typescript
// apps/next/pages/api/cron/enrich-token-metadata.ts

import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const BATCH_SIZE = 50 // Process 50 tokens per run
const COINGECKO_RATE_LIMIT = 10 // calls per minute (free tier)
const CMC_DAILY_LIMIT = 333 // calls per day (free tier)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Get tokens that need enrichment, ordered by priority
  const { data: tokens } = await supabase
    .from('erc20_tokens')
    .select(`
      address,
      chain_id,
      symbol,
      erc20_token_activity(priority_score),
      erc20_token_metadata(
        last_successful_enrichment,
        enrichment_attempts
      )
    `)
    .order('erc20_token_activity.priority_score', { ascending: false })
    .or('erc20_token_metadata.last_successful_enrichment.is.null,erc20_token_metadata.last_successful_enrichment.lt.now() - interval \'7 days\'')
    .limit(BATCH_SIZE)

  const enriched = []
  const failed = []

  for (const token of tokens || []) {
    try {
      const metadata = await enrichTokenFromAPIs(token)

      if (metadata) {
        await supabase
          .from('erc20_token_metadata')
          .upsert({
            token_address: token.address,
            chain_id: token.chain_id,
            ...metadata,
            last_successful_enrichment: new Date().toISOString(),
            enrichment_attempts: 0,
          })

        enriched.push(token.address)
      } else {
        // Track failed attempt
        await supabase
          .from('erc20_token_metadata')
          .upsert({
            token_address: token.address,
            chain_id: token.chain_id,
            last_enrichment_attempt: new Date().toISOString(),
            enrichment_attempts: (token.erc20_token_metadata?.enrichment_attempts || 0) + 1,
          })

        failed.push(token.address)
      }

      // Rate limiting: wait between API calls
      await sleep(6000) // 6 seconds = 10 calls/min
    } catch (error) {
      console.error(`Failed to enrich ${token.address}:`, error)
      failed.push(token.address)
    }
  }

  return res.json({
    processed: tokens?.length || 0,
    enriched: enriched.length,
    failed: failed.length,
  })
}

async function enrichTokenFromAPIs(token: any) {
  // Try CoinGecko first (better rate limits)
  let metadata = await fetchFromCoinGecko(token)

  if (!metadata) {
    // Fallback to CoinMarketCap
    metadata = await fetchFromCoinMarketCap(token)
  }

  return metadata
}

async function fetchFromCoinGecko(token: any) {
  // Implementation for CoinGecko API
  // Need to map address to coingecko_id first
  return null
}

async function fetchFromCoinMarketCap(token: any) {
  // Implementation for CMC API
  // Need to map address to cmc_id first
  return null
}
```

#### Vercel Cron Configuration

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/discover-tokens",
      "schedule": "*/10 * * * *"
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

## Rate Limiting Strategy

### CoinGecko (Free Tier)
- **Limit:** 10-50 calls/minute
- **Strategy:**
  - 6 second delay between calls = 10 calls/min
  - Process 50 tokens per run
  - Run every 6 hours
  - **Total:** ~200 tokens/day

### CoinMarketCap (Free Tier)
- **Limit:** 333 calls/day
- **Strategy:**
  - Use as fallback only
  - Reserve for tokens not found on CoinGecko
  - ~50-100 tokens/day

### Combined Capacity
- **~250-300 tokens enriched per day**
- Prioritized by activity score
- High-activity tokens enriched within hours
- Low-activity tokens may take weeks/months

## Implementation Phases

### Phase 1: Database Schema ✅
- [ ] Create migration for `erc20_tokens`
- [ ] Create migration for `erc20_token_activity`
- [ ] Create migration for `erc20_token_metadata`
- [ ] Test migrations locally

### Phase 2: Token Discovery
- [ ] Create `packages/erc20-discovery` package
- [ ] Implement log scraping logic
- [ ] Implement contract reader (name, symbol, decimals, totalSupply)
- [ ] Create Vercel cron endpoint `/api/cron/discover-tokens`
- [ ] Test discovery with recent blocks
- [ ] Deploy and monitor

### Phase 3: Activity Tracking
- [ ] Implement activity calculation logic
- [ ] Create Vercel cron endpoint `/api/cron/update-token-activity`
- [ ] Test priority scoring algorithm
- [ ] Deploy and monitor

### Phase 4: Metadata Enrichment
- [ ] Implement CoinGecko API client
- [ ] Implement CoinMarketCap API client
- [ ] Create address-to-ID mapping cache
- [ ] Create Vercel cron endpoint `/api/cron/enrich-token-metadata`
- [ ] Implement rate limiting
- [ ] Test with sample tokens
- [ ] Deploy and monitor

### Phase 5: Integration & UI
- [ ] Create Supabase queries/views for token lists
- [ ] Add tRPC endpoints for token data
- [ ] Create UI components to display tokens
- [ ] Add search/filter functionality
- [ ] Display metadata and market data
- [ ] Test end-to-end

### Phase 6: Monitoring & Optimization
- [ ] Add logging and error tracking
- [ ] Monitor API rate limits
- [ ] Optimize database queries
- [ ] Add caching where appropriate
- [ ] Set up alerts for failures

## Timeline Estimate

| Phase | Estimated Time |
|-------|----------------|
| Phase 1: Database Schema | 4-6 hours |
| Phase 2: Token Discovery | 1-2 days |
| Phase 3: Activity Tracking | 1 day |
| Phase 4: Metadata Enrichment | 2 days |
| Phase 5: Integration & UI | 2 days |
| Phase 6: Monitoring | 1 day |
| **Total** | **7-9 days** |

## Next Steps

1. Review this implementation plan
2. Start with Phase 1: Create database migrations
3. Set up `packages/erc20-discovery` package structure
4. Implement and test token discovery locally
5. Create Vercel cron endpoints
6. Test end-to-end with a small set of tokens