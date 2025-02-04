set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.calculate_and_insert_send_ceiling_verification(distribution_number integer)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    -- Step 1: Get qualifying sends first
    CREATE TEMPORARY TABLE all_qualifying_sends AS
    SELECT * FROM sum_qualification_sends($1);
    CREATE TEMPORARY TABLE send_ceiling_settings AS
    WITH send_settings AS (SELECT minimum_sends * scaling_divisor AS divider
                           FROM send_slash s_s
                                    JOIN distributions d ON d.id = s_s.distribution_id
                           WHERE d.number = $1),
         previous_distribution AS (SELECT ds.user_id
                                        , case when $1 = 11 then
                                                   -- scale the amount correctly
                                                   ds.amount_after_slash * 1e16
                                               else ds.amount_after_slash end AS user_prev_shares
                                   FROM distribution_shares ds
                                   WHERE ds.distribution_id = (SELECT id FROM distributions d WHERE d.number = $1 - 1))
    SELECT qs.user_id,
           ROUND(COALESCE(pd.user_prev_shares, d.hodler_min_balance) / (SELECT minimum_sends * scaling_divisor
                                                                        FROM send_slash s_s
                                                                        WHERE s_s.distribution_id = (SELECT id FROM distributions WHERE number = $1)))::numeric AS send_ceiling
    FROM (SELECT DISTINCT user_id FROM all_qualifying_sends) qs
             CROSS JOIN(SELECT hodler_min_balance FROM distributions WHERE number = $1) d
             LEFT JOIN previous_distribution pd ON pd.user_id = qs.user_id;
    -- Step 2: Update existing verifications
    UPDATE distribution_verifications dv
    SET weight   = qs.amount,
        -- Cast to text to avoid overflow errors on client
        metadata = jsonb_build_object('value', scs.send_ceiling::text, 'sent_to', qs.sent_to)
    FROM send_ceiling_settings scs
             JOIN all_qualifying_sends qs ON qs.user_id = scs.user_id
    WHERE dv.user_id = qs.user_id
      AND dv.distribution_id = (SELECT id FROM distributions WHERE number = $1)
      AND dv.type = 'send_ceiling'
      AND COALESCE(qs.amount, 0) > 0;
    -- Step 3: Insert new verifications
    INSERT INTO distribution_verifications(distribution_id,
                                           user_id,
                                           type,
                                           weight,
                                           metadata)
    SELECT (SELECT id FROM distributions d WHERE d.number = $1),
           qs.user_id,
           'send_ceiling'::public.verification_type,
           qs.amount,
           -- Cast to text to avoid overflow errors on client
           jsonb_build_object('value', scs.send_ceiling::text, 'sent_to', qs.sent_to)
    FROM send_ceiling_settings scs
             JOIN all_qualifying_sends qs ON qs.user_id = scs.user_id
    WHERE COALESCE(qs.amount, 0) > 0
      AND NOT EXISTS(SELECT 1
                     FROM distribution_verifications dv
                     WHERE dv.user_id = qs.user_id
                       AND dv.distribution_id = (SELECT id FROM distributions WHERE number = $1)
                       AND dv.type = 'send_ceiling');
    -- Cleanup temporary tables
    DROP TABLE IF EXISTS send_ceiling_settings;
    DROP TABLE IF EXISTS all_qualifying_sends;
END;
$function$
;

revoke all on function public.calculate_and_insert_send_ceiling_verification(integer) from public;
revoke all on function public.calculate_and_insert_send_ceiling_verification(integer) from anon;
revoke all on function public.calculate_and_insert_send_ceiling_verification(integer) from authenticated;

CREATE OR REPLACE FUNCTION public.insert_verification_send_ceiling()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    _user_id             uuid;
    _recipient_address   citext;
    _distribution_id     integer;
    _distribution_number integer;
    _send_ceiling        numeric;
    _verification_exists boolean;
BEGIN
    -- Get the sender's user_id
    SELECT send_accounts.user_id
    INTO _user_id
    FROM send_accounts
    WHERE address = concat('0x', encode(NEW.f, 'hex'))::citext;
    -- Get recipient address
    _recipient_address := concat('0x', encode(NEW.t, 'hex'))::citext;
    -- Get the active distribution id and number
    SELECT d.id, d.number
    INTO _distribution_id, _distribution_number
    FROM distributions d
    WHERE extract(epoch FROM d.qualification_start) <= NEW.block_time
      AND extract(epoch FROM d.qualification_end) > NEW.block_time;
    -- If we found matching distribution and user
    IF _user_id IS NOT NULL AND _distribution_id IS NOT NULL THEN
        -- Check if verification exists
        SELECT EXISTS (SELECT 1
                       FROM distribution_verifications dv
                       WHERE dv.user_id = _user_id
                         AND distribution_id = _distribution_id
                         AND type = 'send_ceiling')
        INTO _verification_exists;
        IF NOT _verification_exists THEN
            -- Calculate send ceiling
            WITH send_settings AS (SELECT minimum_sends * scaling_divisor AS divider
                                   FROM send_slash s_s
                                            JOIN distributions d ON d.id = s_s.distribution_id
                                   WHERE d.number = _distribution_number),
                 previous_distribution AS (SELECT ds.user_id
                                                , case when _distribution_number = 11 then
                                                    -- scale the amount correctly
                                                           ds.amount_after_slash * 1e16
                                                    else ds.amount_after_slash end AS user_prev_shares
                                           FROM distribution_shares ds
                                           WHERE ds.distribution_id =
                                                 (SELECT id FROM distributions WHERE number = _distribution_number - 1)
                                             AND ds.user_id = _user_id),
                 distribution_info AS (SELECT hodler_min_balance FROM distributions WHERE id = _distribution_id)
            SELECT ROUND(COALESCE(pd.user_prev_shares, di.hodler_min_balance) / ss.divider)::numeric
            INTO _send_ceiling
            FROM distribution_info di
                     CROSS JOIN send_settings ss
                     LEFT JOIN previous_distribution pd ON pd.user_id = _user_id;
            -- Create new verification
            INSERT INTO distribution_verifications(distribution_id,
                                                   user_id,
                                                   type,
                                                   weight,
                                                   metadata)
            VALUES (_distribution_id,
                    _user_id,
                    'send_ceiling',
                    LEAST(NEW.v, _send_ceiling),
                       -- Cast to text to avoid overflow errors on client
                    jsonb_build_object('value', _send_ceiling::text, 'sent_to', ARRAY [_recipient_address] ::citext[]));
        ELSE
            -- Get the send ceiling for existing verification
            SELECT (metadata ->> 'value')::numeric
            INTO _send_ceiling
            FROM distribution_verifications dv
            WHERE dv.user_id = _user_id
              AND distribution_id = _distribution_id
              AND type = 'send_ceiling';
            -- Update existing verification, only if this recipient hasn't been counted before
            UPDATE distribution_verifications dv
            SET
                -- Cast to text to avoid overflow errors on client
                metadata = jsonb_build_object('value', _send_ceiling::text, 'sent_to',
                                              metadata -> 'sent_to' || jsonb_build_array(_recipient_address)),
                weight   = weight + LEAST(NEW.v, _send_ceiling)
            WHERE dv.user_id = _user_id
              AND distribution_id = _distribution_id
              AND type = 'send_ceiling';
        END IF;
    END IF;
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.sum_qualification_sends(distribution_number integer)
 RETURNS TABLE(user_id uuid, amount numeric, sent_to citext[])
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    -- Create temporary table to store qualification period
    CREATE TEMPORARY TABLE IF NOT EXISTS qual_period AS
    SELECT
        extract(epoch FROM qualification_start) AS start_time,
        extract(epoch FROM qualification_end) AS end_time
    FROM
        distributions
    WHERE
        number = $1;
    -- Create temporary table for first sends to each address
    CREATE TEMPORARY TABLE first_sends AS
    SELECT DISTINCT ON (sa.user_id, concat('0x', encode(stt.t, 'hex'))::citext) sa.user_id,
    concat('0x', encode(stt.t, 'hex'))::citext AS recipient,
    stt.v                                      AS send_amount, -- Store full amount, will cap later
    stt.block_time
    FROM send_token_transfers stt
             JOIN send_accounts sa ON sa.address = concat('0x', encode(stt.f, 'hex'))::citext
             CROSS JOIN qual_period qp
    WHERE stt.block_time >= qp.start_time
      AND stt.block_time < qp.end_time
    union
    SELECT DISTINCT ON (sa.user_id, concat('0x', encode(stt.t, 'hex'))::citext) sa.user_id,
    concat('0x', encode(stt.t, 'hex'))::citext AS recipient,
    case when $1 = 11 then
     -- scale the amount correctly for distribution 11
     stt.v * 1e16
    else stt.v end                                      AS send_amount, -- Store full amount, will cap later
    stt.block_time
    FROM send_token_v0_transfers stt
             JOIN send_accounts sa ON sa.address = concat('0x', encode(stt.f, 'hex'))::citext
             CROSS JOIN qual_period qp
    WHERE stt.block_time >= qp.start_time
      AND stt.block_time < qp.end_time;
    -- Create index for performance
    CREATE INDEX ON first_sends(user_id);

    -- Create send_ceiling_settings table
    CREATE TEMPORARY TABLE send_ceiling_settings AS
    WITH previous_distribution AS(
        SELECT
            ds.user_id
            , case when $1 = 11 then
               -- scale the amount correctly for distribution 11
               ds.amount_after_slash * 1e16
           else ds.amount_after_slash end AS user_prev_shares
        FROM
            distribution_shares ds
                JOIN distributions d ON d.id = ds.distribution_id
        WHERE
            d.number = $1 - 1
    )
    SELECT
        fs.user_id,
        ROUND(COALESCE(pd.user_prev_shares, d.hodler_min_balance) /(
            SELECT
                minimum_sends * scaling_divisor
            FROM send_slash s_s
            WHERE
                s_s.distribution_id =(
                    SELECT
                        id
                    FROM distributions
                    WHERE
                        number = $1)))::numeric AS send_ceiling
    FROM( SELECT DISTINCT
              first_sends.user_id
          FROM
              first_sends) fs
            CROSS JOIN(
        SELECT
            hodler_min_balance
        FROM
            distributions
        WHERE
            number = $1) d
            LEFT JOIN previous_distribution pd ON pd.user_id = fs.user_id;
    -- Return aggregated results with per-user send ceiling
    RETURN QUERY
        SELECT
            fs.user_id,
            SUM(LEAST(fs.send_amount, scs.send_ceiling)) AS amount,
            array_agg(fs.recipient) AS sent_to
        FROM
            first_sends fs
                JOIN send_ceiling_settings scs ON fs.user_id = scs.user_id
        GROUP BY
            fs.user_id;
    -- Cleanup
    DROP TABLE IF EXISTS qual_period;
    DROP TABLE IF EXISTS first_sends;
    DROP TABLE IF EXISTS send_ceiling_settings;
END;
$function$
;

revoke all on function public.sum_qualification_sends(integer) from public;
revoke all on function public.sum_qualification_sends(integer) from anon;
revoke all on function public.sum_qualification_sends(integer) from authenticated;
