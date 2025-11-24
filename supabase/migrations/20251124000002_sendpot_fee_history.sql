set check_function_bodies = off;

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

-- Grant permissions
REVOKE ALL ON FUNCTION public.get_fee_bps_at_block(numeric) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_fee_bps_at_block(numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_fee_bps_at_block(numeric) TO service_role;

REVOKE ALL ON FUNCTION public.calculate_tickets_from_bps_with_fee(numeric, numeric) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.calculate_tickets_from_bps_with_fee(numeric, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_tickets_from_bps_with_fee(numeric, numeric) TO service_role;

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

COMMENT ON FUNCTION public.get_fee_bps_at_block IS 'Returns the feeBps value that was active at the specified block number';
COMMENT ON FUNCTION public.calculate_tickets_from_bps_with_fee IS 'Calculates the number of tickets from BPS delta using the historical fee at the given block';
