set check_function_bodies = off;

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
