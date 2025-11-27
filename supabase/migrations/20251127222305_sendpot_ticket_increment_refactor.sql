alter table "public"."distributions" add column "sendpot_ticket_increment" integer default 10;

set check_function_bodies = off;

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
                WHEN jp.block_time IS NOT NULL THEN jp.block_time
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
                WHEN jp.block_time IS NOT NULL THEN jp.block_time
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

CREATE OR REPLACE FUNCTION public.insert_verification_sendpot_ticket_purchase()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    curr_distribution_id integer;
    curr_distribution_start_epoch numeric;
    curr_distribution_end_epoch numeric;
    buyer_user_id uuid;
    max_jackpot_block_time numeric;
    ticket_increment integer;
    total_tickets numeric;
    recalculated_weight numeric;
    existing_verification_id bigint;
BEGIN
    -- Get the current active distribution and ticket increment
    SELECT id, EXTRACT(EPOCH FROM qualification_start), EXTRACT(EPOCH FROM qualification_end), COALESCE(sendpot_ticket_increment, 10)
    INTO curr_distribution_id, curr_distribution_start_epoch, curr_distribution_end_epoch, ticket_increment
    FROM distributions
    WHERE qualification_start <= CURRENT_TIMESTAMP AT TIME ZONE 'UTC'
      AND qualification_end >= CURRENT_TIMESTAMP AT TIME ZONE 'UTC'
    ORDER BY qualification_start DESC
    LIMIT 1;

    -- Get user_id from send_accounts using buyer address
    SELECT user_id INTO buyer_user_id
    FROM send_accounts
    WHERE address_bytes = NEW.buyer;

    -- Exit early if no active distribution or user not found
    IF curr_distribution_id IS NULL OR buyer_user_id IS NULL THEN
        RETURN NEW;
    END IF;

    -- Get the largest (most recent) jackpot block_time
    SELECT COALESCE(MAX(block_time), 0) INTO max_jackpot_block_time
    FROM sendpot_jackpot_runs;

    -- Only process if this purchase is AFTER the last jackpot
    IF NEW.block_time <= max_jackpot_block_time THEN
        RETURN NEW;
    END IF;

    -- Calculate total tickets for this user in current distribution that are AFTER the last jackpot
    SELECT COALESCE(SUM(tickets_purchased_count), 0) INTO total_tickets
    FROM sendpot_user_ticket_purchases
    WHERE buyer = NEW.buyer
      AND block_time >= curr_distribution_start_epoch
      AND block_time < curr_distribution_end_epoch
      AND block_time > max_jackpot_block_time;
    
    -- Calculate weight: integer division by ticket increment
    recalculated_weight := FLOOR(total_tickets / ticket_increment);

    -- Find existing verification for this user/distribution/type in the same jackpot period
    -- If created_at > max_jackpot_block_time, it's in the current pending period
    SELECT id INTO existing_verification_id
    FROM distribution_verifications
    WHERE user_id = buyer_user_id
      AND distribution_id = curr_distribution_id
      AND type = 'sendpot_ticket_purchase'
      AND EXTRACT(EPOCH FROM created_at) > max_jackpot_block_time
    LIMIT 1;

    -- If no verification exists, insert it; otherwise update it
    IF existing_verification_id IS NULL THEN
        INSERT INTO distribution_verifications(
            distribution_id,
            user_id,
            type,
            weight,
            metadata,
            created_at
        )
        VALUES (
            curr_distribution_id,
            buyer_user_id,
            'sendpot_ticket_purchase',
            recalculated_weight,
            jsonb_build_object('lastJackpotEndTime', max_jackpot_block_time, 'value', total_tickets),
            to_timestamp(NEW.block_time) AT TIME ZONE 'UTC'
        );
    ELSE
        UPDATE distribution_verifications
        SET weight = recalculated_weight,
            created_at = to_timestamp(NEW.block_time) AT TIME ZONE 'UTC',
            metadata = jsonb_build_object('lastJackpotEndTime', max_jackpot_block_time, 'value', total_tickets)
        WHERE id = existing_verification_id;
    END IF;

    RETURN NEW;
END;
$function$
;


