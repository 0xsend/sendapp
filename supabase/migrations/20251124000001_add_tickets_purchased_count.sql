set check_function_bodies = off;

-- ============================================================================
-- Part 1: Create Fee History Infrastructure
-- ============================================================================

-- Create table to track historical feeBps changes for the Sendpot contract
-- This allows accurate ticket calculation based on the fee at time of purchase
CREATE TABLE IF NOT EXISTS "public"."sendpot_fee_history" (
    "id" bigserial PRIMARY KEY,
    "block_num" numeric NOT NULL,
    "block_time" numeric NOT NULL,
    "tx_hash" bytea,
    "fee_bps" numeric NOT NULL,
    "created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE "public"."sendpot_fee_history" OWNER TO "postgres";

-- Index for efficient lookups by block number
CREATE INDEX "idx_sendpot_fee_history_block_num" ON "public"."sendpot_fee_history" USING "btree" ("block_num");

-- Unique constraint to prevent duplicate entries for the same block
CREATE UNIQUE INDEX "u_sendpot_fee_history_block_num" ON "public"."sendpot_fee_history" USING "btree" ("block_num");

-- RLS: This is read-only reference data, allow all authenticated users to read
ALTER TABLE "public"."sendpot_fee_history" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fee_history_select_policy" ON "public"."sendpot_fee_history" FOR SELECT USING (true);

-- Grants
GRANT SELECT ON TABLE "public"."sendpot_fee_history" TO "anon";
GRANT SELECT ON TABLE "public"."sendpot_fee_history" TO "authenticated";
GRANT ALL ON TABLE "public"."sendpot_fee_history" TO "service_role";

GRANT USAGE ON SEQUENCE "public"."sendpot_fee_history_id_seq" TO "service_role";

-- Insert historical fee values
-- Fee history for the Sendpot contract:
-- 1. From genesis (block 0) to block 38567473: feeBps = 3000 (net 7000 BPS per ticket)
-- 2. From block 38567474 onwards: feeBps = 7000 (net 3000 BPS per ticket)

INSERT INTO public.sendpot_fee_history (block_num, block_time, fee_bps, tx_hash)
VALUES
    (0, 0, 3000, NULL),
    (38567474, 0, 7000, NULL)  -- Fee increased at this block
ON CONFLICT (block_num) DO NOTHING;

COMMENT ON TABLE public.sendpot_fee_history IS 'Historical feeBps values for the Sendpot contract. Fee increased from 3000 to 7000 at block 38567474.';

-- Create function to get the feeBps at a specific block
-- This function looks up the most recent fee change at or before the given block
CREATE OR REPLACE FUNCTION public.get_fee_bps_at_block(target_block_num numeric)
RETURNS numeric
LANGUAGE plpgsql
STABLE
AS $function$
DECLARE
    fee numeric;
    BASE_TICKET_BPS constant numeric := 10000;
    DEFAULT_FEE_BPS constant numeric := 7000; -- Current fee (changed from 3000 at block 38567474)
BEGIN
    -- Find the most recent fee at or before the target block
    SELECT fee_bps INTO fee
    FROM sendpot_fee_history
    WHERE block_num <= target_block_num
    ORDER BY block_num DESC
    LIMIT 1;

    -- If no fee found (before first fee change), return default
    IF fee IS NULL THEN
        fee := DEFAULT_FEE_BPS;
    END IF;

    RETURN fee;
END;
$function$;

ALTER FUNCTION public.get_fee_bps_at_block(numeric) OWNER TO postgres;

COMMENT ON FUNCTION public.get_fee_bps_at_block IS 'Returns the feeBps value that was active at the specified block number';

-- Create function to calculate tickets from BPS using historical fee
-- Formula: tickets = bps_delta / (BASE_TICKET_BPS - feeBps)
-- where BASE_TICKET_BPS = 10,000 and feeBps varies by block
CREATE OR REPLACE FUNCTION public.calculate_tickets_from_bps_with_fee(
    bps_delta numeric,
    block_num numeric
)
RETURNS numeric
LANGUAGE plpgsql
STABLE
AS $function$
DECLARE
    fee_bps numeric;
    net_bps_per_ticket numeric;
    BASE_TICKET_BPS constant numeric := 10000;
BEGIN
    IF bps_delta <= 0 THEN
        RETURN 0;
    END IF;

    -- Get the fee at the time of this purchase
    fee_bps := get_fee_bps_at_block(block_num);

    -- Calculate net BPS per ticket after fee
    -- Formula: netBPS = baseBPS - feeBPS
    -- Example: 10,000 - 3,000 = 7,000 BPS per ticket
    net_bps_per_ticket := BASE_TICKET_BPS - fee_bps;

    -- Avoid division by zero
    IF net_bps_per_ticket <= 0 THEN
        RAISE EXCEPTION 'Invalid fee configuration: net_bps_per_ticket = %', net_bps_per_ticket;
    END IF;

    -- Calculate tickets using floor division
    RETURN FLOOR(bps_delta / net_bps_per_ticket);
END;
$function$;

ALTER FUNCTION public.calculate_tickets_from_bps_with_fee(numeric, numeric) OWNER TO postgres;

COMMENT ON FUNCTION public.calculate_tickets_from_bps_with_fee IS 'Calculates the number of tickets from BPS delta using the historical fee at the given block';

-- Grant permissions
REVOKE ALL ON FUNCTION public.get_fee_bps_at_block(numeric) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_fee_bps_at_block(numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_fee_bps_at_block(numeric) TO service_role;

REVOKE ALL ON FUNCTION public.calculate_tickets_from_bps_with_fee(numeric, numeric) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.calculate_tickets_from_bps_with_fee(numeric, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_tickets_from_bps_with_fee(numeric, numeric) TO service_role;

-- ============================================================================
-- Part 2: Add Ticket Count Column
-- ============================================================================

-- Add tickets_purchased_count column to track incremental tickets per transaction
-- This column stores the actual number of tickets purchased in THIS specific transaction
-- (as opposed to tickets_purchased_total_bps which is cumulative)

ALTER TABLE public.sendpot_user_ticket_purchases
ADD COLUMN IF NOT EXISTS tickets_purchased_count numeric;

-- Add comment for clarity
COMMENT ON COLUMN public.sendpot_user_ticket_purchases.tickets_purchased_count
IS 'The number of tickets purchased in this specific transaction (incremental, not cumulative). Calculated using historical feeBps values.';

-- ============================================================================
-- Part 3: Update Jackpot Summary Functions
-- ============================================================================

-- Update jackpot summary and pending tickets functions to use tickets_purchased_count
-- instead of tickets_purchased_total_bps for accurate ticket counts from the database

CREATE OR REPLACE FUNCTION public.get_user_jackpot_summary(num_runs integer)
 RETURNS TABLE(jackpot_run_id integer, jackpot_block_num numeric, jackpot_block_time numeric, winner bytea, win_amount numeric, total_tickets numeric, winner_tag_name citext)
 LANGUAGE sql
AS $function$
WITH cte AS (
  SELECT
    r.id AS jackpot_run_id,
    r.block_num AS jackpot_block_num,
    r.block_time AS jackpot_block_time,
    r.winner,
    r.win_amount,
    -- "prev_block_num" is the block_num of the previous jackpot (or 0 if none)
    COALESCE(
      LAG(r.block_num) OVER (ORDER BY r.block_num ASC),
      0
    ) AS prev_block_num
  FROM public.sendpot_jackpot_runs r
)
SELECT
  c.jackpot_run_id,
  c.jackpot_block_num,
  c.jackpot_block_time,
  c.winner,
  c.win_amount,
  (
    SELECT COALESCE(SUM(utp.tickets_purchased_count), 0)
    FROM public.sendpot_user_ticket_purchases utp
    WHERE utp.block_num >= c.prev_block_num
      AND utp.block_num < c.jackpot_block_num
  ) AS total_tickets,
  pl.winner_tag_name
FROM cte c
LEFT JOIN LATERAL (
  SELECT COALESCE(pl.main_tag_name, pl.all_tags[1])::public.citext AS winner_tag_name
  FROM public.profile_lookup(
    'address'::public.lookup_type_enum,
    concat('0x', encode(c.winner, 'hex'))::text
  ) pl
  LIMIT 1
) pl ON c.winner IS NOT NULL
ORDER BY c.jackpot_block_num DESC
LIMIT num_runs;
$function$;

CREATE OR REPLACE FUNCTION public.get_pending_jackpot_tickets_purchased()
 RETURNS numeric
 LANGUAGE sql
AS $function$
WITH last_jackpot AS (
    -- Retrieve the maximum block number from the sendpot_jackpot_runs table.
  -- This block number represents the end of the last completed jackpot.
  -- If no jackpot runs exist, use 0 as the default value.
  SELECT COALESCE(MAX(block_num), 0) AS last_block
  FROM public.sendpot_jackpot_runs
)
-- Sum the actual ticket counts from the sendpot_user_ticket_purchases table
-- for all purchases since the last completed jackpot
SELECT COALESCE(SUM(tickets_purchased_count), 0) AS total_tickets
FROM public.sendpot_user_ticket_purchases
WHERE block_num >= (SELECT last_block FROM last_jackpot);
$function$;

-- ============================================================================
-- Part 4: Create Trigger for Automatic Ticket Calculation
-- ============================================================================

-- Create function to calculate incremental tickets purchased
-- This function calculates the actual number of tickets purchased in a transaction
-- by finding the difference between current and previous BPS totals

CREATE OR REPLACE FUNCTION public.calculate_tickets_purchased_count()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
    prev_total_bps numeric;
    bps_delta numeric;
    tickets_count numeric;
BEGIN
    -- Find the previous purchase for this buyer
    -- Order by block_num, tx_idx, log_idx to get chronological order
    SELECT tickets_purchased_total_bps INTO prev_total_bps
    FROM sendpot_user_ticket_purchases
    WHERE buyer = NEW.buyer
      AND (
        block_num < NEW.block_num
        OR (block_num = NEW.block_num AND tx_idx < NEW.tx_idx)
        OR (block_num = NEW.block_num AND tx_idx = NEW.tx_idx AND log_idx < NEW.log_idx)
      )
    ORDER BY block_num DESC, tx_idx DESC, log_idx DESC
    LIMIT 1;

    -- If no previous purchase found, this is the first purchase
    IF prev_total_bps IS NULL THEN
        prev_total_bps := 0;
    END IF;

    -- Calculate the BPS delta for this transaction
    bps_delta := NEW.tickets_purchased_total_bps - prev_total_bps;

    -- Convert BPS to ticket count using historical fee lookup
    -- This function accounts for fee changes over time
    tickets_count := calculate_tickets_from_bps_with_fee(bps_delta, NEW.block_num);

    -- Set the calculated value
    NEW.tickets_purchased_count := tickets_count;

    RETURN NEW;
END;
$function$;

ALTER FUNCTION public.calculate_tickets_purchased_count() OWNER TO postgres;

-- Create trigger to automatically calculate tickets_purchased_count on insert
-- This trigger runs BEFORE INSERT so we can modify the NEW record before it's saved
CREATE OR REPLACE TRIGGER calculate_tickets_purchased_count_trigger
BEFORE INSERT ON public.sendpot_user_ticket_purchases
FOR EACH ROW
EXECUTE FUNCTION public.calculate_tickets_purchased_count();

-- Grant necessary permissions
REVOKE ALL ON FUNCTION public.calculate_tickets_purchased_count() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.calculate_tickets_purchased_count() FROM authenticated;
GRANT ALL ON FUNCTION public.calculate_tickets_purchased_count() TO service_role;

-- ============================================================================
-- Part 5: Backfill Existing Records
-- ============================================================================

-- Backfill existing records
-- Calculate tickets_purchased_count for all existing records
-- Uses a window function to get the previous BPS total for each buyer
-- and the historical fee lookup function for accurate calculations
WITH ordered_purchases AS (
    SELECT
        id,
        buyer,
        tickets_purchased_total_bps,
        LAG(tickets_purchased_total_bps) OVER (
            PARTITION BY buyer
            ORDER BY block_num, tx_idx, log_idx
        ) AS prev_total_bps,
        block_num,
        tx_idx,
        log_idx
    FROM sendpot_user_ticket_purchases
    ORDER BY buyer, block_num, tx_idx, log_idx
)
UPDATE sendpot_user_ticket_purchases AS utp
SET tickets_purchased_count = calculate_tickets_from_bps_with_fee(
    op.tickets_purchased_total_bps - COALESCE(op.prev_total_bps, 0),
    op.block_num
)
FROM ordered_purchases AS op
WHERE utp.id = op.id
  AND utp.tickets_purchased_count IS NULL;
