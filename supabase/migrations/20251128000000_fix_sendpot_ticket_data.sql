-- Fix sendpot ticket verification data and align batch function logic

-- 1. Update the function to use prev_block_time (Start of Period) and correct column name
CREATE OR REPLACE FUNCTION public.insert_sendpot_ticket_purchase_verifications(distribution_num integer)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
    -- Insert verification rows for ticket purchases grouped by jackpot period
    -- Pattern mirrored from insert_create_passkey_verifications
    WITH distribution_info AS (
        SELECT
            id,
            qualification_start,
            qualification_end,
            COALESCE(sendpot_ticket_increment, 10) AS ticket_increment
        FROM
            distributions
        WHERE
            "number" = distribution_num
        LIMIT 1
    ),
    -- Get all jackpot runs that occurred during this distribution
    jackpot_periods AS (
        SELECT
            block_time,
            COALESCE(
                LAG(block_time) OVER (ORDER BY block_time ASC),
                0
            ) AS prev_block_time
        FROM sendpot_jackpot_runs
        WHERE block_time >= EXTRACT(EPOCH FROM (
            SELECT qualification_start FROM distribution_info
        ))
        AND block_time <= EXTRACT(EPOCH FROM (
            SELECT qualification_end FROM distribution_info
        ))
    ),
    max_jackpot AS (
        SELECT COALESCE(MAX(block_time), 0) AS max_block_time
        FROM sendpot_jackpot_runs
    ),
    -- Group ticket purchases by user and jackpot period
    purchases_by_period AS (
        SELECT
            sa.user_id,
            CASE
                -- If matched a completed jackpot period, use that
                WHEN jp.block_time IS NOT NULL THEN jp.prev_block_time
                -- If purchase is after max jackpot, use max jackpot (pending period)
                WHEN (SELECT max_block_time FROM max_jackpot) > 0
                     AND utp.block_time > (SELECT max_block_time FROM max_jackpot)
                THEN (SELECT max_block_time FROM max_jackpot)
                -- Otherwise, use 0 (before first jackpot or no jackpots exist)
                ELSE 0
            END AS jackpot_block_time,
            SUM(utp.tickets_purchased_count) AS total_ticket_count,
            MAX(to_timestamp(utp.block_time) AT TIME ZONE 'UTC') AS last_purchase_time
        FROM sendpot_user_ticket_purchases utp
        JOIN send_accounts sa ON sa.address_bytes = utp.buyer
        -- Find the jackpot period this purchase belongs to
        LEFT JOIN jackpot_periods jp ON utp.block_time > jp.prev_block_time
            AND utp.block_time <= jp.block_time
        WHERE utp.block_time >= EXTRACT(EPOCH FROM (
            SELECT qualification_start FROM distribution_info
        ))
        AND utp.block_time < EXTRACT(EPOCH FROM (
            SELECT qualification_end FROM distribution_info
        ))
        GROUP BY sa.user_id,
            CASE
                WHEN jp.block_time IS NOT NULL THEN jp.prev_block_time
                WHEN (SELECT max_block_time FROM max_jackpot) > 0
                     AND utp.block_time > (SELECT max_block_time FROM max_jackpot)
                THEN (SELECT max_block_time FROM max_jackpot)
                ELSE 0
            END
    )
    INSERT INTO public.distribution_verifications(
        distribution_id,
        user_id,
        type,
        weight,
        metadata,
        created_at
    )
    SELECT
        (SELECT id FROM distribution_info),
        pbp.user_id,
        'sendpot_ticket_purchase'::public.verification_type,
        FLOOR(pbp.total_ticket_count / (SELECT ticket_increment FROM distribution_info)),
        jsonb_build_object('lastJackpotEndTime', pbp.jackpot_block_time, 'value', pbp.total_ticket_count),
        pbp.last_purchase_time
    FROM purchases_by_period pbp
    WHERE pbp.user_id IS NOT NULL;
END;
$function$
;

-- 2. Data Migration
DO $$
DECLARE
    dist_record RECORD;
    inserted_count integer;
BEGIN
    RAISE NOTICE 'Starting fix for sendpot_ticket_purchase verifications...';

    -- Delete all existing sendpot_ticket_purchase verifications
    -- This wipes the slate clean to remove duplicate/summed/borked rows
    DELETE FROM distribution_verifications
    WHERE type = 'sendpot_ticket_purchase';

    RAISE NOTICE 'Deleted existing sendpot_ticket_purchase verifications';

    -- Loop through all distributions that have started AND have the matching distribution_verification_values entry
    FOR dist_record IN
        SELECT d."number"
        FROM distributions d
        INNER JOIN distribution_verification_values dvv
            ON dvv.distribution_id = d.id
            AND dvv.type = 'sendpot_ticket_purchase'
        WHERE d.qualification_start <= (now() AT TIME ZONE 'utc')
        ORDER BY d."number"
    LOOP
        RAISE NOTICE 'Processing distribution #%', dist_record."number";

        -- Call the (now updated) batch function to recalculate and insert correct rows
        PERFORM public.insert_sendpot_ticket_purchase_verifications(dist_record."number");
    END LOOP;

    SELECT COUNT(*) INTO inserted_count
    FROM distribution_verifications
    WHERE type = 'sendpot_ticket_purchase';

    RAISE NOTICE 'Finished. Inserted % clean verification rows.', inserted_count;
END $$;
