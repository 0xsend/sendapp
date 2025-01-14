-- Update the distributions table to include the merkle drop address and token decimals
-- So that both send token v0 and send token v1 can use the same distributions table

-- include the merkle drop contract address, and token decimals
-- update amount, and hodler_min_balance to use numeric format
alter table distributions
    add column merkle_drop_addr bytea,
    add column token_addr bytea,
    add column token_decimals   numeric,
    alter column amount type numeric,
    alter column hodler_min_balance type numeric;

-- drop the distribution_verifications_summary view (will be recreated)
drop view distribution_verifications_summary;

-- update distribution verification values to use numeric format
alter table distribution_verification_values
    alter column fixed_value type numeric;

-- update distribution verifications to use numeric format
alter table distribution_verifications
    alter column weight type numeric;

-- update affiliate stats to use numeric format
alter table affiliate_stats
    alter column send_plus_minus type numeric;

-- scale affiliate stats
update affiliate_stats
set send_plus_minus = send_plus_minus * 1e16
where send_plus_minus > 0;

-- TODO(@0xBigBoss): decide if we still need this view after enabling RLS policies on distribution verifications
-- Recreate the distribution verification summary view using numeric format for weight
alter type verification_value_info alter attribute weight type numeric;
-- add text type for numeric values to avoid overflow errors on client
alter type verification_value_info add attribute weight_text text;

-- TODO(@0xBigBoss): decide if we still need this view after enabling RLS policies on distribution verifications
-- Same for multiplier_info
alter type multiplier_info alter attribute value type numeric;
alter type multiplier_info add attribute value_text text;

-- TODO(@0xBigBoss): decide if we still need this view after enabling RLS policies on distribution verifications
CREATE OR REPLACE VIEW "public"."distribution_verifications_summary" WITH ( security_barrier ) AS
WITH base_counts AS (SELECT dv.distribution_id,
                            dv.user_id,
                            dv.type,
                            max(dv.created_at)     AS created_at,
                            sum(dv.weight)         AS total_weight,
                            jsonb_agg(dv.metadata) AS combined_metadata
                     FROM distribution_verifications dv
                              LEFT JOIN distribution_verification_values dvv_1
                                        ON dvv_1.distribution_id = dv.distribution_id AND dvv_1.type = dv.type
                     WHERE dv.user_id = auth.uid()
                     GROUP BY dv.distribution_id, dv.user_id, dv.type)
SELECT dvv.distribution_id,
       COALESCE(bc.user_id, auth.uid())                                              AS user_id,
       array_agg(DISTINCT
                 ROW (dvv.type::text
                     , COALESCE(bc.total_weight, 0)::numeric
                     , dvv.fixed_value::text
                     , dvv.bips_value::text
                     , COALESCE(bc.combined_metadata, '[]'::jsonb)
                     , bc.created_at
                     , COALESCE(bc.total_weight, 0)::text)::verification_value_info) AS verification_values
        ,
       array_agg(DISTINCT ROW (dvv.type::text
           , (CASE
                  WHEN COALESCE(dvv.multiplier_min, 1.0) = 1.0 AND
                       COALESCE(dvv.multiplier_max, 1.0) = 1.0 AND
                       COALESCE(dvv.multiplier_step, 0.0) = 0.0 OR
                       COALESCE(bc.total_weight, 0::numeric) = 0 THEN NULL
                  ELSE LEAST(dvv.multiplier_min +
                             (COALESCE(bc.total_weight, 1::numeric) - 1::numeric) *
                             dvv.multiplier_step,
                             dvv.multiplier_max) END)::numeric
           , dvv.multiplier_min::numeric
           , dvv.multiplier_max::numeric
           , dvv.multiplier_step::numeric
           , COALESCE(bc.combined_metadata, '[]'::jsonb)
           , (CASE
                  WHEN COALESCE(dvv.multiplier_min, 1.0) = 1.0 AND
                       COALESCE(dvv.multiplier_max, 1.0) = 1.0 AND
                       COALESCE(dvv.multiplier_step, 0.0) = 0.0 OR
                       COALESCE(bc.total_weight, 0::numeric) = 0 THEN NULL
                  ELSE LEAST(dvv.multiplier_min +
                             (COALESCE(bc.total_weight, 1::numeric) - 1::numeric) *
                             dvv.multiplier_step,
                             dvv.multiplier_max) END)::text)::multiplier_info)       AS multipliers
FROM distribution_verification_values dvv
         LEFT JOIN base_counts bc ON bc.distribution_id = dvv.distribution_id AND bc.type = dvv.type
GROUP BY dvv.distribution_id, (COALESCE(bc.user_id, auth.uid()));

-- Add RLS policies to distribution verifications to simplify summary
create policy "Users can see their own distribution verifications"
    on public.distribution_verifications
    for select using ((select auth.uid()) = distribution_verifications.user_id);

-- Authenticated users can see distribution_verification_values
create policy "Authenticated users can see distribution_verification_values"
    on public.distribution_verification_values
    for select using ((select auth.uid()) is not null) ;

-- Add foreign key constraints to distribution verifications to pull in verification values
alter table distribution_verifications
    add constraint distribution_verification_values_fk foreign key (type, distribution_id)
        references distribution_verification_values (type, distribution_id);

-- update distribution shares to use numeric format
alter table distribution_shares
    alter column amount type numeric,
    alter column hodler_pool_amount type numeric,
    alter column bonus_pool_amount type numeric,
    alter column fixed_pool_amount type numeric;

-- update send_ceiling verifications to use numeric format ensuring jsonb type uses text for clientside javascript
create or replace function insert_verification_send_ceiling() returns trigger
    language plpgsql as
$$
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
                 previous_distribution AS (SELECT ds.user_id, ds.amount_after_slash AS user_prev_shares
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
$$;

create or replace function calculate_and_insert_send_ceiling_verification(distribution_number integer) returns void
    security definer
    language plpgsql as
$$
BEGIN
    -- Step 1: Get qualifying sends first
    CREATE TEMPORARY TABLE all_qualifying_sends AS
    SELECT * FROM sum_qualification_sends($1);
    CREATE TEMPORARY TABLE send_ceiling_settings AS
    WITH send_settings AS (SELECT minimum_sends * scaling_divisor AS divider
                           FROM send_slash s_s
                                    JOIN distributions d ON d.id = s_s.distribution_id
                           WHERE d.number = $1),
         previous_distribution AS (SELECT ds.user_id, ds.amount_after_slash AS user_prev_shares
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
$$;

alter function calculate_and_insert_send_ceiling_verification(integer) owner to postgres;
revoke all on function calculate_and_insert_send_ceiling_verification(integer) from public;
revoke all on function calculate_and_insert_send_ceiling_verification(integer) from anon;
revoke all on function calculate_and_insert_send_ceiling_verification(integer) from authenticated;
