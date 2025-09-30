# ERC20 Balance Tracking - Database-Driven Design

## Current Implementation Analysis

### How Balances Are Currently Tracked

**File:** `packages/app/utils/useSendAccountBalances.ts`

**Method:** RPC calls via wagmi hooks
```typescript
// Multicall to get all ERC20 balances
const tokensQuery = useReadContracts({
  contracts: [
    { address: tokenAddress, abi: erc20Abi, functionName: 'balanceOf', args: [userAddress] },
    // ... for each token
  ],
  query: { refetchInterval: 10 * 1000 } // Polls every 10 seconds!
})
```

### Problems with Current Approach

| Issue | Impact |
|-------|--------|
| **High RPC load** | Polls every 10 seconds for all users |
| **Slow** | Multiple RPC calls per page load |
| **No history** | Can't show balance over time |
| **Expensive** | RPC provider costs |
| **Race conditions** | Balance can be stale during transfers |
| **Limited** | Only works for known tokens |

## Proposed Solution: Database-Driven Balances

### Architecture

```
send_account_transfers (Shovel) → Trigger → erc20_balances (Materialized)
                                          ↓
                                    User queries balance (instant!)
```

### Benefits

✅ **Instant** - No RPC calls, direct DB query
✅ **Scalable** - Works for unlimited users/tokens
✅ **Historical** - Track balance changes over time
✅ **Accurate** - Calculated from actual transfers
✅ **Cost-effective** - No RPC costs
✅ **Real-time** - Updates as Shovel indexes new blocks

## Database Schema

### Table: `erc20_balances`

Materialized view of current token balances for all Send addresses.

```sql
CREATE TABLE public.erc20_balances (
    send_account_address bytea NOT NULL,
    chain_id numeric NOT NULL,
    token_address bytea NOT NULL,
    balance numeric NOT NULL DEFAULT 0,
    last_updated_block numeric NOT NULL,
    last_updated_time timestamp with time zone NOT NULL,

    PRIMARY KEY (send_account_address, chain_id, token_address),
    FOREIGN KEY (send_account_address, chain_id)
        REFERENCES send_accounts(address, chain_id) ON DELETE CASCADE,
    FOREIGN KEY (token_address, chain_id)
        REFERENCES erc20_tokens(address, chain_id) ON DELETE CASCADE
);

CREATE INDEX erc20_balances_token_idx
    ON erc20_balances(token_address, chain_id);

CREATE INDEX erc20_balances_address_idx
    ON erc20_balances(send_account_address, chain_id);
```

**RLS Policy:**
```sql
-- Users can only see their own balances
CREATE POLICY "Users can see own balances"
    ON erc20_balances FOR SELECT
    USING (
        send_account_address IN (
            SELECT address FROM send_accounts WHERE user_id = auth.uid()
        )
    );
```

### Historical Balances

Historical balance data is **not** stored in a separate table. Instead, it can be derived from `send_account_transfers` when needed:

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

**Benefits of no separate history table:**
- ✅ No data duplication - transfers are the source of truth
- ✅ Flexible queries - calculate balance at any point in time
- ✅ Less storage - no need to store balance snapshots
- ✅ Less maintenance - no extra table to keep in sync

## Balance Calculation Logic

### Approach 1: Trigger-Based (Real-time)

Update balances automatically when transfers are indexed.

```sql
CREATE FUNCTION update_erc20_balances_from_transfer()
RETURNS TRIGGER AS $$
BEGIN
    -- Decrease sender balance
    INSERT INTO erc20_balances (
        send_account_address,
        chain_id,
        token_address,
        balance,
        last_updated_block,
        last_updated_time
    )
    VALUES (
        NEW.f,
        NEW.chain_id,
        NEW.log_addr,
        -NEW.v,
        NEW.block_num,
        to_timestamp(NEW.block_time)
    )
    ON CONFLICT (send_account_address, chain_id, token_address)
    DO UPDATE SET
        balance = erc20_balances.balance - NEW.v,
        last_updated_block = NEW.block_num,
        last_updated_time = to_timestamp(NEW.block_time);

    -- Increase receiver balance
    INSERT INTO erc20_balances (
        send_account_address,
        chain_id,
        token_address,
        balance,
        last_updated_block,
        last_updated_time
    )
    VALUES (
        NEW.t,
        NEW.chain_id,
        NEW.log_addr,
        NEW.v,
        NEW.block_num,
        to_timestamp(NEW.block_time)
    )
    ON CONFLICT (send_account_address, chain_id, token_address)
    DO UPDATE SET
        balance = erc20_balances.balance + NEW.v,
        last_updated_block = NEW.block_num,
        last_updated_time = to_timestamp(NEW.block_time);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_balances_from_transfer
    AFTER INSERT ON send_account_transfers
    FOR EACH ROW
    EXECUTE FUNCTION update_erc20_balances_from_transfer();
```

### Approach 2: Batch Recalculation (Bootstrap + Periodic)

Calculate balances by aggregating all transfers.

```sql
CREATE FUNCTION recalculate_erc20_balances(
    p_send_account_address bytea DEFAULT NULL,
    p_token_address bytea DEFAULT NULL
)
RETURNS void AS $$
BEGIN
    -- If specific account/token provided, recalculate only that
    -- Otherwise, recalculate all

    INSERT INTO erc20_balances (
        send_account_address,
        chain_id,
        token_address,
        balance,
        last_updated_block,
        last_updated_time
    )
    SELECT
        address,
        chain_id,
        token_address,
        balance,
        last_block_num,
        to_timestamp(last_block_time)
    FROM (
        -- Calculate balance as: received - sent
        SELECT
            sa.address,
            sat.chain_id,
            sat.log_addr as token_address,
            COALESCE(SUM(CASE WHEN sat.t = sa.address THEN sat.v ELSE 0 END), 0) -
            COALESCE(SUM(CASE WHEN sat.f = sa.address THEN sat.v ELSE 0 END), 0) as balance,
            MAX(sat.block_num) as last_block_num,
            MAX(sat.block_time) as last_block_time
        FROM send_accounts sa
        CROSS JOIN (
            SELECT DISTINCT log_addr, chain_id
            FROM send_account_transfers
            WHERE (p_token_address IS NULL OR log_addr = p_token_address)
        ) tokens
        LEFT JOIN send_account_transfers sat ON
            sat.chain_id = tokens.chain_id AND
            sat.log_addr = tokens.log_addr AND
            (sat.f = sa.address OR sat.t = sa.address)
        WHERE (p_send_account_address IS NULL OR sa.address = p_send_account_address)
        GROUP BY sa.address, sat.chain_id, sat.log_addr
        HAVING COALESCE(SUM(CASE WHEN sat.t = sa.address THEN sat.v ELSE 0 END), 0) -
               COALESCE(SUM(CASE WHEN sat.f = sa.address THEN sat.v ELSE 0 END), 0) != 0
    ) calculated
    ON CONFLICT (send_account_address, chain_id, token_address)
    DO UPDATE SET
        balance = EXCLUDED.balance,
        last_updated_block = EXCLUDED.last_updated_block,
        last_updated_time = EXCLUDED.last_updated_time;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Implementation Strategy

### Phase 1: Bootstrap (One-time)

Calculate balances from all historical transfers.

```sql
-- Run this once to populate erc20_balances from historical data
SELECT recalculate_erc20_balances();
```

**Estimated time:**
- 10K users × 10 tokens = 100K balance records
- ~5-10 minutes to calculate

### Phase 2: Real-time Updates (Ongoing)

Add trigger to `send_account_transfers` to update balances on new transfers.

```sql
CREATE TRIGGER trigger_update_balances_from_transfer
    AFTER INSERT ON send_account_transfers
    FOR EACH ROW
    EXECUTE FUNCTION update_erc20_balances_from_transfer();
```

### Phase 3: Verification (Safety)

Periodically verify balances match on-chain reality.

```typescript
// Cron job: /api/cron/verify-balances
// Schedule: Daily

// For a random sample of addresses:
// 1. Query balance from DB
// 2. Query balance from RPC
// 3. Compare and log discrepancies
// 4. Recalculate if mismatch found
```

## API Changes

### New tRPC Endpoint

```typescript
// packages/api/src/routers/erc20.ts

export const erc20Router = router({
  // Get balances for current user
  getMyBalances: protectedProcedure
    .input(z.object({
      chainId: z.number().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const { data: sendAccount } = await ctx.supabase
        .from('send_accounts')
        .select('address, chain_id')
        .eq('user_id', ctx.user.id)
        .single()

      if (!sendAccount) return []

      const { data: balances } = await ctx.supabase
        .from('erc20_balances')
        .select(`
          token_address,
          balance,
          last_updated_time,
          erc20_tokens!inner(
            name,
            symbol,
            decimals
          )
        `)
        .eq('send_account_address', sendAccount.address)
        .eq('chain_id', input.chainId ?? sendAccount.chain_id)
        .gt('balance', '0')
        .order('balance', { ascending: false })

      return balances
    }),

  // Get balance for specific token
  getTokenBalance: protectedProcedure
    .input(z.object({
      tokenAddress: z.string(),
      chainId: z.number().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const { data: sendAccount } = await ctx.supabase
        .from('send_accounts')
        .select('address, chain_id')
        .eq('user_id', ctx.user.id)
        .single()

      if (!sendAccount) return null

      const { data: balance } = await ctx.supabase
        .from('erc20_balances')
        .select(`
          balance,
          last_updated_time,
          erc20_tokens!inner(
            name,
            symbol,
            decimals
          )
        `)
        .eq('send_account_address', sendAccount.address)
        .eq('chain_id', input.chainId ?? sendAccount.chain_id)
        .eq('token_address', input.tokenAddress)
        .single()

      return balance
    }),

  // Get balance history (derived from transfers)
  getBalanceHistory: protectedProcedure
    .input(z.object({
      tokenAddress: z.string(),
      chainId: z.number().optional(),
      startTime: z.date().optional(),
      endTime: z.date().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const { data: sendAccount } = await ctx.supabase
        .from('send_accounts')
        .select('address, chain_id')
        .eq('user_id', ctx.user.id)
        .single()

      if (!sendAccount) return []

      // Calculate balance at each transfer
      const { data: transfers } = await ctx.supabase
        .from('send_account_transfers')
        .select('f, t, v, block_time, tx_hash')
        .eq('log_addr', input.tokenAddress)
        .eq('chain_id', input.chainId ?? sendAccount.chain_id)
        .or(`f.eq.${sendAccount.address},t.eq.${sendAccount.address}`)
        .gte('block_time', input.startTime?.getTime() ?? 0)
        .lte('block_time', input.endTime?.getTime() ?? Date.now())
        .order('block_time', { ascending: true })

      // Calculate running balance
      let balance = 0n
      return transfers.map(transfer => {
        const change = transfer.t === sendAccount.address
          ? BigInt(transfer.v)
          : -BigInt(transfer.v)
        balance += change
        return {
          balance: balance.toString(),
          balance_change: change.toString(),
          block_time: transfer.block_time,
          tx_hash: transfer.tx_hash,
        }
      })
    }),
})
```

### Updated Hook

```typescript
// packages/app/utils/useSendAccountBalances.ts

export const useSendAccountBalances = () => {
  const { data: sendAccount } = useSendAccount()
  const supabase = useSupabase()

  // Query balances from database
  const balancesQuery = useQuery({
    queryKey: ['erc20Balances', sendAccount?.address],
    queryFn: async () => {
      if (!sendAccount) return null

      const { data, error } = await supabase
        .from('erc20_balances')
        .select(`
          token_address,
          balance,
          last_updated_time,
          erc20_tokens!inner(
            name,
            symbol,
            decimals,
            erc20_token_metadata(
              logo_url,
              price_usd
            )
          )
        `)
        .eq('send_account_address', sendAccount.address)
        .eq('chain_id', baseMainnet.id)
        .gt('balance', '0')

      if (error) throw error

      return data.reduce((acc, item) => {
        acc[`0x${Buffer.from(item.token_address).toString('hex')}`] = {
          balance: BigInt(item.balance),
          symbol: item.erc20_tokens.symbol,
          decimals: item.erc20_tokens.decimals,
          price: item.erc20_tokens.erc20_token_metadata?.price_usd,
        }
        return acc
      }, {} as Record<string, { balance: bigint; symbol: string; decimals: number; price?: number }>)
    },
    enabled: !!sendAccount,
    // No need to refetch frequently - updates happen via realtime subscription
    staleTime: 60 * 1000,
  })

  // Optional: Subscribe to real-time balance updates
  useEffect(() => {
    if (!sendAccount) return

    const channel = supabase
      .channel('balance-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'erc20_balances',
          filter: `send_account_address=eq.${sendAccount.address}`,
        },
        () => {
          balancesQuery.refetch()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [sendAccount, supabase, balancesQuery])

  return balancesQuery
}
```

## Migration Path

### Step 1: Create Tables

```sql
-- Run migration to create erc20_balances table
```

### Step 2: Bootstrap Existing Data

```sql
-- Populate balances from historical transfers
SELECT recalculate_erc20_balances();
```

### Step 3: Enable Trigger

```sql
-- Add trigger to update balances on new transfers
CREATE TRIGGER trigger_update_balances_from_transfer...
```

### Step 4: Update Frontend

```typescript
// Gradually migrate from RPC-based to DB-based
// Start with optional fallback to RPC if DB data is missing
```

### Step 5: Monitor & Verify

```typescript
// Run daily verification cron
// Alert on discrepancies
// Recalculate if needed
```

## Performance Considerations

### Database Query Performance

```sql
-- Query: Get all balances for a user
EXPLAIN ANALYZE
SELECT * FROM erc20_balances
WHERE send_account_address = $1 AND chain_id = $2;

-- Expected: Index scan, <1ms
```

### Trigger Performance

```sql
-- Each transfer INSERT triggers 2 balance UPSERTs
-- Expected overhead: <5ms per transfer
-- Acceptable since transfers are not super frequent
```

### Bootstrap Performance

```sql
-- Initial calculation for all users
-- 100K balance records
-- ~5-10 minutes one-time

-- Incremental recalculation for single user
-- ~100ms per user
```

## Comparison: RPC vs Database

| Aspect | RPC (Current) | Database (Proposed) |
|--------|---------------|---------------------|
| **Query Time** | 200-500ms (multicall) | <10ms (indexed query) |
| **Scalability** | Poor (N RPC calls) | Excellent (1 query) |
| **Cost** | High (RPC provider) | Low (DB storage) |
| **Historical Data** | No | Yes |
| **Real-time Updates** | 10s polling | Instant (trigger) |
| **User Experience** | Slow, janky | Fast, smooth |

## Next Steps

1. ✅ Create migration for `erc20_balances` table
2. ✅ Implement balance calculation function
3. ✅ Create trigger for real-time updates
4. ✅ Bootstrap existing balances
5. ✅ Update hooks to use DB instead of RPC
6. ✅ Add real-time subscriptions
7. ✅ Create verification cron job
8. ✅ Monitor and optimize

This approach transforms balance tracking from expensive RPC polling to instant database queries!