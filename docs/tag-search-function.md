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
    phone text
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

**Problem Solved**: Previously, users with multiple tags matching a query would appear multiple times in results.

**Solution**: The function now implements profile deduplication using window functions:

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
1. **`ROW_NUMBER()` Window Function**: Ranks each user's tags by distance from query
2. **`PARTITION BY p.id`**: Groups by profile to ensure one result per user
3. **`ORDER BY (t.name <-> query)`**: Ranks by trigram distance (0 = exact match)
4. **Filter `WHERE rn = 1`**: Keeps only the best matching tag per profile
5. **Final `ORDER BY distance`**: Sorts results by relevance (exact matches first)

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

### Running Tests
```bash
yarn supabase test db
```

## Migration History

The deduplication logic was implemented to fix issues where users with multiple tags would appear multiple times in search results. The solution uses window functions for efficient, accurate deduplication while maintaining distance-based relevance ranking.

### Key Changes
- Replaced `DISTINCT ON(profile_id)` with `ROW_NUMBER()` window function
- Added proper distance calculation and ranking
- Ensured consistent implementation between migration and schema files
- Added comprehensive test coverage for edge cases

## Related Documentation

- [Send Account Tags Documentation](./send-account-tags/)
- [Profile Lookup Function](./profile-lookup-function.md)
- [Database Schema](./database-schema.md)