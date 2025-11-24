# Sendpot Ticket Purchase Tracking

## Overview

This document describes the implementation for tracking individual ticket purchases based on BPS (basis points) changes onchain.

## Background

The Sendpot smart contract emits `UserTicketPurchase` events with a **cumulative** `ticketsPurchasedTotalBps` value. To track the actual number of tickets purchased in each individual transaction, we calculate the incremental difference.

### BPS and Fee Structure

- **Base ticket value**: 10,000 BPS
- **Fee (feeBps)**: Variable, can change via `setFeeBps()`
  - Genesis to block 38567473: feeBps = 3,000 (net 7,000 BPS per ticket)
  - Block 38567474 onwards: feeBps = 7,000 (net 3,000 BPS per ticket)
- **Net BPS per ticket**: `10,000 - feeBps`
- **Ticket calculation**: `tickets = bps_delta / (10,000 - feeBps)`

Since `feeBps` has changed historically, we track its values to ensure accurate ticket calculations for all purchases.

## Implementation

### Database Schema Changes

#### 1. Ticket Count Column

Added a new column to the `sendpot_user_ticket_purchases` table:

- **Column**: `tickets_purchased_count` (numeric)
- **Purpose**: Stores the actual number of tickets purchased in each specific transaction
- **Calculation**: `bps_delta / (10,000 - feeBps)` using historical fee lookup

#### 2. Fee History Table

Created `sendpot_fee_history` table to track feeBps changes:

- **block_num**: When the fee changed
- **block_time**: Timestamp of the change
- **tx_hash**: Transaction that changed the fee (if applicable)
- **fee_bps**: The new fee value
- **created_at**: When the record was added

### Migrations

#### 1. `20251124000001_add_tickets_purchased_count.sql`
Adds the `tickets_purchased_count` column to the table.

#### 2. `20251124000002_sendpot_fee_history.sql`
- Creates `sendpot_fee_history` table for tracking fee changes
- Adds `get_fee_bps_at_block(block_num)` function to look up historical fees
- Adds `calculate_tickets_from_bps_with_fee(bps, block_num)` function for accurate calculations
- Inserts historical fee records:
  - Block 0: feeBps = 3000
  - Block 38567474: feeBps = 7000

#### 3. `20251124000003_calculate_incremental_tickets.sql`
- Creates a trigger function `calculate_tickets_purchased_count()` that automatically calculates incremental tickets on each insert
- Uses historical fee lookup to account for fee changes over time
- Adds a BEFORE INSERT trigger that runs the function
- Includes a backfill script to populate existing records

### How It Works

1. **On Insert**: When Shovel indexes a new `UserTicketPurchase` event:
   - The trigger finds the previous purchase by the same buyer
   - Calculates the BPS delta: `current_bps - previous_bps`
   - Looks up the historical feeBps at that block: `get_fee_bps_at_block(block_num)`
   - Calculates net BPS per ticket: `10,000 - feeBps`
   - Converts to tickets: `FLOOR(bps_delta / net_bps_per_ticket)`
   - Stores the result in `tickets_purchased_count`

2. **Fee Lookup**: The `get_fee_bps_at_block()` function:
   - Queries `sendpot_fee_history` for the most recent fee at or before the target block
   - Returns the appropriate feeBps value (defaults to 3000 if no history found)
   - Ensures accurate calculations even when fees change

3. **For First Purchase**: If no previous purchase exists, `previous_bps = 0`, so the full cumulative BPS is converted to tickets.

4. **Ordering**: Purchases are ordered chronologically by `(block_num, tx_idx, log_idx)` to ensure correct calculation.

## Testing

### Prerequisites

1. Start Docker/OrbStack
2. Ensure local Supabase instance is available

### Steps

1. **Reset the database to apply migrations**:
   ```bash
   cd supabase
   yarn supabase stop
   yarn supabase start
   ```

2. **Regenerate TypeScript types**:
   ```bash
   cd supabase
   yarn generate
   ```

3. **Run Supabase tests**:
   ```bash
   cd supabase
   yarn supabase test
   ```

4. **Verify the data**:
   ```sql
   -- Check that tickets_purchased_count is populated
   SELECT
     buyer,
     block_num,
     tickets_purchased_total_bps,
     tickets_purchased_count,
     tickets_purchased_total_bps / 7000 as expected_cumulative_tickets
   FROM sendpot_user_ticket_purchases
   ORDER BY buyer, block_num, tx_idx, log_idx
   LIMIT 20;
   ```

5. **Verify incremental calculation**:
   ```sql
   -- For a specific buyer, show the progression
   WITH ranked_purchases AS (
     SELECT
       block_num,
       tickets_purchased_total_bps,
       tickets_purchased_count,
       LAG(tickets_purchased_total_bps) OVER (ORDER BY block_num, tx_idx, log_idx) as prev_bps
     FROM sendpot_user_ticket_purchases
     WHERE buyer = '\x...' -- Replace with actual buyer address
     ORDER BY block_num, tx_idx, log_idx
   )
   SELECT
     block_num,
     tickets_purchased_total_bps,
     prev_bps,
     tickets_purchased_total_bps - COALESCE(prev_bps, 0) as bps_delta,
     tickets_purchased_count
   FROM ranked_purchases;
   ```

## Usage Examples

### Query individual ticket purchases
```sql
-- Get ticket purchases with incremental counts
SELECT
  to_timestamp(block_time) as purchase_time,
  encode(buyer, 'hex') as buyer_address,
  tickets_purchased_count as tickets_bought,
  tickets_purchased_total_bps / 7000 as total_tickets_owned
FROM sendpot_user_ticket_purchases
WHERE buyer = '\x...' -- Replace with buyer address bytes
ORDER BY block_time DESC;
```

### Sum total tickets purchased by a user
```sql
-- Total tickets ever purchased (across all transactions)
SELECT
  encode(buyer, 'hex') as buyer_address,
  SUM(tickets_purchased_count) as total_tickets_purchased,
  COUNT(*) as purchase_count
FROM sendpot_user_ticket_purchases
GROUP BY buyer
ORDER BY total_tickets_purchased DESC;
```

### Activity Feed Integration
```typescript
// In TypeScript code, access the new field:
const ticketCount = purchase.tickets_purchased_count
console.log(`User purchased ${ticketCount} tickets`)
```

## Integration Points

### 1. Activity Feed (`packages/app/utils/activity.tsx`)
Update to display incremental ticket counts:
```typescript
// Before: Calculated from value or BPS
const ticketCount = calculateTicketsFromBps(tickets_purchased_total_bps)

// After: Use stored incremental count
const ticketCount = tickets_purchased_count
```

### 2. Distribution Verifications
The existing `insert_verification_sendpot_ticket_purchase` trigger uses cumulative BPS for weighting, which remains unchanged.

### 3. Jackpot History
Can now show per-transaction ticket purchases in user history.

## Deployment

### Staging/Production

1. **Apply migrations**:
   ```bash
   # Migrations will be applied automatically via CI/CD
   # or manually via Supabase CLI
   cd supabase
   supabase db push
   ```

2. **Verify backfill**:
   - Check that all existing records have `tickets_purchased_count` populated
   - Verify calculations are correct by sampling records

3. **Monitor Shovel indexing**:
   - New events will automatically have `tickets_purchased_count` calculated
   - No changes needed to Shovel configuration

## Tracking Fee Changes

### When feeBps Changes

When the contract owner calls `setFeeBps()` to change the fee, you must update the `sendpot_fee_history` table:

```sql
-- Insert new fee record
INSERT INTO sendpot_fee_history (block_num, block_time, tx_hash, fee_bps)
VALUES (
  <block_number>,           -- Block where setFeeBps was called
  <block_timestamp>,        -- Timestamp of that block
  '\x<transaction_hash>',   -- Transaction hash (as bytea)
  <new_fee_bps>            -- New fee value
);
```

### Monitoring for Fee Changes

**Option 1: Manual Monitoring**
- Watch the contract on a blockchain explorer
- Subscribe to contract events/transactions
- Manually insert records when changes occur

**Option 2: Automated Monitoring (Future Enhancement)**
- Set up Shovel to index all contract transactions
- Filter for `setFeeBps` function calls by decoding `tx_input`
- Automatically insert into `sendpot_fee_history`

### Checking Current Fee

Query the contract directly:
```bash
# Using cast (Foundry)
cast call 0xa0A5611b9A1071a1D8A308882065c48650bAeE8b "feeBps()" --rpc-url <BASE_RPC_URL>

# Or use getJackpotFee()
cast call 0xa0A5611b9A1071a1D8A308882065c48650bAeE8b "getJackpotFee()" --rpc-url <BASE_RPC_URL>
```

### Verifying Fee History

```sql
-- View all fee changes
SELECT
  block_num,
  to_timestamp(block_time) as changed_at,
  encode(tx_hash, 'hex') as tx_hash,
  fee_bps,
  (10000 - fee_bps) as net_bps_per_ticket
FROM sendpot_fee_history
ORDER BY block_num;

-- Check what fee was active at a specific block
SELECT get_fee_bps_at_block(<block_number>);
```

## Benefits

1. **Clearer User History**: Show exactly how many tickets were purchased in each transaction
2. **Accurate Activity Feed**: Display "Purchased X tickets" without calculation
3. **Analytics**: Easier to analyze purchase patterns and behavior
4. **Performance**: Pre-calculated values reduce runtime computation
5. **Fee Change Support**: Automatically handles historical fee changes for accurate calculations

## Notes

- The `tickets_purchased_total_bps` field remains unchanged and continues to be used for distribution weighting
- BPS calculation formula:
  - Base ticket = 10,000 BPS
  - Historical fees:
    - Block 0-38567473: fee = 3,000 BPS → 7,000 BPS per ticket
    - Block 38567474+: fee = 7,000 BPS → 3,000 BPS per ticket
  - `BPS_PER_TICKET` constant in code may need updating to reflect current net value
- Ticket price: 30 SEND tokens per ticket
- The trigger function uses FLOOR division to handle partial BPS amounts
- Historical fee tracking ensures accurate calculations across the fee change at block 38567474

## Troubleshooting

### If `tickets_purchased_count` is NULL
Run the backfill query from the migration manually:
```sql
WITH ordered_purchases AS (
    SELECT
        id,
        buyer,
        tickets_purchased_total_bps,
        LAG(tickets_purchased_total_bps) OVER (
            PARTITION BY buyer
            ORDER BY block_num, tx_idx, log_idx
        ) AS prev_total_bps
    FROM sendpot_user_ticket_purchases
)
UPDATE sendpot_user_ticket_purchases AS utp
SET tickets_purchased_count = FLOOR(
    (op.tickets_purchased_total_bps - COALESCE(op.prev_total_bps, 0)) / 7000
)
FROM ordered_purchases AS op
WHERE utp.id = op.id;
```

### If calculations seem incorrect
Check the following:
1. **Verify fee history**:
   ```sql
   SELECT * FROM sendpot_fee_history ORDER BY block_num;
   ```
   Ensure the correct feeBps values are recorded

2. **Check fee at specific block**:
   ```sql
   SELECT get_fee_bps_at_block(<block_num>);
   ```
   Verify the function returns the expected fee

3. **Manually calculate tickets**:
   ```sql
   SELECT
     calculate_tickets_from_bps_with_fee(<bps_delta>, <block_num>) as tickets;
   ```

4. **Common issues**:
   - Missing fee history records (should have block 0 with fee 3000 and block 38567474 with fee 7000)
   - Out-of-order events (Shovel should handle chronological ordering)
   - Duplicate events (unique index should prevent this)
   - Missing buyer addresses

### If feeBps changes aren't reflected
After inserting a new fee record, existing ticket counts won't automatically recalculate (they're already correct for their purchase time). Only new purchases after the fee change will use the new fee value.
