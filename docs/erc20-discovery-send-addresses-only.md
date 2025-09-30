# ERC20 Token Discovery - Send Addresses Only

## Strategy

Instead of indexing ALL ERC20 tokens on Base, we **only index tokens that Send users interact with**.

### Benefits

- ✅ **Dramatically reduced scope**: Thousands instead of millions of tokens
- ✅ **More relevant**: Only tokens Send users actually use
- ✅ **Faster enrichment**: Can enrich all tokens within days
- ✅ **Lower API costs**: Fewer tokens to process
- ✅ **Better UX**: Users only see tokens they care about
- ✅ **Privacy-friendly**: Only indexes tokens for users who opted in (created Send account)

### Discovery Logic

```typescript
// Discover tokens FROM Transfer events WHERE
// sender OR receiver is a Send account address

FOR each Transfer event:
  IF (from_address IN send_accounts OR to_address IN send_accounts):
    DISCOVER token_address
```

## Implementation Approaches

### Approach 1: Shovel-Based Discovery (Recommended)

Use Shovel's existing `send_account_transfers` table which already tracks transfers for Send accounts.

**Pros:**
- Leverages existing Shovel infrastructure
- Real-time discovery as transfers happen
- No additional RPC calls needed
- Already filtered to Send accounts

**Cons:**
- Only catches transfers, not initial token holdings
- Need post-processing to extract unique token addresses

**Implementation:**

```sql
-- Query to find undiscovered tokens from send_account_transfers
SELECT DISTINCT log_addr as token_address
FROM send_account_transfers
WHERE log_addr NOT IN (
  SELECT address FROM erc20_tokens WHERE chain_id = 8453
)
LIMIT 100;
```

**Shovel Table Schema:**

```typescript
// Already exists: send_account_transfers
{
  id: number
  chain_id: number
  log_addr: bytea  // <-- This is the token contract address!
  block_time: number
  tx_hash: bytea
  f: bytea  // from
  t: bytea  // to
  v: number // value
  ig_name: string
  src_name: string
  block_num: number
  tx_idx: number
  log_idx: number
}
```

### Approach 2: Direct RPC Scanning

Query Transfer events directly from RPC, filtering by Send account addresses.

**Pros:**
- Can run retroactively for all historical transfers
- More control over discovery logic

**Cons:**
- Requires RPC calls
- More complex implementation
- Slower than using existing Shovel data

## Recommended Implementation: Hybrid Approach

**Phase 1: Discover from Existing Shovel Data (Fast Bootstrap)**

Process existing `send_account_transfers` to extract unique token addresses.

```typescript
// Vercel Cron: /api/cron/discover-tokens-from-shovel

export default async function handler(req, res) {
  // Get undiscovered tokens from send_account_transfers
  const { data: undiscovered } = await supabase.rpc('get_undiscovered_tokens', {
    limit_count: 100
  })

  for (const row of undiscovered) {
    await processToken(row.token_address, row.chain_id)
  }

  return res.json({ discovered: undiscovered.length })
}
```

**Database Function:**

```sql
CREATE OR REPLACE FUNCTION public.get_undiscovered_tokens(limit_count integer DEFAULT 100)
RETURNS TABLE(token_address bytea, chain_id numeric) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT sat.log_addr, sat.chain_id
  FROM send_account_transfers sat
  WHERE NOT EXISTS (
    SELECT 1
    FROM erc20_tokens et
    WHERE et.address = sat.log_addr
      AND et.chain_id = sat.chain_id
  )
  ORDER BY sat.block_time DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Phase 2: Real-Time Discovery via Trigger (Ongoing)**

Add a trigger to `send_account_transfers` that auto-discovers new tokens.

```sql
CREATE OR REPLACE FUNCTION public.discover_token_from_transfer()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if token already exists
  IF NOT EXISTS (
    SELECT 1 FROM erc20_tokens
    WHERE address = NEW.log_addr AND chain_id = NEW.chain_id
  ) THEN
    -- Insert placeholder record (will be enriched by discovery service)
    INSERT INTO erc20_tokens (
      address, chain_id, block_num, block_time, tx_hash
    ) VALUES (
      NEW.log_addr, NEW.chain_id, NEW.block_num, NEW.block_time, NEW.tx_hash
    )
    ON CONFLICT (address, chain_id) DO NOTHING;

    -- Initialize activity tracking
    INSERT INTO erc20_token_activity (token_address, chain_id)
    VALUES (NEW.log_addr, NEW.chain_id)
    ON CONFLICT (token_address, chain_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_discover_token_from_transfer
  AFTER INSERT ON send_account_transfers
  FOR EACH ROW
  EXECUTE FUNCTION discover_token_from_transfer();
```

**Phase 3: Enrich Token Metadata (Background)**

Separate service reads tokens with NULL name/symbol and enriches them.

```typescript
// Read contract to get name, symbol, decimals, totalSupply
// Then update the erc20_tokens record

UPDATE erc20_tokens
SET
  name = 'Token Name',
  symbol = 'TKN',
  decimals = 18,
  total_supply = 1000000
WHERE address = $1 AND chain_id = $2
  AND name IS NULL;
```

## Discovery Service Architecture

```
┌─────────────────────────────────────────┐
│  Shovel: send_account_transfers         │
│  (Already filtering Send addresses)     │
└────────────┬────────────────────────────┘
             │
             ▼
┌────────────────────────────────────────┐
│  Trigger: Auto-insert into             │
│  erc20_tokens (placeholder)            │
└────────────┬───────────────────────────┘
             │
             ▼
┌────────────────────────────────────────┐
│  Cron Job: Enrich missing metadata     │
│  - Read contract (name, symbol, etc)   │
│  - Update erc20_tokens record          │
└────────────────────────────────────────┘
```

## Database Migration: Add Trigger

```sql
-- Add trigger to auto-discover tokens from send_account_transfers

CREATE OR REPLACE FUNCTION public.discover_token_from_transfer()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process if token doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM erc20_tokens
    WHERE address = NEW.log_addr AND chain_id = NEW.chain_id
  ) THEN
    -- Insert placeholder (name, symbol, decimals will be NULL)
    INSERT INTO erc20_tokens (
      address,
      chain_id,
      block_num,
      block_time,
      tx_hash,
      ig_name,
      src_name,
      tx_idx,
      log_idx
    ) VALUES (
      NEW.log_addr,
      NEW.chain_id,
      NEW.block_num,
      NEW.block_time,
      NEW.tx_hash,
      NEW.ig_name,
      NEW.src_name,
      NEW.tx_idx,
      NEW.log_idx
    )
    ON CONFLICT (address, chain_id) DO NOTHING;

    -- Initialize activity tracking
    INSERT INTO erc20_token_activity (token_address, chain_id)
    VALUES (NEW.log_addr, NEW.chain_id)
    ON CONFLICT (token_address, chain_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_discover_token_from_transfer
  AFTER INSERT ON send_account_transfers
  FOR EACH ROW
  EXECUTE FUNCTION discover_token_from_transfer();

-- Helper function to get tokens needing enrichment
CREATE OR REPLACE FUNCTION public.get_tokens_needing_enrichment(limit_count integer DEFAULT 100)
RETURNS TABLE(
  token_address bytea,
  chain_id numeric,
  block_time numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    address,
    erc20_tokens.chain_id,
    erc20_tokens.block_time
  FROM erc20_tokens
  WHERE
    name IS NULL
    OR symbol IS NULL
    OR decimals IS NULL
  ORDER BY block_time DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Token Enrichment Service

**Vercel Cron:** `/api/cron/enrich-token-data`

```typescript
import { NextApiRequest, NextApiResponse } from 'next'
import { createPublicClient, http } from 'viem'
import { base } from 'viem/chains'
import { createClient } from '@supabase/supabase-js'

const ERC20_ABI = [
  {
    name: 'name',
    outputs: [{ type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    name: 'symbol',
    outputs: [{ type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    name: 'decimals',
    outputs: [{ type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    name: 'totalSupply',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const client = createPublicClient({
    chain: base,
    transport: http(process.env.BASE_RPC_URL_PRIMARY)
  })

  // Get tokens that need enrichment
  const { data: tokens, error } = await supabase.rpc('get_tokens_needing_enrichment', {
    limit_count: 50
  })

  if (error) {
    console.error('Failed to get tokens:', error)
    return res.status(500).json({ error: error.message })
  }

  const enriched = []
  const failed = []

  for (const token of tokens || []) {
    try {
      const address = `0x${Buffer.from(token.token_address).toString('hex')}` as `0x${string}`

      // Read token metadata from contract
      const [name, symbol, decimals, totalSupply] = await Promise.all([
        client.readContract({
          address,
          abi: ERC20_ABI,
          functionName: 'name',
        }).catch(() => 'Unknown'),

        client.readContract({
          address,
          abi: ERC20_ABI,
          functionName: 'symbol',
        }).catch(() => 'UNKNOWN'),

        client.readContract({
          address,
          abi: ERC20_ABI,
          functionName: 'decimals',
        }).catch(() => 18),

        client.readContract({
          address,
          abi: ERC20_ABI,
          functionName: 'totalSupply',
        }).catch(() => 0n),
      ])

      // Update token in database
      const { error: updateError } = await supabase
        .from('erc20_tokens')
        .update({
          name: name as string,
          symbol: symbol as string,
          decimals: decimals as number,
          total_supply: totalSupply.toString(),
        })
        .eq('address', token.token_address)
        .eq('chain_id', token.chain_id)

      if (updateError) {
        console.error(`Failed to update token ${address}:`, updateError)
        failed.push(address)
      } else {
        console.log(`✅ Enriched token: ${symbol} (${address})`)
        enriched.push(address)
      }

    } catch (error) {
      const address = `0x${Buffer.from(token.token_address).toString('hex')}`
      console.error(`❌ Failed to enrich ${address}:`, error)
      failed.push(address)
    }
  }

  return res.json({
    processed: tokens?.length || 0,
    enriched: enriched.length,
    failed: failed.length,
  })
}
```

## Vercel Cron Configuration

```json
{
  "crons": [
    {
      "path": "/api/cron/enrich-token-data",
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

## Bootstrap: Process Existing Transfers

One-time script to process historical `send_account_transfers`:

```typescript
// scripts/bootstrap-erc20-tokens.ts

async function bootstrapTokens() {
  const supabase = createClient(/* ... */)

  // Get all unique token addresses from send_account_transfers
  const { data: tokens } = await supabase
    .from('send_account_transfers')
    .select('log_addr, chain_id, block_num, block_time, tx_hash')
    .order('block_time', { ascending: false })

  const uniqueTokens = new Map<string, typeof tokens[0]>()

  for (const row of tokens || []) {
    const key = `${Buffer.from(row.log_addr).toString('hex')}-${row.chain_id}`
    if (!uniqueTokens.has(key)) {
      uniqueTokens.set(key, row)
    }
  }

  console.log(`Found ${uniqueTokens.size} unique tokens`)

  // Insert all tokens (will be enriched by cron job)
  for (const [key, token] of uniqueTokens) {
    await supabase
      .from('erc20_tokens')
      .insert({
        address: token.log_addr,
        chain_id: token.chain_id,
        block_num: token.block_num,
        block_time: token.block_time,
        tx_hash: token.tx_hash,
      })
      .onConflict('address,chain_id')
      .ignore()

    await supabase
      .from('erc20_token_activity')
      .insert({
        token_address: token.log_addr,
        chain_id: token.chain_id,
      })
      .onConflict('token_address,chain_id')
      .ignore()
  }

  console.log('Bootstrap complete!')
}
```

## Estimated Coverage

| Metric | Estimate |
|--------|----------|
| **Total Send Users** | ~50,000+ |
| **Unique Tokens per User** | ~5-10 |
| **Total Unique Tokens** | ~10,000-50,000 |
| **Enrichment Time** | 2-7 days (at 50 tokens per 10 minutes) |
| **API Calls (Metadata)** | ~10,000-50,000 total |
| **Ongoing Rate** | ~100-500 new tokens per week |

## Benefits vs. Indexing All Tokens

| Aspect | All Tokens | Send Addresses Only |
|--------|------------|---------------------|
| **Token Count** | ~1M+ | ~10K-50K |
| **Discovery Time** | Weeks/months | Days |
| **Metadata Enrichment** | Months/years | Days/weeks |
| **Relevance** | Low (99% spam) | High (user-relevant) |
| **API Costs** | Very high | Moderate |
| **Storage** | Large | Small |
| **Performance** | Slow queries | Fast queries |

## Next Steps

1. ✅ Add migration for trigger and helper functions
2. ✅ Create enrichment cron job
3. ✅ Run bootstrap script on existing data
4. ✅ Test with a few tokens
5. ✅ Monitor and optimize