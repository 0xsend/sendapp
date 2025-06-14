
drop index if exists "public"."send_scores_history_user_id_distribution_id_idx";

drop view if exists "public"."send_scores";

drop materialized view if exists "public"."send_scores_history";

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

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.get_send_scores_history()
 RETURNS TABLE(user_id uuid, distribution_id integer, score numeric, unique_sends bigint, send_ceiling numeric)
 LANGUAGE plpgsql
 SET search_path TO 'private', 'public'
AS $function$
BEGIN
    IF auth.role() IN ('service_role', 'postgres') THEN
        RETURN QUERY SELECT * FROM private.send_scores_history;
    ELSIF auth.role() = 'authenticated' THEN
        RETURN QUERY SELECT * FROM private.send_scores_history WHERE user_id = auth.uid();
    ELSE
        RETURN;
    END IF;
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


ALTER VIEW "public"."send_scores_current" SET (security_invoker = on, security_barrier = on);
ALTER VIEW "public"."send_scores" SET (security_invoker = on, security_barrier = on);
ALTER VIEW "public"."send_scores_current_unique" SET (security_invoker = on, security_barrier = on);
ALTER VIEW "public"."send_earn_balances_timeline" SET (security_invoker = on, security_barrier = on);

ALTER MATERIALIZED VIEW "private"."send_scores_history" OWNER TO postgres;
ALTER VIEW "public"."send_scores_current_unique" OWNER TO postgres;
ALTER VIEW "public"."send_scores_current" OWNER TO postgres;
ALTER VIEW "public"."send_scores" OWNER TO postgres;

-- Permissions for materialized view
REVOKE ALL ON "private"."send_scores_history" FROM PUBLIC;
REVOKE ALL ON "private"."send_scores_history" FROM anon;
REVOKE ALL ON "private"."send_scores_history" FROM authenticated;
GRANT ALL ON "private"."send_scores_history" TO service_role;

-- Permissions for views
REVOKE ALL ON "public"."send_scores_current_unique" FROM PUBLIC;
REVOKE ALL ON "public"."send_scores_current_unique" FROM anon;
GRANT ALL ON "public"."send_scores_current_unique" TO service_role;
GRANT ALL ON "public"."send_scores_current_unique" TO authenticated;

REVOKE ALL ON "public"."send_scores_current" FROM PUBLIC;
REVOKE ALL ON "public"."send_scores_current" FROM anon;
GRANT ALL ON "public"."send_scores_current" TO service_role;
GRANT ALL ON "public"."send_scores_current" TO authenticated;

REVOKE ALL ON "public"."send_scores" FROM PUBLIC;
REVOKE ALL ON "public"."send_scores" FROM anon;
GRANT ALL ON "public"."send_scores" TO service_role;
GRANT ALL ON "public"."send_scores" TO authenticated;

REVOKE ALL ON "public"."send_earn_balances_timeline" FROM PUBLIC;
REVOKE ALL ON "public"."send_earn_balances_timeline" FROM anon;
GRANT ALL ON "public"."send_earn_balances_timeline" TO authenticated;
GRANT ALL ON "public"."send_earn_balances_timeline" TO service_role;

-- Permissions for functions
REVOKE ALL ON FUNCTION "public"."refresh_send_scores_history"() FROM PUBLIC;
REVOKE ALL ON FUNCTION "public"."refresh_send_scores_history"() FROM authenticated;
REVOKE ALL ON FUNCTION "public"."refresh_send_scores_history"() FROM anon;
GRANT ALL ON FUNCTION "public"."refresh_send_scores_history"() TO service_role;

REVOKE ALL ON FUNCTION "public"."refresh_send_scores_history_trigger"() FROM PUBLIC;
REVOKE ALL ON FUNCTION "public"."refresh_send_scores_history_trigger"() FROM authenticated;
REVOKE ALL ON FUNCTION "public"."refresh_send_scores_history_trigger"() FROM anon;
GRANT ALL ON FUNCTION "public"."refresh_send_scores_history_trigger"() TO service_role;

REVOKE ALL ON FUNCTION "public"."insert_verification_sends"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."insert_verification_sends"() TO authenticated;
GRANT ALL ON FUNCTION "public"."insert_verification_sends"() TO service_role;