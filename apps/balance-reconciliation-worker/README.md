# Balance Reconciliation Worker

Async worker service that reconciles ERC20 token balances between the database (calculated from transfers) and RPC nodes (source of truth).

## Purpose

The ERC20 indexer tracks balances by summing transfers, but this approach has limitations:

1. **Rebasing tokens** (stETH, aUSDC) change balances without emitting transfers
2. **Missed transactions** create permanent drift if indexer skips blocks
3. **RPC polling is too slow** for real-time UI queries

This worker provides a hybrid solution:
- **Primary**: Fast DB-driven balances for UI (<10ms queries)
- **Secondary**: Periodic RPC snapshots to detect and fix drift

## How It Works

```
┌─────────────────────────────────────────┐
│ Every 60 seconds (configurable):       │
│                                         │
│ 1. Query get_balances_to_reconcile()   │
│    - Prioritizes rebasing tokens       │
│    - High USD value balances           │
│    - Stale snapshots                   │
│                                         │
│ 2. For each balance:                   │
│    - Get indexer's last block          │
│    - Fetch RPC balance AT THAT BLOCK   │
│      (prevents race conditions)        │
│    - Compare with DB calculated value  │
│    - Store snapshot                    │
│                                         │
│ 3. If drift detected:                  │
│    - Determine reason (rebasing, etc)  │
│    - Store reconciliation record       │
│    - Apply adjustment to DB            │
└─────────────────────────────────────────┘
```

### Race Condition Prevention

The worker uses a **N-1 block lag** strategy to avoid race conditions with the indexer:

**Key insight**: If the last indexed transfer is at block 1000, the indexer may still be processing other transfers for block 1000. We can only trust blocks the indexer has **moved past**.

**Strategy**: Reconcile at block `N-1` where `N` is the last indexed block.

**Example scenario:**
```
Time 0: Indexer processes first transfer at block 1000
Time 1: Worker sees last_indexed_block = 1000
Time 2: Worker reconciles at block 999 (safe, fully indexed)
Time 3: Indexer finishes all transfers for block 1000
Time 4: Next worker run sees last_indexed_block = 1001
Time 5: Worker now reconciles block 1000 (now safe)
```

**Why this works:**
- Block 999: Indexer has moved to 1000, so 999 is complete ✓
- Block 1000: Still being processed, not safe yet ❌

**Without N-1 lag (race condition):**
```
Block 1000: Transfer 1 indexed → last_indexed = 1000
Worker: Reconciles block 1000 based on partial data ❌
Block 1000: Transfer 2 indexed → adds more to balance
Result: Drift detected that doesn't actually exist ❌
```

**With N-1 lag (correct):**
```
Block 1000: Transfer 1 indexed → last_indexed = 1000
Worker: Reconciles block 999 (complete) ✓
Block 1000: Transfer 2 indexed → still at block 1000
Worker: Still reconciles block 999 (correct)
Block 1001: New transfer → last_indexed = 1001
Worker: Now reconciles block 1000 (now complete) ✓
```

## Configuration

Copy `.env.example` to your root `.env` and configure:

```bash
# Required
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
RECONCILIATION_RPC_URL=https://mainnet.base.org

# Optional (defaults shown)
RECONCILIATION_BATCH_SIZE=100              # Balances per loop
RECONCILIATION_RATE_LIMIT_MS=100           # RPC call delay
RECONCILIATION_POLL_INTERVAL_MS=60000      # Loop interval (60s)
RECONCILIATION_CHAIN_ID=8453               # Base mainnet
LOG_LEVEL=info
```

## Running Locally

```bash
# Install dependencies
yarn install

# Start the worker
yarn workspace balance-reconciliation-worker dev

# Or from root
yarn turbo run dev --filter=balance-reconciliation-worker
```

## Deployment

### Kubernetes

Deploy as a Deployment with 1 replica (can scale up if needed):

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: balance-reconciliation-worker
spec:
  replicas: 1
  template:
    spec:
      containers:
      - name: worker
        image: your-registry/balance-reconciliation-worker:latest
        env:
          - name: NEXT_PUBLIC_SUPABASE_URL
            valueFrom:
              secretKeyRef:
                name: supabase
                key: url
          - name: SUPABASE_SERVICE_ROLE_KEY
            valueFrom:
              secretKeyRef:
                name: supabase
                key: service-role-key
          - name: RECONCILIATION_RPC_URL
            value: "https://mainnet.base.org"
          - name: RECONCILIATION_POLL_INTERVAL_MS
            value: "60000"
```

### Docker

```bash
# Build
docker build -t balance-reconciliation-worker .

# Run
docker run -d \
  --env-file .env \
  --name balance-reconciliation-worker \
  balance-reconciliation-worker
```

## Monitoring

### Database Queries

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

-- Check snapshot coverage
SELECT
    COUNT(DISTINCT (send_account_address, token_address)) as unique_balances,
    COUNT(*) as total_snapshots,
    MAX(snapshot_time) as latest_snapshot
FROM erc20_balance_snapshots
WHERE snapshot_time > now() - interval '1 hour';
```

### Logs

The worker outputs structured JSON logs with pino:

```json
{
  "level": "info",
  "msg": "Reconciliation loop completed",
  "processed": 100,
  "reconciled": 3,
  "errors": 0,
  "duration": 12543
}
```

## Scaling

- **Single replica**: Sufficient for most workloads (<10K active balances)
- **Multiple replicas**: Safe due to idempotent reconciliation, prioritization ensures work distribution
- **Increase batch size**: Process more balances per loop
- **Decrease poll interval**: Run reconciliation more frequently

## Rebasing Tokens

Mark known rebasing tokens in the database to prioritize their reconciliation:

```sql
UPDATE erc20_tokens
SET is_rebasing = true
WHERE address IN (
    '\x...',  -- stETH
    '\x...'   -- aUSDC
);
```

Rebasing tokens are always reconciled first in each batch.
