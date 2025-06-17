set check_function_bodies = off;

CREATE OR REPLACE FUNCTION private.get_send_score(addr bytea)
 RETURNS TABLE(distribution_id integer, score numeric, unique_sends bigint, send_ceiling numeric)
 LANGUAGE plpgsql
 STABLE
AS $function$
BEGIN
    RETURN QUERY
    WITH active_distribution AS (
        SELECT
            d.id,
            d.number,
            EXTRACT(epoch FROM d.qualification_start) AS start_time,
            EXTRACT(epoch FROM d.qualification_end) AS end_time,
            d.hodler_min_balance,
            d.earn_min_balance,
            d.token_addr,
            ss.minimum_sends,
            ss.scaling_divisor,
            (SELECT distributions.id FROM distributions WHERE distributions.number = (d.number - 1)) AS prev_distribution_id
        FROM distributions d
        JOIN send_slash ss ON ss.distribution_id = d.id
        WHERE now() AT TIME ZONE 'UTC' >= d.qualification_start
        AND now() AT TIME ZONE 'UTC' < d.qualification_end
        LIMIT 1
    ),
    send_ceiling AS (
        SELECT
            ad.id AS distribution_id,
            ROUND((
                COALESCE(
                    (SELECT
                        CASE
                            WHEN d.token_addr = '\x3f14920c99beb920afa163031c4e47a3e03b3e4a'::bytea
                            THEN ds.amount * '10000000000000000'::numeric
                            ELSE ds.amount
                        END
                    FROM distribution_shares ds
                    JOIN distributions d ON d.id = ds.distribution_id
                    JOIN send_accounts sa ON sa.user_id = ds.user_id
                    WHERE ds.distribution_id = ad.prev_distribution_id
                    AND sa.address = concat('0x', encode(addr, 'hex'))::citext),
                    CASE
                        WHEN ad.token_addr = '\x3f14920c99beb920afa163031c4e47a3e03b3e4a'::bytea
                        THEN ad.hodler_min_balance * '10000000000000000'::numeric
                        ELSE ad.hodler_min_balance
                    END
                ) / (ad.minimum_sends * ad.scaling_divisor)
            ))::numeric AS send_ceiling,
            ad.earn_min_balance,
            ad.start_time,
            ad.end_time
        FROM active_distribution ad
    ),
    earn_balances_timeline AS (
        SELECT owner,
            block_time,
            sum(balance) OVER w AS balance,
            lead(block_time) OVER w AS next_block_time
        FROM (
            SELECT owner, block_time, assets AS balance
            FROM send_earn_deposit
            UNION ALL
            SELECT owner, block_time, -assets
            FROM send_earn_withdraw
        ) earn_data
        WINDOW w AS (PARTITION BY owner ORDER BY block_time ROWS UNBOUNDED PRECEDING)
    )
    SELECT
        sc.distribution_id,
        SUM(LEAST(transfer_sums.amount, sc.send_ceiling)) as score,
        COUNT(DISTINCT transfer_sums.t) as unique_sends,
        sc.send_ceiling
    FROM send_ceiling sc
    LEFT JOIN LATERAL (
        SELECT t, SUM(v) as amount
        FROM (
            SELECT
                stt.t,
                stt.v,
                stt.block_time
            FROM send_token_transfers stt
            WHERE stt.f = addr
            AND stt.block_time >= sc.start_time
            AND stt.block_time <= sc.end_time
            UNION ALL
            SELECT
                stv.t,
                stv.v * '10000000000000000'::numeric,
                stv.block_time
            FROM send_token_v0_transfers stv
            WHERE stv.f = addr
            AND stv.block_time >= sc.start_time
            AND stv.block_time <= sc.end_time
        ) transfers
        WHERE sc.earn_min_balance = 0
        OR EXISTS (
            SELECT 1
            FROM earn_balances_timeline ebt
            WHERE ebt.owner = transfers.t
            AND ebt.balance >= sc.earn_min_balance
            AND ebt.block_time <= transfers.block_time
            AND (ebt.next_block_time IS NULL OR transfers.block_time < ebt.next_block_time)
        )
        GROUP BY t
    ) transfer_sums ON true
    GROUP BY sc.distribution_id, sc.send_ceiling
    HAVING SUM(LEAST(transfer_sums.amount, sc.send_ceiling)) > 0;
END;
$function$
;

create materialized view "private"."send_scores_history" as  WITH distributions_with_score AS (
         SELECT d.id,
            d.number,
            EXTRACT(epoch FROM d.qualification_start) AS start_time,
            EXTRACT(epoch FROM d.qualification_end) AS end_time,
            d.hodler_min_balance,
            d.earn_min_balance,
            d.token_addr,
            ss.minimum_sends,
            ss.scaling_divisor,
            ( SELECT distributions.id
                   FROM distributions
                  WHERE (distributions.number = (d.number - 1))) AS prev_distribution_id
           FROM (distributions d
             JOIN send_slash ss ON ((ss.distribution_id = d.id)))
          WHERE (d.qualification_end < (now() AT TIME ZONE 'UTC'::text))
        ), previous_shares AS (
         SELECT ds.user_id,
            dws.id AS next_distribution_id,
                CASE
                    WHEN (d.token_addr = '\x3f14920c99beb920afa163031c4e47a3e03b3e4a'::bytea) THEN (ds.amount * '10000000000000000'::numeric)
                    ELSE ds.amount
                END AS adjusted_amount
           FROM ((distributions_with_score dws
             JOIN distribution_shares ds ON ((ds.distribution_id = dws.prev_distribution_id)))
             JOIN distributions d ON ((d.id = ds.distribution_id)))
        ), send_ceiling_settings AS (
         SELECT sa.user_id,
            decode(replace(sa.address, '0x'::citext, ''::citext), 'hex'::text) AS address,
            dws.id AS distribution_id,
            round((COALESCE(ps.adjusted_amount,
                CASE
                    WHEN (dws.token_addr = '\x3f14920c99beb920afa163031c4e47a3e03b3e4a'::bytea) THEN (dws.hodler_min_balance * '10000000000000000'::numeric)
                    ELSE dws.hodler_min_balance
                END) / ((dws.minimum_sends * dws.scaling_divisor))::numeric)) AS send_ceiling
           FROM ((send_accounts sa
             CROSS JOIN distributions_with_score dws)
             LEFT JOIN previous_shares ps ON (((ps.user_id = sa.user_id) AND (ps.next_distribution_id = dws.id))))
        ), earn_balances AS (
         SELECT send_earn_balances_timeline.owner,
            send_earn_balances_timeline.block_time,
            send_earn_balances_timeline.balance,
            lead(send_earn_balances_timeline.block_time) OVER (PARTITION BY send_earn_balances_timeline.owner ORDER BY send_earn_balances_timeline.block_time) AS next_block_time
           FROM send_earn_balances_timeline
        ), filtered_transfers AS (
         SELECT transfers.f,
            transfers.t,
            transfers.v,
            transfers.block_time,
            dws.id AS distribution_id
           FROM ( SELECT min(distributions_with_score.start_time) AS min_start,
                    max(distributions_with_score.end_time) AS max_end
                   FROM distributions_with_score) bounds,
            LATERAL ( SELECT send_token_transfers.f,
                    send_token_transfers.t,
                    send_token_transfers.v,
                    send_token_transfers.block_time
                   FROM send_token_transfers
                  WHERE ((send_token_transfers.block_time >= bounds.min_start) AND (send_token_transfers.block_time <= bounds.max_end))
                UNION ALL
                 SELECT send_token_v0_transfers.f,
                    send_token_v0_transfers.t,
                    (send_token_v0_transfers.v * '10000000000000000'::numeric),
                    send_token_v0_transfers.block_time
                   FROM send_token_v0_transfers
                  WHERE ((send_token_v0_transfers.block_time >= bounds.min_start) AND (send_token_v0_transfers.block_time <= bounds.max_end))) transfers,
            distributions_with_score dws
          WHERE ((transfers.block_time >= dws.start_time) AND (transfers.block_time <= dws.end_time) AND ((dws.earn_min_balance = 0) OR (EXISTS ( SELECT 1
                   FROM earn_balances eb
                  WHERE ((eb.owner = transfers.t) AND (eb.block_time <= eb.block_time) AND ((eb.next_block_time IS NULL) OR (eb.block_time < eb.next_block_time)) AND (COALESCE(eb.balance, (0)::numeric) >= (dws.earn_min_balance)::numeric))))))
        )
 SELECT scs.user_id,
    scs.distribution_id,
    scores.score,
    scores.unique_sends,
    scs.send_ceiling
   FROM (( SELECT grouped_transfers.f AS address,
            grouped_transfers.distribution_id,
            sum(LEAST(grouped_transfers.transfer_sum, grouped_transfers.send_ceiling)) AS score,
            count(DISTINCT grouped_transfers.t) AS unique_sends
           FROM ( SELECT ft.f,
                    ft.distribution_id,
                    ft.t,
                    sum(ft.v) AS transfer_sum,
                    scs_1.send_ceiling
                   FROM (filtered_transfers ft
                     JOIN send_ceiling_settings scs_1 ON (((ft.f = scs_1.address) AND (ft.distribution_id = scs_1.distribution_id))))
                  GROUP BY ft.f, ft.t, ft.distribution_id, scs_1.send_ceiling) grouped_transfers
          GROUP BY grouped_transfers.f, grouped_transfers.distribution_id
         HAVING (sum(LEAST(grouped_transfers.transfer_sum, grouped_transfers.send_ceiling)) > (0)::numeric)) scores
     JOIN send_ceiling_settings scs ON (((scores.address = scs.address) AND (scores.distribution_id = scs.distribution_id))));


CREATE UNIQUE INDEX send_scores_history_user_id_distribution_id_idx ON private.send_scores_history USING btree (user_id, distribution_id);


drop index if exists "public"."send_scores_history_user_id_distribution_id_idx";

drop view if exists "public"."send_scores";

drop materialized view if exists "public"."send_scores_history";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.get_send_scores_history()
 RETURNS TABLE(user_id uuid, distribution_id integer, score numeric, unique_sends bigint, send_ceiling numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$

BEGIN
    IF auth.role() = 'authenticated' THEN
        RETURN QUERY SELECT * FROM private.send_scores_history WHERE send_scores_history.user_id = (select auth.uid());
    ELSE
        RETURN QUERY SELECT * FROM private.send_scores_history;
    END IF;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.insert_verification_send_ceiling()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    -- Exit early if value is not positive
    IF NOT (NEW.v > 0) THEN
        RETURN NEW;
    END IF;

    -- Try to update existing verification
    UPDATE distribution_verifications dv
    SET
        weight = s.score,
        metadata = jsonb_build_object('value', s.send_ceiling::text)
    FROM private.get_send_score(NEW.f) s
    CROSS JOIN (
        SELECT user_id
        FROM send_accounts
        WHERE address = concat('0x', encode(NEW.f, 'hex'))::citext
    ) sa
    WHERE dv.user_id = sa.user_id
        AND dv.distribution_id = s.distribution_id
        AND dv.type = 'send_ceiling';

    -- If no row was updated, insert new verification
    IF NOT FOUND THEN
        INSERT INTO distribution_verifications(
            distribution_id,
            user_id,
            type,
            weight,
            metadata
        )
        SELECT
            s.distribution_id,
            sa.user_id,
            'send_ceiling',
            s.score,
            jsonb_build_object('value', s.send_ceiling::text)
        FROM private.get_send_score(NEW.f) s
        CROSS JOIN (
            SELECT user_id
            FROM send_accounts
            WHERE address = concat('0x', encode(NEW.f, 'hex'))::citext
        ) sa
        WHERE s.score > 0;
    END IF;

    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error in insert_verification_send_ceiling: %', SQLERRM;
        RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.insert_verification_sends()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    -- Update existing verifications
    UPDATE public.distribution_verifications dv
    SET metadata = jsonb_build_object('value', s.unique_sends),
        weight = CASE
            WHEN dv.type = 'send_ten' AND s.unique_sends >= 10 THEN 1
            WHEN dv.type = 'send_one_hundred' AND s.unique_sends >= 100 THEN 1
            ELSE 0
        END,
        created_at = to_timestamp(NEW.block_time) at time zone 'UTC'
    FROM private.get_send_score(NEW.f) s
    JOIN send_accounts sa ON sa.address = concat('0x', encode(NEW.f, 'hex'))::citext
    WHERE dv.distribution_id = s.distribution_id
        AND dv.user_id = sa.user_id
        AND dv.type IN ('send_ten', 'send_one_hundred');

    -- Insert new verifications if they don't exist
    INSERT INTO public.distribution_verifications(
        distribution_id,
        user_id,
        type,
        metadata,
        weight,
        created_at
    )
    SELECT
        s.distribution_id,
        sa.user_id,
        v.type,
        jsonb_build_object('value', s.unique_sends),
        CASE
            WHEN v.type = 'send_ten' AND s.unique_sends >= 10 THEN 1
            WHEN v.type = 'send_one_hundred' AND s.unique_sends >= 100 THEN 1
            ELSE 0
        END,
        to_timestamp(NEW.block_time) at time zone 'UTC'
    FROM private.get_send_score(NEW.f) s
    JOIN send_accounts sa ON sa.address = concat('0x', encode(NEW.f, 'hex'))::citext
    CROSS JOIN (
        VALUES
            ('send_ten'::verification_type),
            ('send_one_hundred'::verification_type)
    ) v(type)
    WHERE NOT EXISTS (
        SELECT 1
        FROM distribution_verifications dv
        WHERE dv.user_id = sa.user_id
            AND dv.distribution_id = s.distribution_id
            AND dv.type = v.type
    );

    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.refresh_send_scores_history()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY private.send_scores_history;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.refresh_send_scores_history_trigger()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  PERFORM refresh_send_scores_history();
  RETURN NEW;
END;
$function$
;

create or replace view "public"."send_scores_current" as  WITH authorized_user AS (
         SELECT auth.uid() AS user_id
        ), distributions_with_score AS (
         SELECT d.id,
            d.number,
            EXTRACT(epoch FROM d.qualification_start) AS start_time,
            EXTRACT(epoch FROM d.qualification_end) AS end_time,
            d.hodler_min_balance,
            d.earn_min_balance,
            d.token_addr,
            ss.minimum_sends,
            ss.scaling_divisor,
            ( SELECT distributions.id
                   FROM distributions
                  WHERE (distributions.number = (d.number - 1))) AS prev_distribution_id
           FROM (distributions d
             JOIN send_slash ss ON ((ss.distribution_id = d.id)))
          WHERE (((now() AT TIME ZONE 'UTC'::text) >= d.qualification_start) AND ((now() AT TIME ZONE 'UTC'::text) < d.qualification_end))
         LIMIT 1
        ), base_ceiling AS (
         SELECT dws.id AS distribution_id,
                CASE
                    WHEN (dws.token_addr = '\x3f14920c99beb920afa163031c4e47a3e03b3e4a'::bytea) THEN (dws.hodler_min_balance * '10000000000000000'::numeric)
                    ELSE dws.hodler_min_balance
                END AS base_amount,
            dws.minimum_sends,
            dws.scaling_divisor,
            dws.prev_distribution_id,
            dws.earn_min_balance,
            dws.start_time,
            dws.end_time
           FROM distributions_with_score dws
        ), authorized_accounts AS (
         SELECT sa.user_id,
            decode(replace((sa.address)::text, ('0x'::citext)::text, ''::text), 'hex'::text) AS address_bytes
           FROM (send_accounts sa
             CROSS JOIN authorized_user au)
          WHERE ((au.user_id IS NULL) OR (sa.user_id = au.user_id))
        ), authorized_distribution_shares AS (
         SELECT ds.user_id,
                CASE
                    WHEN (d.token_addr = '\x3f14920c99beb920afa163031c4e47a3e03b3e4a'::bytea) THEN (ds.amount * '10000000000000000'::numeric)
                    ELSE ds.amount
                END AS adjusted_amount
           FROM (((base_ceiling bc
             JOIN distribution_shares ds ON ((ds.distribution_id = bc.prev_distribution_id)))
             JOIN distributions d ON ((d.id = ds.distribution_id)))
             JOIN authorized_accounts aa ON ((aa.user_id = ds.user_id)))
        ), send_ceiling_settings AS (
         SELECT aa.user_id,
            aa.address_bytes AS address,
            bc.distribution_id,
            round((COALESCE(ads.adjusted_amount, bc.base_amount) / ((bc.minimum_sends * bc.scaling_divisor))::numeric)) AS send_ceiling
           FROM ((base_ceiling bc
             CROSS JOIN authorized_accounts aa)
             LEFT JOIN authorized_distribution_shares ads ON ((ads.user_id = aa.user_id)))
        ), earn_balances_timeline AS (
         SELECT earn_data.owner,
            earn_data.block_time,
            sum(earn_data.balance) OVER w AS balance,
            lead(earn_data.block_time) OVER w AS next_block_time
           FROM ( SELECT send_earn_deposit.owner,
                    send_earn_deposit.block_time,
                    send_earn_deposit.assets AS balance
                   FROM send_earn_deposit
                UNION ALL
                 SELECT send_earn_withdraw.owner,
                    send_earn_withdraw.block_time,
                    (- send_earn_withdraw.assets)
                   FROM send_earn_withdraw) earn_data
          WINDOW w AS (PARTITION BY earn_data.owner ORDER BY earn_data.block_time ROWS UNBOUNDED PRECEDING)
        ), transfer_sums AS (
         SELECT transfers.f,
            bc.distribution_id,
            transfers.t,
            sum(transfers.v) AS transfer_sum
           FROM (base_ceiling bc
             CROSS JOIN LATERAL ( SELECT stt.f,
                    stt.t,
                    stt.v,
                    stt.block_time
                   FROM send_token_transfers stt
                  WHERE ((stt.block_time >= bc.start_time) AND (stt.block_time <= bc.end_time) AND (stt.f IN ( SELECT authorized_accounts.address_bytes
                           FROM authorized_accounts)))
                UNION ALL
                 SELECT stv.f,
                    stv.t,
                    (stv.v * '10000000000000000'::numeric),
                    stv.block_time
                   FROM send_token_v0_transfers stv
                  WHERE ((stv.block_time >= bc.start_time) AND (stv.block_time <= bc.end_time) AND (stv.f IN ( SELECT authorized_accounts.address_bytes
                           FROM authorized_accounts)))) transfers)
          WHERE ((bc.earn_min_balance = 0) OR (EXISTS ( SELECT 1
                   FROM earn_balances_timeline ebt
                  WHERE ((ebt.owner = transfers.t) AND (ebt.balance >= (bc.earn_min_balance)::numeric) AND (ebt.block_time <= transfers.block_time) AND ((ebt.next_block_time IS NULL) OR (transfers.block_time < ebt.next_block_time))))))
          GROUP BY transfers.f, bc.distribution_id, transfers.t
        )
 SELECT scs.user_id,
    scs.distribution_id,
    scores.score,
    scores.unique_sends,
    scs.send_ceiling
   FROM (( SELECT ts.f AS address,
            ts.distribution_id,
            sum(LEAST(ts.transfer_sum, scs_1.send_ceiling)) AS score,
            count(DISTINCT ts.t) AS unique_sends
           FROM (transfer_sums ts
             JOIN send_ceiling_settings scs_1 ON (((ts.f = scs_1.address) AND (ts.distribution_id = scs_1.distribution_id))))
          GROUP BY ts.f, ts.distribution_id
         HAVING (sum(LEAST(ts.transfer_sum, scs_1.send_ceiling)) > (0)::numeric)) scores
     JOIN send_ceiling_settings scs ON (((scores.address = scs.address) AND (scores.distribution_id = scs.distribution_id))));


create or replace view "public"."send_scores" as  SELECT get_send_scores_history.user_id,
    get_send_scores_history.distribution_id,
    get_send_scores_history.score,
    get_send_scores_history.unique_sends,
    get_send_scores_history.send_ceiling
   FROM get_send_scores_history() get_send_scores_history(user_id, distribution_id, score, unique_sends, send_ceiling)
UNION ALL
 SELECT send_scores_current.user_id,
    send_scores_current.distribution_id,
    send_scores_current.score,
    send_scores_current.unique_sends,
    send_scores_current.send_ceiling
   FROM send_scores_current;

REVOKE ALL ON FUNCTION "public"."calculate_and_insert_send_ceiling_verification"("distribution_number" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."calculate_and_insert_send_ceiling_verification"("distribution_number" integer) TO "service_role";
-- Revoke all public and authenticated access, grant only to service_role
-- For all functions:

REVOKE ALL ON FUNCTION "public"."insert_create_passkey_verifications"("distribution_num" integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION "public"."insert_create_passkey_verifications"("distribution_num" integer) FROM authenticated;
GRANT ALL ON FUNCTION "public"."insert_create_passkey_verifications"("distribution_num" integer) TO service_role;

REVOKE ALL ON FUNCTION "public"."insert_send_slash"("distribution_number" integer, "scaling_divisor" integer, "minimum_sends" integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION "public"."insert_send_slash"("distribution_number" integer, "scaling_divisor" integer, "minimum_sends" integer) FROM authenticated;
GRANT ALL ON FUNCTION "public"."insert_send_slash"("distribution_number" integer, "scaling_divisor" integer, "minimum_sends" integer) TO service_role;

REVOKE ALL ON FUNCTION "public"."insert_send_streak_verifications"("distribution_num" integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION "public"."insert_send_streak_verifications"("distribution_num" integer) FROM authenticated;
GRANT ALL ON FUNCTION "public"."insert_send_streak_verifications"("distribution_num" integer) TO service_role;

REVOKE ALL ON FUNCTION "public"."insert_send_verifications"("distribution_num" integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION "public"."insert_send_verifications"("distribution_num" integer) FROM authenticated;
GRANT ALL ON FUNCTION "public"."insert_send_verifications"("distribution_num" integer) TO service_role;

REVOKE ALL ON FUNCTION "public"."insert_tag_referral_verifications"("distribution_num" integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION "public"."insert_tag_referral_verifications"("distribution_num" integer) FROM authenticated;
GRANT ALL ON FUNCTION "public"."insert_tag_referral_verifications"("distribution_num" integer) TO service_role;

REVOKE ALL ON FUNCTION "public"."insert_tag_registration_verifications"("distribution_num" integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION "public"."insert_tag_registration_verifications"("distribution_num" integer) FROM authenticated;
GRANT ALL ON FUNCTION "public"."insert_tag_registration_verifications"("distribution_num" integer) TO service_role;

REVOKE ALL ON FUNCTION "public"."insert_total_referral_verifications"("distribution_num" integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION "public"."insert_total_referral_verifications"("distribution_num" integer) FROM authenticated;
GRANT ALL ON FUNCTION "public"."insert_total_referral_verifications"("distribution_num" integer) TO service_role;

REVOKE ALL ON FUNCTION "public"."insert_verification_value"("distribution_number" integer, "type" "public"."verification_type", "fixed_value" numeric, "bips_value" integer, "multiplier_min" numeric, "multiplier_max" numeric, "multiplier_step" numeric) FROM PUBLIC;
REVOKE ALL ON FUNCTION "public"."insert_verification_value"("distribution_number" integer, "type" "public"."verification_type", "fixed_value" numeric, "bips_value" integer, "multiplier_min" numeric, "multiplier_max" numeric, "multiplier_step" numeric) FROM authenticated;
GRANT ALL ON FUNCTION "public"."insert_verification_value"("distribution_number" integer, "type" "public"."verification_type", "fixed_value" numeric, "bips_value" integer, "multiplier_min" numeric, "multiplier_max" numeric, "multiplier_step" numeric) TO service_role;

REVOKE ALL ON FUNCTION "public"."update_referral_verifications"("distribution_id" integer, "shares" "public"."distribution_shares"[]) FROM PUBLIC;
REVOKE ALL ON FUNCTION "public"."update_referral_verifications"("distribution_id" integer, "shares" "public"."distribution_shares"[]) FROM authenticated;
GRANT ALL ON FUNCTION "public"."update_referral_verifications"("distribution_id" integer, "shares" "public"."distribution_shares"[]) TO service_role;

REVOKE ALL ON FUNCTION "public"."insert_verification_sends"() FROM PUBLIC;
REVOKE ALL ON FUNCTION "public"."insert_verification_sends"() FROM authenticated;
GRANT ALL ON FUNCTION "public"."insert_verification_sends"() TO service_role;

REVOKE ALL ON FUNCTION "public"."insert_verification_send_ceiling"() FROM PUBLIC;
REVOKE ALL ON FUNCTION "public"."insert_verification_send_ceiling"() FROM authenticated;
GRANT ALL ON FUNCTION "public"."insert_verification_send_ceiling"() TO service_role;

REVOKE ALL ON FUNCTION "public"."insert_verification_send_ceiling"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."insert_verification_send_ceiling"() TO service_role;

ALTER MATERIALIZED VIEW "private"."send_scores_history" OWNER TO postgres;
ALTER VIEW "public"."send_scores_current_unique" OWNER TO postgres;
ALTER VIEW "public"."send_scores_current" OWNER TO postgres;
ALTER VIEW "public"."send_scores" OWNER TO postgres;


REVOKE ALL ON "private"."send_scores_history" FROM PUBLIC;
REVOKE ALL ON "private"."send_scores_history" FROM authenticated;
GRANT ALL ON "private"."send_scores_history" TO service_role;

REVOKE ALL ON "public"."send_scores_current_unique" FROM PUBLIC;
GRANT ALL ON "public"."send_scores_current_unique" TO service_role;
GRANT ALL ON "public"."send_scores_current_unique" TO authenticated;

REVOKE ALL ON "public"."send_scores_current" FROM PUBLIC;
GRANT ALL ON "public"."send_scores_current" TO service_role;
GRANT ALL ON "public"."send_scores_current" TO authenticated;

REVOKE ALL ON "public"."send_scores" FROM PUBLIC;
GRANT ALL ON "public"."send_scores" TO service_role;
GRANT ALL ON "public"."send_scores" TO authenticated;

REVOKE ALL ON FUNCTION "public"."refresh_send_scores_history_trigger"() FROM PUBLIC;
REVOKE ALL ON FUNCTION "public"."refresh_send_scores_history_trigger"() FROM authenticated;
REVOKE ALL ON FUNCTION "public"."refresh_send_scores_history_trigger"() FROM anon;
GRANT ALL ON FUNCTION "public"."refresh_send_scores_history_trigger"() TO service_role;


REVOKE ALL ON FUNCTION "public"."refresh_send_scores_history"() FROM PUBLIC;
REVOKE ALL ON FUNCTION "public"."refresh_send_scores_history"() FROM authenticated;
REVOKE ALL ON FUNCTION "public"."refresh_send_scores_history"() FROM anon;
GRANT ALL ON FUNCTION "public"."refresh_send_scores_history"() TO service_role;


REVOKE ALL ON FUNCTION "public"."get_send_scores_history"() FROM PUBLIC;
REVOKE ALL ON FUNCTION "public"."get_send_scores_history"() FROM anon;
GRANT ALL ON FUNCTION "public"."get_send_scores_history"() TO authenticated;
GRANT ALL ON FUNCTION "public"."get_send_scores_history"() TO service_role;

REVOKE ALL ON FUNCTION "private"."get_send_score"(addr bytea) FROM PUBLIC;
GRANT ALL ON FUNCTION "private"."get_send_score"(addr bytea) TO service_role;