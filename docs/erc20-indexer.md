# ERC20 Token Indexer - Complete System

## Overview

A complete ERC20 token indexing system for Send app that automatically discovers, tracks, and enriches tokens used by Send addresses. The system uses Shovel for on-chain data ingestion, database triggers for automatic discovery and balance tracking, and Kubernetes workers for metadata enrichment from CoinGecko.

**Key Features:**
- ✅ Automatic token discovery from Send user transfers
- ✅ Real-time balance tracking via database triggers
- ✅ Hybrid balance system: fast DB queries + RPC reconciliation
- ✅ Handles rebasing tokens and missed transactions via reconciliation worker
- ✅ Metadata enrichment (logos, prices, descriptions) from CoinGecko
- ✅ Database-driven token icons (no hardcoded SVGs)
- ✅ Scalable to any number of tokens
- ✅ Privacy-friendly (only indexes opted-in users)

## Architecture

```
┌─────────────────────────────────────────────────────┐
│  Shovel: send_account_transfers                     │
│  (Indexes ALL ERC20 transfers, filtered by Send     │
│   addresses at database layer via BEFORE trigger)   │
└──────────────────┬──────────────────────────────────┘
                   │
                   │ INSERT
                   ▼
┌─────────────────────────────────────────────────────┐
│  Trigger 1: discover_token_from_transfer()          │
│  (Inserts new tokens into erc20_tokens)             │
└─────────────────────────────────────────────────────┘
                   │
┌─────────────────────────────────────────────────────┐
│  Trigger 2: update_erc20_balances_from_transfer()   │
│  (Updates erc20_balances: sender -v, receiver +v)   │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│  PostgreSQL / Supabase                              │
│  • erc20_tokens (discovered tokens)                 │
│  • erc20_token_metadata (enriched data)             │
│  • erc20_balances (auto-updated via trigger)        │
│  • erc20_balance_reconciliations (drift tracking)   │
└──────────────────┬──────────────────────────────────┘
                   │
           ┌───────┴────────┐
           │                │
           ▼                ▼
┌──────────────────┐  ┌─────────────────────────────┐
│  Token           │  │  Balance Reconciliation     │
│  Enrichment      │  │  Worker (K8s)               │
│  Worker (K8s)    │  │                             │
│  (Every 10 min)  │  │  Every 60s (configurable):  │
│                  │  │  1. Query balances to       │
│  1. Get tokens   │  │     reconcile (prioritized) │
│  2. Read contract│  │  2. Fetch RPC balance       │
│  3. CoinGecko    │  │  3. Compare with DB         │
│  4. Update DB    │  │  4. Reconcile any drift     │
└──────────────────┘  └─────────────────────────────┘
```

## Database Schema

### Table 1: `erc20_tokens`

Core on-chain token data discovered from Send user transfers.

```sql
CREATE TABLE erc20_tokens (
    address bytea NOT NULL,
    chain_id numeric NOT NULL,
    name text,                    -- Enriched by cron
    symbol text,                  -- Enriched by cron
    decimals smallint,            -- Enriched by cron
    total_supply numeric,         -- Enriched by cron
    block_num numeric NOT NULL,   -- Discovery block
    block_time numeric NOT NULL,  -- Discovery time
    tx_hash bytea NOT NULL,       -- Discovery tx
    PRIMARY KEY (address, chain_id)
);
```

**RLS Policy:** Public read access

### Table 2: `erc20_token_metadata`

Off-chain enriched data from CoinGecko/CoinMarketCap.

```sql
CREATE TABLE erc20_token_metadata (
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
    telegram text,
    -- Market data
    market_cap_usd numeric,
    price_usd numeric,
    volume_24h_usd numeric,
    circulating_supply numeric,
    max_supply numeric,
    -- Enrichment tracking
    enrichment_attempts integer DEFAULT 0,
    last_enrichment_attempt timestamp with time zone,
    last_successful_enrichment timestamp with time zone,
    metadata_source text,  -- 'coingecko', 'cmc', 'manual'
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (token_address, chain_id),
    FOREIGN KEY (token_address, chain_id)
        REFERENCES erc20_tokens(address, chain_id) ON DELETE CASCADE
);
```

**RLS Policy:** Public read access

### Table 3: `erc20_balances`

Materialized view of current token balances for Send addresses.

```sql
CREATE TABLE erc20_balances (
    send_account_address bytea NOT NULL,
    chain_id numeric NOT NULL,
    token_address bytea NOT NULL,
    balance numeric NOT NULL DEFAULT 0,
    last_updated_block numeric NOT NULL,
    last_updated_time timestamp with time zone NOT NULL,
    PRIMARY KEY (send_account_address, chain_id, token_address),
    FOREIGN KEY (token_address, chain_id)
        REFERENCES erc20_tokens(address, chain_id) ON DELETE CASCADE
);
```

**RLS Policy:** Users can only see their own balances

**Historical Balances:** Not stored separately. Can be derived from `send_account_transfers` when needed:
```sql
-- Balance at specific timestamp
SELECT
  SUM(CASE WHEN t = :address THEN v ELSE 0 END) -
  SUM(CASE WHEN f = :address THEN v ELSE 0 END) as balance
FROM send_account_transfers
WHERE log_addr = :token_address
  AND (f = :address OR t = :address)
  AND block_time <= :timestamp
```

## Automatic Discovery

### Trigger: Token Discovery from Transfers

Automatically discovers new tokens when Send users interact with them:

```sql
CREATE FUNCTION discover_token_from_transfer() RETURNS TRIGGER AS $$
BEGIN
  -- Check if token already exists
  IF NOT EXISTS (
    SELECT 1 FROM erc20_tokens
    WHERE address = NEW.log_addr AND chain_id = NEW.chain_id
  ) THEN
    -- Insert token (name/symbol/decimals will be NULL until enriched)
    INSERT INTO erc20_tokens (
      address, chain_id, block_num, block_time, tx_hash
    ) VALUES (
      NEW.log_addr, NEW.chain_id, NEW.block_num, NEW.block_time, NEW.tx_hash
    ) ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_discover_token_from_transfer
  AFTER INSERT ON send_account_transfers
  FOR EACH ROW
  EXECUTE FUNCTION discover_token_from_transfer();
```

**Key Points:**
- Triggers on every new transfer in `send_account_transfers`
- Only creates placeholder records (metadata enriched later by cron)
- Automatically tracks all tokens Send users touch
- No manual token addition needed

### Helper Functions

```sql
-- Get tokens needing enrichment (NULL name/symbol/decimals)
-- Prioritized by: total balance → holder count → newest
-- Uses erc20_balances table (discovered tokens already being tracked)
CREATE FUNCTION get_tokens_needing_enrichment(limit_count integer)
RETURNS TABLE(token_address bytea, chain_id numeric, block_time numeric);

-- Get undiscovered tokens from historical transfers
-- Prioritized by: implied balance → unique addresses → transfer count → newest
-- Uses send_account_transfers (undiscovered tokens don't have balance records yet)
CREATE FUNCTION get_undiscovered_tokens(limit_count integer)
RETURNS TABLE(token_address bytea, chain_id numeric);
```

## Automatic Balance Tracking

### Trigger: Real-time Balance Updates

Updates balances automatically when transfers are indexed:

```sql
CREATE FUNCTION update_erc20_balances_from_transfer() RETURNS TRIGGER AS $$
BEGIN
  -- Decrease sender balance
  INSERT INTO erc20_balances (
    send_account_address, chain_id, token_address,
    balance, last_updated_block, last_updated_time
  ) VALUES (
    NEW.f, NEW.chain_id, NEW.log_addr,
    -NEW.v, NEW.block_num, to_timestamp(NEW.block_time)
  )
  ON CONFLICT (send_account_address, chain_id, token_address)
  DO UPDATE SET
    balance = erc20_balances.balance - NEW.v,
    last_updated_block = GREATEST(erc20_balances.last_updated_block, NEW.block_num),
    last_updated_time = to_timestamp(NEW.block_time);

  -- Increase receiver balance
  INSERT INTO erc20_balances (
    send_account_address, chain_id, token_address,
    balance, last_updated_block, last_updated_time
  ) VALUES (
    NEW.t, NEW.chain_id, NEW.log_addr,
    NEW.v, NEW.block_num, to_timestamp(NEW.block_time)
  )
  ON CONFLICT (send_account_address, chain_id, token_address)
  DO UPDATE SET
    balance = erc20_balances.balance + NEW.v,
    last_updated_block = GREATEST(erc20_balances.last_updated_block, NEW.block_num),
    last_updated_time = to_timestamp(NEW.block_time);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_balances_from_transfer
  AFTER INSERT ON send_account_transfers
  FOR EACH ROW
  EXECUTE FUNCTION update_erc20_balances_from_transfer();
```

### Bootstrap Function

Calculates balances from all historical transfers (run once at deployment):

```sql
CREATE FUNCTION recalculate_erc20_balances(
  p_send_account_address bytea DEFAULT NULL,
  p_token_address bytea DEFAULT NULL,
  p_chain_id numeric DEFAULT NULL
) RETURNS TABLE(processed_count bigint);

-- Usage: Populate from historical data
SELECT * FROM recalculate_erc20_balances();
```

**Performance:** ~5-10 minutes for full bootstrap, ~100ms per user for incremental.

## Balance Reconciliation System

### Problem: Limitations of Transfer-Based Accounting

While calculating balances from transfers is fast and accurate for most tokens, it has critical limitations:

1. **Rebasing tokens** (stETH, aUSDC, etc.) change balances without emitting transfer events
2. **Missed transactions** create permanent drift if the indexer skips blocks or drops transfers
3. **RPC polling is too slow** for real-time UI (200-500ms per query)

### Solution: Hybrid Balance System

The reconciliation system provides the best of both worlds:
- **Primary**: Fast DB-driven balances for UI (<10ms queries, updated from transfers)
- **Secondary**: Periodic RPC checks to detect and correct drift

### New Schema

#### Table 4: `erc20_balance_reconciliations`

Track all balance corrections and their reasons:

```sql
CREATE TABLE erc20_balance_reconciliations (
    id bigserial PRIMARY KEY,
    send_account_address bytea NOT NULL,
    chain_id numeric NOT NULL,
    token_address bytea NOT NULL,
    -- What was wrong
    drift_amount numeric NOT NULL, -- positive = DB was too low
    db_balance_before numeric NOT NULL,
    rpc_balance numeric NOT NULL,
    -- Why it happened
    reconciliation_reason text, -- 'rebasing', 'missed_transfer', 'indexing_lag', 'unknown'
    -- When it was fixed
    reconciled_at timestamp with time zone NOT NULL DEFAULT now(),
    reconciled_block numeric NOT NULL
);
```

#### Updated: `erc20_tokens`

Added `is_rebasing` flag to prioritize reconciliation for rebasing tokens:

```sql
ALTER TABLE erc20_tokens ADD COLUMN is_rebasing boolean DEFAULT false;

-- Mark known rebasing tokens
UPDATE erc20_tokens SET is_rebasing = true
WHERE address IN ('\x...stETH...', '\x...aUSDC...');
```

### Reconciliation Worker

**Location:** `apps/balance-reconciliation-worker/`

Async worker service that continuously reconciles balances between DB and RPC.

#### How It Works

```
Every 60 seconds (configurable):

1. Query get_balances_to_reconcile(limit: 100)
   - Prioritized by:
     a. Rebasing tokens (most frequent drift)
     b. High USD value balances (most important)
     c. Recent activity (likely to change)
     d. Stale snapshots (longest since last check)

2. For each balance:
   - Get indexer's last processed block (N)
   - Reconcile at block N-1 (ensures indexer finished that block)
   - Fetch actual balance from RPC at block N-1
   - Compare with DB calculated balance

3. If drift detected (any amount):
   - Determine reason (rebasing, missed_transfer, unknown)
   - Store reconciliation record
   - Apply adjustment to erc20_balances
```

**N-1 Block Lag Strategy**: If last indexed transfer is at block 1000, reconcile at block 999. This prevents race conditions where the indexer is still processing multiple transfers for block 1000.

#### Configuration

```bash
# Required
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
RECONCILIATION_RPC_URL=https://mainnet.base.org

# Optional (defaults shown)
RECONCILIATION_BATCH_SIZE=100              # Balances per loop
RECONCILIATION_RATE_LIMIT_MS=100           # RPC call delay
RECONCILIATION_POLL_INTERVAL_MS=60000      # Loop interval (60s)
```

#### Running the Worker

```bash
# Local development
yarn workspace balance-reconciliation-worker dev

# Docker
docker build -t balance-reconciliation-worker apps/balance-reconciliation-worker
docker run --env-file .env balance-reconciliation-worker

# Kubernetes (see apps/balance-reconciliation-worker/README.md)
```

### Reconciliation Functions

```sql
-- Get balances needing reconciliation (prioritized)
CREATE FUNCTION get_balances_to_reconcile(p_limit integer DEFAULT 100);

-- Store reconciliation record
CREATE FUNCTION store_reconciliation(
    p_send_account_address bytea,
    p_chain_id numeric,
    p_token_address bytea,
    p_drift_amount numeric,
    p_db_balance_before numeric,
    p_rpc_balance numeric,
    p_reconciliation_reason text,
    p_reconciled_block numeric
);

-- Apply balance correction
CREATE FUNCTION apply_balance_reconciliation(
    p_send_account_address bytea,
    p_chain_id numeric,
    p_token_address bytea,
    p_adjustment numeric,
    p_block_num numeric
);
```

### Monitoring Reconciliation

```sql
-- View recent reconciliations
SELECT
    concat('0x', encode(send_account_address, 'hex')) as address,
    concat('0x', encode(token_address, 'hex')) as token,
    drift_amount / power(10, 18) as drift_tokens,
    reconciliation_reason,
    reconciled_at
FROM erc20_balance_reconciliations
ORDER BY reconciled_at DESC
LIMIT 50;

-- Check drift frequency per token
SELECT
    concat('0x', encode(token_address, 'hex')) as token,
    COUNT(*) as reconciliation_count,
    AVG(ABS(drift_amount)) as avg_drift,
    reconciliation_reason
FROM erc20_balance_reconciliations
WHERE reconciled_at > now() - interval '7 days'
GROUP BY token_address, reconciliation_reason
ORDER BY reconciliation_count DESC;

-- Check reconciliation coverage
SELECT
    COUNT(DISTINCT (send_account_address, chain_id, token_address)) as unique_balances_checked,
    COUNT(*) as total_reconciliations,
    MAX(reconciled_at) as latest_reconciliation
FROM erc20_balance_reconciliations
WHERE reconciled_at > now() - interval '1 hour';
```

### Benefits

✅ **Real-time UI**: DB balances update instantly from transfers (<10ms queries)
✅ **Accuracy**: RPC checks catch rebasing tokens + missed transactions
✅ **Scalability**: Worker processes balances in priority order
✅ **Reconciliation**: Auto-fixes any drift detected
✅ **Async**: Slow RPC calls don't block UI
✅ **Auditability**: All corrections logged with reasons

## Metadata Enrichment

### Token Enrichment Worker

**Location:** `apps/token-enrichment-worker/`

Kubernetes worker service that continuously enriches ERC20 token metadata from both on-chain contracts and off-chain data sources (CoinGecko).

**Schedule:** Every 10 minutes (configurable)

**Process:**
1. Query `get_tokens_needing_enrichment()` → 30 tokens per batch
   - **Prioritized by user balances:** Tokens with highest total balances enriched first
   - Then by holder count (most popular tokens)
   - Then by newest tokens
2. For each token:
   - Read contract: `name()`, `symbol()`, `decimals()`, `totalSupply()`
   - Fetch CoinGecko: logo, description, price, market data
   - Update `erc20_tokens` with on-chain data
   - Upsert `erc20_token_metadata` with off-chain data
3. Rate limit: 1.5s between tokens (respects CoinGecko free tier)

**Rate:** ~180 tokens/hour enriched (configurable based on API tier)

**Environment Variables:**
- `TOKEN_ENRICHMENT_RPC_URL` (required) - RPC endpoint for contract calls
- `COINGECKO_API_KEY` (optional) - Pro API key for higher rate limits
- `TOKEN_ENRICHMENT_BATCH_SIZE` (default: 30) - Tokens per loop
- `TOKEN_ENRICHMENT_RATE_LIMIT_MS` (default: 1500) - Delay between tokens
- `TOKEN_ENRICHMENT_POLL_INTERVAL_MS` (default: 600000) - Loop interval (10 min)

See [apps/token-enrichment-worker/README.md](../apps/token-enrichment-worker/README.md) for full details.

### CoinGecko Integration

```typescript
async function fetchCoinGeckoMetadata(address: string, chainId: number) {
  const platform = chainId === 8453 ? 'base' : null
  if (!platform) return null

  const apiKey = process.env.COINGECKO_API_KEY
  const url = apiKey
    ? `https://pro-api.coingecko.com/api/v3/coins/${platform}/contract/${address}`
    : `https://api.coingecko.com/api/v3/coins/${platform}/contract/${address}`

  const response = await fetch(url, {
    headers: apiKey ? { 'x-cg-pro-api-key': apiKey } : {}
  })

  return response.ok ? await response.json() : null
}
```

**Data Fetched:**
- Logo URL (large or small image)
- Description
- Website, Twitter, Telegram links
- Current price in USD
- Market cap, 24h volume
- Circulating supply, max supply
- CoinGecko ID for future lookups


## Frontend Integration

### Database-Driven Token Icons

**File:** `packages/app/components/icons/IconCoin.tsx`

Replaced all hardcoded SVG icons with database-driven logo fetching:

```tsx
import { IconCoin } from 'app/components/icons/IconCoin'

// Fetch logo from database by token address
<IconCoin tokenAddress="0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" />

// Or provide logo URL directly (skips database fetch)
<IconCoin logoUrl="https://example.com/token-logo.png" />

// Falls back to generic Coins icon if no logo found
```

**How it works:**
1. Component receives `tokenAddress` prop
2. Queries `erc20_token_metadata` table for `logo_url`
3. Renders image from URL or falls back to generic icon
4. Results cached for 1 hour via TanStack Query

**Benefits:**
- New tokens automatically display their logos
- No manual icon creation needed
- Logos stay up-to-date with CoinGecko data
- Consistent display across web and native platforms

### Updated Balance Hook

**File:** `packages/app/utils/useSendAccountBalances.ts`

Replaced RPC polling with database queries:

```tsx
export const useSendAccountBalances = () => {
  const { data: sendAccount } = useSendAccount()
  const supabase = useSupabase()

  // Query ERC20 balances from database
  const dbBalancesQuery = useQuery({
    queryKey: ['erc20-balances', sendAccount?.address, baseMainnet.id],
    queryFn: async () => {
      const addressBytes = sendAccount.address.toLowerCase().slice(2)

      const { data } = await supabase
        .from('erc20_balances')
        .select(`
          token_address,
          balance,
          last_updated_time,
          erc20_tokens!inner(name, symbol, decimals)
        `)
        .eq('send_account_address', `\\x${addressBytes}`)
        .eq('chain_id', baseMainnet.id)
        .gt('balance', '0')

      return data
    },
    staleTime: 30 * 1000, // Cache 30s (vs 10s RPC polling)
  })

  // Still fetch ETH balance from RPC (not an ERC20)
  const ethQuery = useBalance({
    address: sendAccount?.address,
    chainId: baseMainnet.id,
  })

  // ... convert to balances object
}
```

**Performance Comparison:**

| Aspect | RPC (Before) | Database (After) |
|--------|--------------|------------------|
| Query Time | 200-500ms | <10ms |
| Polling | Every 10s | Every 30s |
| Tokens | Hardcoded list | All tokens user owns |
| Scalability | Poor | Excellent |
| Cost | High (RPC provider) | Low (DB storage) |

## Deployment Steps

### 1. Run Migrations

```bash
cd supabase
yarn supabase db push
```

Four migrations will be applied:
1. `20250930011614_create_erc20_tokens_tables.sql`
2. `20250930015920_add_erc20_token_discovery_trigger.sql`
3. `20250930033959_add_erc20_balance_tracking.sql`
4. `20251001000000_add_balance_reconciliation.sql`

### 2. Set Environment Variables

For Kubernetes workers:
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `TOKEN_ENRICHMENT_RPC_URL` (Base RPC endpoint)
- `RECONCILIATION_RPC_URL` (Base RPC endpoint)
- `COINGECKO_API_KEY` (optional) - For Pro API higher rate limits

### 3. Deploy Token Enrichment Worker

```bash
# Local development
yarn workspace token-enrichment-worker dev

# Docker
cd apps/token-enrichment-worker
docker build -t token-enrichment-worker .
docker run --env-file ../../.env token-enrichment-worker

# Kubernetes
kubectl apply -f apps/token-enrichment-worker/k8s/
```

### 4. Deploy Balance Reconciliation Worker

```bash
# Local development
yarn workspace balance-reconciliation-worker dev

# Docker
cd apps/balance-reconciliation-worker
docker build -t balance-reconciliation-worker .
docker run --env-file ../../.env balance-reconciliation-worker

# Kubernetes
kubectl apply -f apps/balance-reconciliation-worker/k8s/
```

See [apps/balance-reconciliation-worker/README.md](../apps/balance-reconciliation-worker/README.md) for configuration details.

### 5. Mark Rebasing Tokens

Identify and mark rebasing tokens to prioritize their reconciliation:

```sql
UPDATE erc20_tokens SET is_rebasing = true
WHERE address = '\x...' AND chain_id = 8453;  -- stETH, aUSDC, etc.
```

### 6. Monitor

- Check token enrichment worker logs for enrichment execution
- Monitor enrichment rate: ~180 tokens/hour (configurable)
- Check reconciliation worker logs for drift detection
- Monitor reconciliation rate and reasons (SQL queries in reconciliation section)
- Verify balances match user expectations

## Monitoring & Maintenance

### Discovery Rate

```sql
-- Check discovery rate
SELECT
  DATE_TRUNC('day', to_timestamp(block_time)) as date,
  COUNT(*) as tokens_discovered
FROM erc20_tokens
GROUP BY date
ORDER BY date DESC;
```

### Enrichment Success Rate

```sql
-- Check enrichment status
SELECT
  COUNT(*) FILTER (WHERE name IS NOT NULL) as enriched,
  COUNT(*) FILTER (WHERE name IS NULL) as pending,
  COUNT(*) as total
FROM erc20_tokens;

-- Check metadata coverage
SELECT
  COUNT(*) FILTER (WHERE logo_url IS NOT NULL) as with_logo,
  COUNT(*) FILTER (WHERE price_usd IS NOT NULL) as with_price,
  COUNT(*) as total
FROM erc20_token_metadata;
```

### Balance Accuracy

```sql
-- Verify balance accuracy (sample)
SELECT
  concat('0x', encode(send_account_address, 'hex')) as address,
  concat('0x', encode(token_address, 'hex')) as token,
  balance,
  last_updated_time
FROM erc20_balances
WHERE balance > 0
ORDER BY last_updated_time DESC
LIMIT 100;
```

### Performance Metrics

```sql
-- Query performance test
EXPLAIN ANALYZE
SELECT * FROM erc20_balances
WHERE send_account_address = '\x...'
  AND chain_id = 8453;
-- Expected: <10ms with index scan
```

## Scaling Considerations

### Current Capacity

- **Tokens:** ~10K-50K (Send users only, not all Base tokens)
- **Balances:** ~100K-500K records (users × tokens)
- **Enrichment:** ~180 tokens/hour
- **Discovery:** Real-time via triggers

### When to Scale

If the system grows beyond capacity:

1. **Increase enrichment rate:**
   - Get CoinGecko Pro API (higher rate limits)
   - Run enrichment cron more frequently
   - Process more tokens per run

2. **Optimize queries:**
   - Add more indexes if query times increase
   - Consider materialized views for heavy aggregations

3. **Database scaling:**
   - Supabase handles this automatically
   - Monitor connection pool usage


## Benefits Summary

✅ **Real-time** - Balances update as Shovel indexes new blocks
✅ **Accurate** - Calculated from actual transfer history
✅ **Fast** - <10ms database queries vs 200-500ms RPC calls
✅ **Scalable** - Works for unlimited users/tokens
✅ **Cost-effective** - No RPC costs, free API tiers
✅ **Automatic** - Token discovery and enrichment with zero manual work
✅ **Complete** - Logos, prices, descriptions all fetched automatically
✅ **Privacy-friendly** - Only indexes opted-in Send users
✅ **Smart prioritization** - Most valuable/popular tokens enriched first

## Technical Decisions

### Why Send Addresses Only?

**Decision:** Only index tokens that Send users (those with `send_accounts`) interact with.

**Rationale:**
- Reduces scope from ~1M+ tokens (all Base) to ~10K-50K (Send users)
- More relevant data (tokens people actually use)
- Better privacy (only opted-in users)
- Faster enrichment (fewer tokens to process)
- Lower costs (less storage, fewer API calls)

### Why Database-Driven Balances?

**Decision:** Calculate balances from transfer history instead of RPC calls.

**Rationale:**
- **Performance:** <10ms vs 200-500ms per query
- **Scalability:** Works for any number of users
- **Cost:** No RPC provider costs
- **History:** Can query balance at any point in time
- **Accuracy:** Source of truth from indexed transfers
- **Real-time:** Updates via trigger, no polling lag

### Why Kubernetes Workers?

**Decision:** Use Kubernetes workers instead of Vercel Cron jobs.

**Rationale:**
- **Cost savings:** No per-invocation Vercel fees, uses existing K8s capacity
- **Better control:** Adjust rate limits, batch sizes, retry logic dynamically
- **No execution limits:** Process large backlogs without timeout constraints
- **Simpler deployment:** Part of monorepo, uses workspace dependencies
- **Better observability:** Structured logging, metrics, health checks
- **Graceful shutdown:** Proper SIGTERM/SIGINT handling

### Why CoinGecko?

**Decision:** Use CoinGecko API for metadata enrichment.

**Rationale:**
- Free tier: 50 calls/min (sufficient for our rate)
- Good token coverage on Base
- Comprehensive data (logo, price, market data)
- Reliable API
- Optional Pro tier for scaling

### Why No Balance History Table?

**Decision:** Don't create a separate `erc20_balance_history` table.

**Rationale:**
- No data duplication (transfers are source of truth)
- Flexible queries (calculate balance at any timestamp)
- Less storage needed
- Less maintenance (no extra table to keep in sync)
- Can derive history from `send_account_transfers` when needed

### Why Reconciliation Worker?

**Decision:** Create separate worker service for balance reconciliation instead of relying solely on transfer-based accounting.

**Rationale:**
- **Handles rebasing tokens:** Tokens like stETH/aUSDC change balances without transfers
- **Catches missed transactions:** If indexer skips blocks, reconciliation fixes drift
- **Maintains fast UI:** DB queries remain <10ms, worker handles slow RPC calls async
- **Prioritization:** Checks high-value balances and rebasing tokens more frequently
- **Auditability:** All corrections logged with reasons
- **Observable:** Drift tracking helps identify indexer issues early

## Files Created/Modified

### Database Migrations
1. `supabase/migrations/20250930011614_create_erc20_tokens_tables.sql`
2. `supabase/migrations/20250930015920_add_erc20_token_discovery_trigger.sql`
3. `supabase/migrations/20250930033959_add_erc20_balance_tracking.sql`
4. `supabase/migrations/20251001000000_add_balance_reconciliation.sql`

### Token Enrichment Worker
1. `apps/token-enrichment-worker/src/index.ts`
2. `apps/token-enrichment-worker/src/enrichment-worker.ts`
3. `apps/token-enrichment-worker/package.json`
4. `apps/token-enrichment-worker/tsconfig.json`
5. `apps/token-enrichment-worker/Dockerfile`
6. `apps/token-enrichment-worker/README.md`
7. `apps/token-enrichment-worker/.env.example`

### Balance Reconciliation Worker
1. `apps/balance-reconciliation-worker/src/index.ts`
2. `apps/balance-reconciliation-worker/src/reconciliation-worker.ts`
3. `apps/balance-reconciliation-worker/package.json`
4. `apps/balance-reconciliation-worker/tsconfig.json`
5. `apps/balance-reconciliation-worker/Dockerfile`
6. `apps/balance-reconciliation-worker/README.md`
7. `apps/balance-reconciliation-worker/.env.example`

### Frontend Components
1. `packages/app/components/icons/IconCoin.tsx` - Database-driven logo fetching
2. `packages/app/utils/useSendAccountBalances.ts` - Database-driven balances
3. `packages/app/provider/coins/CoinsProvider.tsx` - Updated types
4. 17+ component files updated to use `tokenAddress` instead of `symbol`

### Configuration
1. `apps/next/vercel.json` - Cron schedules

### Documentation
1. `docs/erc20-indexer.md` - This file (consolidated)

## Success Criteria

✅ Tokens automatically discovered when Send users interact with them
✅ Balances calculated in <10ms from database
✅ ~180 tokens/hour enriched with metadata
✅ Logo images displayed for all enriched tokens
✅ No manual token addition or icon creation needed
✅ System scales with user growth
✅ Zero RPC polling for balance checks

---

**Status:** ✅ Fully Implemented and Deployed
**Last Updated:** 2025-09-30