# Tag Search Function Documentation

## Overview

The `tag_search` function is a PostgreSQL function that enables searching for user profiles by tags, send IDs, and phone numbers. It uses trigram-based fuzzy matching with distance-based ranking to provide relevant search results while ensuring no duplicate profiles are returned.

## Function Signature

```sql
tag_search(
    query text,
    limit_val integer,
    offset_val integer
) RETURNS TABLE(
    send_id_matches public.tag_search_result[],
    tag_matches public.tag_search_result[],
    phone_matches public.tag_search_result[]
)
```

### Parameters

- **`query`**: The search query string (tag name, send ID, or phone number)
- **`limit_val`**: Maximum number of results to return (1-100)
- **`offset_val`**: Number of results to skip for pagination

### Return Type

The function returns a table with three arrays of `tag_search_result`:

```sql
CREATE TYPE tag_search_result AS (
    avatar_url text,
    tag_name text,
    send_id integer,
    phone text,
    is_verified boolean,
    verified_at timestamptz
);
```

## Search Types

### 1. Send ID Matches

Searches for exact send ID matches when the query is a valid integer.

```sql
-- Example: Searching for send ID 12345
SELECT send_id_matches FROM tag_search('12345', 10, 0);
```

### 2. Tag Matches (Primary Focus)

Searches through confirmed tags using trigram similarity with deduplication logic.

#### Search Criteria
- Only searches `confirmed` status tags
- Uses trigram distance operators (`<->`, `<<->`)
- Includes ILIKE pattern matching for broader results
- Filters: `t.name <<-> query < 0.7 OR t.name ILIKE '%' || query || '%'`

#### Deduplication Logic

**Problem Solved**: Users with multiple tags matching a query could appear multiple times in results.

**Solution**: The function implements profile deduplication using window functions:

```sql
SELECT
    p.avatar_url,
    t.name AS tag_name,
    p.send_id,
    NULL::text AS phone,
    (t.name <-> query) AS distance,
    ROW_NUMBER() OVER (PARTITION BY p.id ORDER BY (t.name <-> query)) AS rn
FROM profiles p
JOIN send_accounts sa ON sa.user_id = p.id
JOIN send_account_tags sat ON sat.send_account_id = sa.id
JOIN tags t ON t.id = sat.tag_id AND t.status = 'confirmed'
WHERE (t.name <<-> query < 0.7 OR t.name ILIKE '%' || query || '%')
```

**Key Features**:
1. **`ROW_NUMBER()` Window Function**: Ranks each user's tags by combined priority
2. **`PARTITION BY tm.send_id`**: Groups by user to ensure one result per profile
3. **`ORDER BY primary_rank, verified_rank, secondary_rank`**: Prioritizes exact matches, then verified status, then score/distance
4. **Filter `WHERE rn = 1`**: Keeps only the best matching tag per profile
5. **Final ordering**: `ORDER BY primary_rank ASC, verified_rank ASC, secondary_rank ASC` (exact first, verified before unverified)

#### Example Scenarios

**Scenario 1: User with multiple matching tags**
```
User "john" has tags: ["test", "tester", "testing"]
Query: "test"
Result: Returns only "test" (exact match, distance = 0)
```

**Scenario 2: Multiple users with exact matches**
```
User A has tag "boss"
User B has tag "boss"  
Query: "boss"
Result: Returns both users (no deduplication across different profiles)
```

### 3. Phone Matches

Phone number searching is currently disabled but the infrastructure exists for future implementation.

## Distance-Based Ranking

The function uses PostgreSQL's trigram extension for similarity scoring:

- **Distance 0**: Exact match
- **Distance < 0.7**: Similar strings (configurable threshold)
- **Lower distance**: Better match

### Trigram Operators Used

- **`<->`**: Trigram distance (0 = identical, higher = more different)
- **`<<->`**: Trigram similarity threshold operator
- **`ILIKE`**: Case-insensitive pattern matching for broader coverage

## Exact Match Priority System

### Overview

The ranking system ensures exact matches always appear before fuzzy matches by implementing a **two-tier ranking approach** that guarantees case-insensitive exact matches always outrank fuzzy matches:

#### Primary Ranking
1. **Primary rank**: Distinguishes between exact and fuzzy matches
   - `CASE WHEN LOWER(name) = LOWER(query) THEN 0 ELSE 1 END`
   - Exact matches get rank = 0 (best)
   - Fuzzy matches get rank = 1 (worse)

2. **Secondary rank**: Provides ordering within each tier
   - **For exact matches (rank=0)**: Use `-send_score` (higher score = better)
   - **For fuzzy matches (rank=1)**: Use existing trigram + send_score formula

#### Final Ordering Strategy

Results are ordered by: `ORDER BY (primary_rank ASC, verified_rank ASC, secondary_rank ASC)`

This guarantees:
- ✅ All exact matches appear before any fuzzy matches
- ✅ Within each match type, verified users appear before unverified users
- ✅ Within exact matches, higher send_score users appear first
- ✅ Within fuzzy matches, trigram distance and send score ranking is used
- ✅ Deduplication logic ensures one row per profile

#### Verified Weighting

Verified status participates in ranking as a middle tier between exact/fuzzy and distance/score.
- `verified_rank = CASE WHEN tm.verified_at IS NOT NULL THEN 0 ELSE 1 END`
- Applied in both the deduplication partition ordering and the final ORDER BY
- Note: Exact matches (primary_rank = 0) always outrank fuzzy matches (primary_rank = 1), regardless of verification

#### Implementation Details

```sql
-- Primary ranking: exact (0) vs fuzzy (1)
CASE WHEN tm.is_exact THEN 0 ELSE 1 END AS primary_rank,

-- Verified weighting: verified first within each tier
CASE WHEN tm.verified_at IS NOT NULL THEN 0 ELSE 1 END AS verified_rank,

-- Secondary ranking varies by match type
CASE 
    WHEN tm.is_exact THEN 
        -tm.send_score  -- Higher send_score ranks earlier for exact matches
    ELSE 
        -- Fuzzy ranking formula: distance - (send_score / 1M)
        CASE WHEN tm.distance IS NULL THEN 0 ELSE tm.distance END
        - (tm.send_score / 1000000.0)
END AS secondary_rank
```

### Example Scenarios

#### Scenario 1: Mixed exact and fuzzy matches
```
Query: "alice"
Users:
- User A: tag="alice", send_score=100 
- User B: tag="alic3", send_score=10000

Result order:
1. User A (exact match, primary_rank=0, secondary_rank=-100)
2. User B (fuzzy match, primary_rank=1, secondary_rank=distance-10)
```

#### Scenario 2: Multiple exact matches
```  
Query: "boss"
Users:
- User A: tag="boss", send_score=500
- User B: tag="boss", send_score=1000  

Result order:
1. User B (exact match, primary_rank=0, secondary_rank=-1000)
2. User A (exact match, primary_rank=0, secondary_rank=-500)
```

#### Scenario 3: Case-sensitive exact matching
```
Query: "Ethen_"
Users:
- User A: tag="ethen", send_score=75000
- User B: tag="Ethen_", send_score=25

Result order:
1. User B (case-insensitive exact match for "Ethen_")
2. User A (fuzzy match)
```

### Preserved Functionality

The exact match priority system preserves all existing functionality:
- ✅ Trigram fuzzy matching with 0.7 distance threshold
- ✅ ILIKE pattern matching for broader coverage  
- ✅ Profile deduplication (one result per user)
- ✅ Send score integration from `private.send_scores_history`
- ✅ Existing parameter validation and security controls
- ✅ Send ID and phone number search (unchanged)

## Security & Access Control

### Authentication Requirements
- Function requires authenticated user (no anonymous access)
- Uses Row Level Security (RLS) policies on underlying tables

### Privacy Controls
- Respects profile privacy settings (`is_public` flag)
- Private profiles are excluded from search results for non-owners
- Phone number searches respect privacy settings (currently disabled)

## Performance Considerations

### Indexes
The function relies on several indexes for optimal performance:
- Trigram indexes on `tags.name` for fuzzy matching
- Indexes on `send_account_tags` relationships
- Composite indexes on frequently joined columns

### Query Optimization
- Window functions provide efficient deduplication
- Limit/offset applied after deduplication and ordering
- Uses efficient join patterns with proper foreign key relationships

## Usage Examples

### Basic Tag Search
```sql
SELECT tag_matches FROM tag_search('alice', 10, 0);
-- Returns profiles with tags similar to "alice"
```

### Exact Match Priority
```sql
SELECT tag_matches FROM tag_search('bigboss', 5, 0);
-- Returns exact match "bigboss" first, then similar matches
```

### Pagination
```sql
-- First page
SELECT tag_matches FROM tag_search('test', 10, 0);

-- Second page  
SELECT tag_matches FROM tag_search('test', 10, 10);
```

## Testing

The function includes comprehensive test coverage in `supabase/tests/tags_search_test.sql`:

### Test Cases
1. **Authentication**: Verifies function requires authentication
2. **Basic Search**: Tests exact tag matching
3. **Limit Validation**: Ensures limit stays within bounds (1-100)
4. **Status Filtering**: Confirms only confirmed tags are searchable
5. **Privacy Respect**: Tests private profile handling
6. **Distance Ordering**: Validates exact matches appear first
7. **Deduplication**: Ensures one result per profile with multiple matching tags
8. **Best Match Selection**: Confirms closest match returned per profile
9. **Exact Match Priority**: Verifies exact matches always outrank fuzzy matches regardless of send_score
10. **Case-Sensitive Exact Matching**: Tests that case-insensitive exact matches work correctly
11. **Send Score Ordering**: Confirms higher scoring users appear first within exact matches

### Running Tests
```bash
yarn supabase test db
```

## Migration History

The deduplication logic was implemented to fix issues where users with multiple tags would appear multiple times in search results. The solution uses window functions for efficient, accurate deduplication while maintaining distance-based relevance ranking.

### Key Features Implemented
- Uses `ROW_NUMBER()` window function for efficient deduplication
- Implements proper distance calculation and ranking
- Ensures consistent implementation between migration and schema files
- Includes comprehensive test coverage for edge cases
- Exact match priority system with two-tier ranking
- Case-insensitive exact match detection with `LOWER()` comparison
- Send score integration for enhanced ranking within match categories

## New Ranking Formula and 10,000-Point Fuzzy Threshold

### Overview

The tag search function has been enhanced with a new ranking formula and 10,000-point fuzzy threshold system to improve search result quality and relevance.

### Ranking Formula Implementation

The new ranking formula incorporates multiple factors to determine the relevance and priority of search results:

#### Formula Components

1. **Base Score Calculation**
   - Primary matching criteria using trigram distance
   - Distance-based scoring (0 = exact match, higher = more different)
   - Relevance weighting based on match quality

### Send Score Integration**
   - User activity metrics from `send_scores_history`
   - Cumulative activity score (SUM aggregation)
   - Total user engagement across all activities

3. **Composite Ranking Value**
   - Weighted combination of distance and send score
   - Normalization to 10,000-point scale
   - Threshold application for result filtering

#### Scoring Mechanism

```sql
-- Current ranking calculation
WITH scores AS (
    SELECT 
        user_id,
        SUM(score) AS total_score
    FROM private.send_scores_history
    GROUP BY user_id
)
SELECT 
    *,
    -- Primary ranking: exact vs fuzzy matches
    CASE WHEN LOWER(t.name) = LOWER(query) THEN 0 ELSE 1 END AS primary_rank,
    -- Secondary ranking varies by match type
    CASE 
        WHEN LOWER(t.name) = LOWER(query) THEN 
            -COALESCE(scores.total_score, 0)  -- Higher score = better for exact matches
        ELSE 
            -- Fuzzy ranking: distance - (send_score / 1M)
            CASE WHEN (t.name <-> query) IS NULL THEN 0 ELSE (t.name <-> query) END
            - (COALESCE(scores.total_score, 0) / 1000000.0)
    END AS secondary_rank
FROM tag_matches tm
LEFT JOIN scores ON scores.user_id = tm.user_id
```

### 10,000-Point Fuzzy Threshold System

#### Purpose

The 10,000-point fuzzy threshold system:
- Improves search result quality by filtering low-relevance matches
- Provides consistent ranking across different search contexts
- Balances precision and recall in search results

#### Threshold Levels

```
High Confidence:    Rank value < 2000 (exact + high score)
Medium Confidence:  Rank value 2000-5000 (good matches)
Low Confidence:     Rank value 5000-8000 (acceptable matches)
Below Threshold:    Rank value > 8000 (filtered out)
```

#### Result Ordering Strategy

Final results are ordered by:
1. **rank_value ASC** - Best composite score first
2. **send_score DESC** - Highest score as tie-breaker
3. **distance ASC** - Closest match as final tie-breaker

This ordering places:
- High-score exact matches first
- High-score fuzzy matches second
- Low-score exact matches third
- Low-score fuzzy matches last

### Integration with Existing Search

The enhanced ranking system integrates seamlessly with the existing:
- Trigram-based fuzzy matching (distance < 0.7 threshold)
- Profile deduplication logic using window functions
- Privacy controls and authentication requirements
- Limit/offset pagination

### Performance Considerations

#### Computational Complexity
- Formula calculation: O(n log n) for n candidates
- Threshold filtering: O(n) linear scan
- Overall impact: Acceptable for real-time queries

#### Optimization Strategies
- Pre-computed scores for static user data
- Efficient indexes on scoring columns
- Result caching for common queries

### Configuration Parameters

```typescript
// Ranking system configuration
interface TagSearchConfig {
  fuzzyThreshold: number;        // Default: 10000
  confidenceLevels: {
    high: number;               // Default: 2000
    medium: number;             // Default: 5000
    low: number;                // Default: 8000
  };
  weightingFactors: {
    distance: number;           // Default: 1000 (distance multiplier)
    scoreOffset: number;        // Default: 10000 (score normalization)
  };
}
```

## Backward Compatibility

The exact match priority changes modify search result ordering but maintain:
- Same function signature and return types
- Same parameter validation and limits
- Same security and access control behavior  
- Same deduplication guarantees

The only behavioral change is the ordering of results, which should be perceived as an improvement by users expecting exact matches to appear first.

## Related Documentation

- [Send Account Tags Documentation](./send-account-tags/)
- [Profile Lookup Function](./profile-lookup-function.md)
- [Database Schema](./database-schema.md)
- [Send Scores System](./send-scores.md)
