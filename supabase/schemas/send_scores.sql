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

ALTER FUNCTION "private"."get_send_score"(addr bytea) OWNER TO "postgres";

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

ALTER FUNCTION "public"."get_send_scores_history"() OWNER TO "postgres";

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

ALTER FUNCTION "public"."refresh_send_scores_history"() OWNER TO "postgres";

-- Trigger function
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

ALTER FUNCTION "public"."refresh_send_scores_history_trigger"() OWNER TO "postgres";

-- Trigger
CREATE TRIGGER distribution_ended_refresh_send_scores
  AFTER INSERT ON distributions
  FOR EACH ROW
  EXECUTE FUNCTION refresh_send_scores_history_trigger();


-- Revoke all public and authenticated access, grant only to service_role
-- For all functions:
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