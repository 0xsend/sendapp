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

- User lookups: O(log n) via user_id index
- Distribution queries: Efficient via compound indexes
- Tag search integration: Minimal overhead due to pre-aggregation

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

## Related Documentation

- [Tag Search Function](./tag-search-function.md) - Usage in search ranking
- [Database Schema](./database-schema.md) - Underlying table structures
- [Send Account Tags](./send-account-tags/) - Integration with user profiles
- [Distribution System](./distributions.md) - Distribution period management
