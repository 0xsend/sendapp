# Send Scores System Documentation

## Overview

The Send Scores system is a comprehensive scoring mechanism that tracks and calculates user activity based on SEND token transfers across different distribution periods. These scores are used throughout the application for ranking, verification, and reputation systems, including enhancing the tag search function's result ordering.

## System Architecture

### Core Components

1. **`private.send_scores_history`** - Materialized view storing historical scores
2. **`public.send_scores_current`** - View for current distribution period scores
3. **`public.send_scores`** - Unified view combining historical and current scores
4. **`private.get_send_score(addr bytea)`** - Core calculation function

## Score Calculation Logic

### Distribution Periods

The system operates on **distribution periods** defined in the `distributions` table:

- **Qualification Start/End**: Time boundaries for scoring periods
- **Token Address**: Which SEND token version (v0 or current)
- **Hodler Min Balance**: Minimum balance requirement
- **Earn Min Balance**: Minimum balance for earnings eligibility

### Send Ceiling Calculation

Each user has a **send ceiling** that caps the maximum value counted per transfer:

```sql
send_ceiling = COALESCE(previous_distribution_shares, hodler_min_balance)
              / (minimum_sends * scaling_divisor)
```

**Components:**

- **Previous Distribution Shares**: User's rewards from the previous period
- **Hodler Min Balance**: Fallback minimum if no previous shares
- **Minimum Sends**: Required number of sends for qualification
- **Scaling Divisor**: Adjustment factor for score scaling

### Score Components

Each user's score consists of:

#### 1. **Raw Score**

```sql
score = SUM(LEAST(transfer_amount, send_ceiling))
```

- Sums all qualifying transfers capped at the send ceiling
- Prevents gaming by large single transfers

#### 2. **Unique Sends**

```sql
unique_sends = COUNT(DISTINCT recipient_address)
```

- Number of unique recipients the user sent to
- Encourages distribution over concentration

#### 3. **Send Ceiling**

```sql
send_ceiling = calculated_maximum_per_transfer
```

- Maximum value counted per individual transfer
- Based on user's previous performance and system parameters

### Transfer Eligibility

Transfers must meet several criteria to be counted:

#### Time Boundaries

- Must occur within the distribution's qualification period
- `block_time >= qualification_start AND block_time < qualification_end`

#### Earn Balance Requirements

If the distribution has `earn_min_balance > 0`:

- Recipient must have sufficient SEND Earn balance at transfer time
- Checked against `send_earn_balances_timeline`

#### Token Version Support

- **Current SEND Token**: Direct value counting
- **SEND Token v0**: Values multiplied by `10^16` for decimal adjustment

## Data Views and Access

### Historical Scores (`private.send_scores_history`)

**Purpose**: Materialized view storing completed distribution scores

**Refresh**: Updated via `public.refresh_send_scores_history()` function

**Structure**:

```sql
CREATE MATERIALIZED VIEW private.send_scores_history AS (
    user_id uuid,
    distribution_id integer,
    score numeric,
    unique_sends bigint,
    send_ceiling numeric
);
```

### Current Scores (`public.send_scores_current`)

**Purpose**: Real-time calculation for active distribution period

**Performance**: Computed on-demand with optimized queries

**Access Control**: Users see only their own scores unless admin

### Unified View (`public.send_scores`)

**Purpose**: Combines historical and current scores

**Query**:

```sql
SELECT * FROM public.send_scores
WHERE user_id = 'user-uuid-here';
```

## Integration with Tag Search

### Ranking Enhancement

The tag search function uses send scores to boost high-activity users in search results:

```sql
-- Aggregate user's cumulative send score
WITH scores AS (
    SELECT
        user_id,
        SUM(score) AS total_score
    FROM private.send_scores_history
    GROUP BY user_id
)

-- Apply to ranking formula
rank_value = trigram_distance - (total_score / 1,000,000)
```

### Cumulative Scoring Approach

The system uses `SUM(score)` to aggregate user activity across all distribution periods:

- **Cumulative Total**: Combines scores from all completed distributions
- **Long-term Activity**: Rewards consistent engagement over time
- **Sustained Participation**: Users with regular activity rank higher than sporadic high performers

### Ranking Impact

**Example Comparison**:

- User A: [1000, 500, 200] → Total = 1700
- User B: [600, 600, 600] → Total = 1800
- Result: User B ranks higher due to sustained engagement patterns

## Security and Access Control

### Row Level Security (RLS)

**Authenticated Users**: See only their own scores

```sql
WHERE user_id = auth.uid()
```

**Service Role**: Full access to all scores
**Anonymous**: No access to detailed scores

### Privacy Protection

- Send scores are derived from on-chain data (inherently public)
- Personal identification requires linking through `send_accounts`
- Access patterns respect user privacy settings

## Performance Considerations

### Benchmarks (Snaplet dataset)

These measurements were taken locally on the restored Snaplet dataset; absolute timings will vary by hardware and data size, but the plan shapes should be similar.

- refresh_send_scores_history() (CONCURRENTLY)
  - EXPLAIN ANALYZE SELECT refresh_send_scores_history();
  - Execution time: ~2.78 s
- public.send_scores_current
  - count(*) execution time: ~38 ms
  - top-20 (ORDER BY score DESC) execution time: ~45.9 ms
- private.send_scores_history
  - top-20 aggregation (SUM(score), SUM(unique_sends) GROUP BY user_id): ~11.4 ms

Notes
- The history view is materialized; SELECTs are fast by design. The refresh cost is acceptable for periodic updates (e.g., upon distribution completion) and runs concurrently to minimize blocking.
- The current view is fully dynamic (no refresh) and benefits from early filters and index-only scans on (f, block_time) and timeline tables.

### Materialized View Strategy

**Benefits**:

- Historical data pre-computed for fast access
- Reduces real-time calculation overhead
- Enables efficient aggregation for tag search

**Refresh Strategy**:

```sql
REFRESH MATERIALIZED VIEW CONCURRENTLY private.send_scores_history;
```

### Indexing

**Key Indexes**:

```sql
CREATE UNIQUE INDEX send_scores_history_user_id_distribution_id_idx
ON private.send_scores_history (user_id, distribution_id);
```

**Query Optimization**:

- Scan-once strategy for both current and history:
  - Pre-aggregate transfers within the active (or closed) window via
    window_transfers, grouping by (f, t). Combine v0 and current token
    streams with UNION ALL; scale v0 values by 1e16 to normalize
    decimals.
  - Join once to send_ceiling settings per sender (address_bytes) and
    cap with LEAST(transfer_sum, send_ceiling) before aggregating per
    sender. This avoids repeated per-transfer ceiling checks.
  - Apply early filters for earn_min_balance by building an eligible
    recipient set (eligible_earn_accounts) and filtering membership
    at the window stage.
- Current view access control:
  - Use authorized_accounts to restrict rows to the caller (unless
    service role), ensuring we only scan senders relevant to the caller.
- History materialization:
  - Use the same scan-once pattern over closed distributions and store
    results in a materialized view with a unique index on
    (user_id, distribution_id) for fast lookups and aggregations.
  - Refresh concurrently to minimize blocking.
- Index usage:
  - Benefit from indexes on token transfer block_time and timeline
    tables to keep scans bounded to active windows and enable early
    pruning.
- Normalization details:
  - v0 token amounts are scaled by 1e16 at read time to match the
    current token’s decimals.
- Tag search integration:
  - Cumulative scoring uses pre-aggregated history; unified current +
    history is read via the public.send_scores view for ranking.

## API Functions

### Core Functions

#### `private.get_send_score(addr bytea)`

**Purpose**: Calculate current score for a specific address
**Returns**: `(distribution_id, score, unique_sends, send_ceiling)`
**Usage**: Internal calculation engine

#### `public.get_send_scores_history()`

**Purpose**: Access historical scores with proper permissions
**Returns**: User's score history or all scores (admin)
**Security**: Respects RLS and role-based access

#### `public.refresh_send_scores_history()`

**Purpose**: Update materialized view with latest data
**Access**: Service role only
**Usage**: Scheduled maintenance or after distribution completion

## Usage Examples

### User Score Lookup

```sql
-- Get all scores for current user
SELECT * FROM public.send_scores
ORDER BY distribution_id DESC;

-- Get total cumulative score (used in tag search)
SELECT user_id, SUM(score) as total_score
FROM private.send_scores_history
WHERE user_id = auth.uid()
GROUP BY user_id;
```

### Admin Analytics

```sql
-- Top users by total activity
SELECT user_id, SUM(score) as total_score, SUM(unique_sends) as total_sends
FROM private.send_scores_history
GROUP BY user_id
ORDER BY total_score DESC
LIMIT 100;

-- Distribution performance
SELECT distribution_id, COUNT(*) as participants, AVG(score) as avg_score
FROM private.send_scores_history
GROUP BY distribution_id
ORDER BY distribution_id DESC;
```

### Tag Search Integration

```sql
-- This is automatically handled in tag_search() function
-- Users with higher cumulative scores get ranking boost:
-- rank_value = distance - (cumulative_score / 1,000,000)
```

## Maintenance and Operations

### Regular Tasks

1. **Refresh Historical Data**: After each distribution completion
2. **Index Maintenance**: Monitor query performance
3. **Access Audit**: Review permissions and usage patterns

### Monitoring

**Key Metrics**:

- Materialized view refresh frequency
- Query performance on unified view
- Tag search ranking distribution

**Alerts**:

- Failed materialized view refreshes
- Unusual scoring patterns
- Performance degradation

## Configuration Parameters

### Distribution Settings

- **`minimum_sends`**: Required send count threshold
- **`scaling_divisor`**: Score normalization factor
- **`hodler_min_balance`**: Minimum balance requirement
- **`earn_min_balance`**: Earnings qualification threshold

### System Parameters

- **Refresh Frequency**: How often to update historical scores
- **Tag Search Weight**: `/1,000,000` divisor in ranking formula
- **Access Levels**: RLS policies and role permissions

## Automated refresh (deferrable trigger)

A DEFERRABLE INITIALLY DEFERRED constraint trigger (`refresh_send_scores_on_first_transfer`) on
`public.send_token_transfers` keeps `private.send_scores_history` up to date without cron jobs.
It runs at commit (not per statement), so business logic executes after the inserting
transaction completes.

What happens at commit
- Determine the active distribution (if any) and the “previous” distribution in a single query
  (CTEs). Previous is normally `active.number - 1`; if no active distribution exists,
  we fall back to the most recently closed distribution.
- Run-once guard for the transaction: a tx-local GUC
  `vars.refresh_scores_on_distribution_change_done` prevents duplicate work when the trigger
  fires FOR EACH ROW.
- Single-winner gating with an advisory xact lock: we take
  `pg_try_advisory_xact_lock(918273645, previous_distribution_id::int)` so that exactly one
  committing transaction (the “winner”) may examine/refresh the MV. Other concurrent commits
  skip the MV section and proceed immediately.
- Idempotent refresh: if the MV already has rows for `previous_distribution_id`, we skip; if it
  does not, the winner runs `REFRESH MATERIALIZED VIEW private.send_scores_history;`.
  Note: this is a non-concurrent refresh by design because triggers run inside the transaction;
  `REFRESH MATERIALIZED VIEW CONCURRENTLY` is not allowed inside a transaction block.
- One-time inserts for the active distribution: the function also seeds tag-registration
  verifications for the active window if missing (requires a DVV row for
  `tag_registration` on the active distribution).

Performance characteristics (big‑O)
- Advisory lock gating reduces total refresh work per previous distribution to O(S) once; other
  concurrent commits do O(1) in the gated section.
- The existence probe is O(log H) with an index on `private.send_scores_history(distribution_id)`.
- Distribution lookups are O(log D) with proper indexes (e.g., `distributions(number)` and an
  index that supports time-window checks).

Operational notes
- Indexes recommended:
  - `private.send_scores_history(distribution_id)` (btree); unique index on `(user_id, distribution_id)` remains useful
  - `distributions(number)` (btree), and an index aiding time-window detection
  - For verifications, composite indexes such as `(distribution_id, type)` as needed
- Advisory lock namespace `918273645` partitions the lock keyspace for this feature and avoids
  collisions with other app locks.

Test coverage
- `supabase/tests/refresh_send_scores_trigger_test.sql` (pgTAP): seeds minimal data, commits a
  transfer to trigger exactly one refresh, then commits again to assert the refresh count remains
  1 (gating works). This test runs with all triggers enabled.

## Related Documentation

- [Tag Search Function](./tag-search-function.md) - Usage in search ranking
- [Database Schema](./database-schema.md) - Underlying table structures
- [Send Account Tags](./send-account-tags/) - Integration with user profiles
- [Distribution System](./distributions.md) - Distribution period management


