-- non optimized use with caution
-- Updated with hardcoded access rules
CREATE OR REPLACE VIEW send_scores_current_unique
WITH ("security_invoker"='on', "security_barrier"='on') AS
WITH access_control AS (
  SELECT
    CASE
      -- Admin callers (postgres, service_role) see all scores
      WHEN current_user IN ('postgres', 'service_role') THEN true
      -- Authenticated users see only their own scores
      WHEN current_user = 'authenticated' AND auth.uid() IS NOT NULL THEN false -- user-specific filtering applied later
      -- Anonymous/other callers see nothing
      ELSE null -- will cause empty result
    END AS show_all_users,
    auth.uid() AS current_user_id
),
active_distribution AS (
  SELECT
    id,
    number,
    extract(epoch FROM qualification_start) AS start_time,
    extract(epoch FROM qualification_end) AS end_time,
    hodler_min_balance,
    earn_min_balance,
    token_addr
  FROM distributions
  WHERE (now() AT TIME ZONE 'UTC') >= qualification_start
    AND (now() AT TIME ZONE 'UTC') < qualification_end
  LIMIT 1
),
send_ceiling_settings AS (
  WITH previous_distribution AS (
    SELECT
      ds.user_id,
      ds.amount AS user_prev_shares
    FROM distribution_shares ds
    JOIN distributions d ON d.id = ds.distribution_id
    WHERE d.number = (SELECT number - 1 FROM active_distribution)
  )
  SELECT
    sa.user_id,
    ROUND(COALESCE(pd.user_prev_shares, ad.hodler_min_balance) / (
      SELECT minimum_sends * scaling_divisor
      FROM send_slash s_s
      WHERE s_s.distribution_id = (SELECT id FROM active_distribution)
    ))::numeric AS send_ceiling
  FROM send_accounts sa
  CROSS JOIN active_distribution ad
  LEFT JOIN previous_distribution pd ON pd.user_id = sa.user_id
),
valid_transfers AS (
  SELECT
      stt.f,
      stt.t,
      stt.v,
      stt.block_time,
      sa_from.user_id as from_user_id,
      sa_to.user_id as to_user_id,
      CASE
        WHEN (SELECT earn_min_balance FROM active_distribution) > 0 THEN
          COALESCE((
              SELECT bt.assets
              FROM send_earn_balances_timeline bt
              WHERE bt.owner = stt.t
                AND bt.block_time <= stt.block_time
              ORDER BY bt.block_time DESC
              LIMIT 1
          ), 0)
        ELSE NULL
      END as earn_balance
  FROM send_token_transfers stt
  JOIN send_accounts sa_from ON sa_from.address = concat('0x', encode(stt.f, 'hex'))::citext
  LEFT JOIN send_accounts sa_to ON sa_to.address = concat('0x', encode(stt.t, 'hex'))::citext
  CROSS JOIN active_distribution ad
  WHERE stt.block_time >= ad.start_time
      AND stt.block_time < ad.end_time
)
SELECT
  (SELECT id FROM active_distribution) as distribution_id,
  from_user_id,
  to_user_id,
  MAX(LEAST(
    CASE
      WHEN earn_balance IS NULL THEN v
      WHEN earn_balance >= (SELECT earn_min_balance FROM active_distribution) THEN v
      ELSE 0
    END,
    send_ceiling
  )) as capped_amount,
  MAX(send_ceiling) as send_ceiling
FROM (
  SELECT
    vt.from_user_id,
    vt.to_user_id,
    vt.v,
    vt.earn_balance,
    scs.send_ceiling
  FROM valid_transfers vt
  JOIN send_ceiling_settings scs ON vt.from_user_id = scs.user_id
) subq
WHERE LEAST(
  CASE
    WHEN earn_balance IS NULL THEN v
    WHEN earn_balance >= (SELECT earn_min_balance FROM active_distribution) THEN v
    ELSE 0
  END,
  send_ceiling
) > 0
  -- Apply access control filtering
  AND (
    (SELECT show_all_users FROM access_control) = true -- Admin sees all
    OR (
      (SELECT show_all_users FROM access_control) = false
      AND from_user_id = (SELECT current_user_id FROM access_control) -- Authenticated user sees only their own
    )
    -- If show_all_users is null (anonymous), no results
  )
GROUP BY from_user_id, to_user_id;

ALTER VIEW "public"."send_scores_current_unique" OWNER TO postgres;

-- Historical materialized view
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
         SELECT ebt.owner,
            ebt.block_time,
            ebt.assets,
            lead(ebt.block_time) OVER (PARTITION BY ebt.owner ORDER BY ebt.block_time) AS next_block_time
           FROM send_earn_balances_timeline ebt
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
                  WHERE ((eb.owner = transfers.t) AND (eb.block_time <= eb.block_time) AND ((eb.next_block_time IS NULL) OR (eb.block_time < eb.next_block_time)) AND (COALESCE(eb.assets, (0)::numeric) >= (dws.earn_min_balance)::numeric))))))
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

ALTER MATERIALIZED VIEW "private"."send_scores_history" OWNER TO postgres;

-- Current scores view with hardcoded access rules
create or replace view "public"."send_scores_current" as  WITH authorized_accounts AS (
         SELECT sa.user_id,
            decode(replace((sa.address)::text, ('0x'::citext)::text, ''::text), 'hex'::text) AS address_bytes
           FROM send_accounts sa
          WHERE
                CASE
                    -- Admin callers (postgres, service_role) see all scores
                    WHEN current_user IN ('postgres', 'service_role') THEN true
                    -- Authenticated users see only their own scores
                    WHEN current_user = 'authenticated' AND auth.uid() IS NOT NULL THEN (sa.user_id = auth.uid())
                    -- Anonymous/other callers see nothing
                    ELSE false
                END
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
        ), eligible_earn_accounts AS (
         SELECT DISTINCT ebt.owner
           FROM (send_earn_balances_timeline ebt
             CROSS JOIN base_ceiling bc)
          WHERE (ebt.assets >= (bc.earn_min_balance)::numeric)
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
                   FROM (send_token_transfers stt
                     JOIN authorized_accounts aa ON ((aa.address_bytes = stt.f)))
                  WHERE ((stt.block_time >= bc.start_time) AND (stt.block_time <= bc.end_time))
                UNION ALL
                 SELECT stv.f,
                    stv.t,
                    (stv.v * '10000000000000000'::numeric),
                    stv.block_time
                   FROM (send_token_v0_transfers stv
                     JOIN authorized_accounts aa ON ((aa.address_bytes = stv.f)))
                  WHERE ((stv.block_time >= bc.start_time) AND (stv.block_time <= bc.end_time))) transfers)
          WHERE ((bc.earn_min_balance = 0) OR (transfers.t IN ( SELECT eligible_earn_accounts.owner
                   FROM eligible_earn_accounts)))
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

ALTER VIEW "public"."send_scores_current" OWNER TO postgres;


CREATE OR REPLACE FUNCTION public.get_send_scores_history()
 RETURNS TABLE(user_id uuid, distribution_id integer, score numeric, unique_sends bigint, send_ceiling numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$

BEGIN
    -- Authenticated users see only their own scores
    IF current_setting('role') = 'authenticated' AND auth.uid() IS NOT NULL THEN
        RETURN QUERY SELECT * FROM private.send_scores_history WHERE send_scores_history.user_id = auth.uid();
    -- Admin callers see all scores
    ELSIF current_setting('role') = 'none' THEN  -- covers both postgres and service_role
        RETURN QUERY SELECT * FROM private.send_scores_history;
    ELSE
        RETURN;
    END IF;
END;
$function$;

ALTER FUNCTION "public"."get_send_scores_history"() OWNER TO "postgres";

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

ALTER VIEW "public"."send_scores" OWNER TO postgres;

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
            FROM send_earn_balances_timeline ebt
            WHERE ebt.owner = transfers.t
            AND ebt.assets >= sc.earn_min_balance
            AND ebt.block_time <= transfers.block_time
        )
        GROUP BY t
    ) transfer_sums ON true
    GROUP BY sc.distribution_id, sc.send_ceiling
    HAVING SUM(LEAST(transfer_sums.amount, sc.send_ceiling)) > 0;
END;
$function$
;

ALTER FUNCTION "private"."get_send_score"(addr bytea) OWNER TO "postgres";

-- Indexes
CREATE UNIQUE INDEX send_scores_history_user_id_distribution_id_idx ON private.send_scores_history USING btree (user_id, distribution_id);

-- Revoke all public and authenticated access, grant only to service_role
-- For all functions:

-- Permissions
REVOKE ALL ON "public"."send_scores_current_unique" FROM PUBLIC;
GRANT ALL ON "public"."send_scores_current_unique" TO anon;
GRANT ALL ON "public"."send_scores_current_unique" TO authenticated;
GRANT ALL ON "public"."send_scores_current_unique" TO service_role;

REVOKE ALL ON "private"."send_scores_history" FROM PUBLIC;
REVOKE ALL ON "private"."send_scores_history" FROM authenticated;
GRANT ALL ON "private"."send_scores_history" TO service_role;

REVOKE ALL ON "public"."send_scores_current" FROM PUBLIC;
GRANT ALL ON "public"."send_scores_current" TO anon;
GRANT ALL ON "public"."send_scores_current" TO authenticated;
GRANT ALL ON "public"."send_scores_current" TO service_role;

REVOKE ALL ON FUNCTION "public"."get_send_scores_history"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_send_scores_history"() TO anon;
GRANT ALL ON FUNCTION "public"."get_send_scores_history"() TO authenticated;
GRANT ALL ON FUNCTION "public"."get_send_scores_history"() TO service_role;

REVOKE ALL ON FUNCTION "public"."refresh_send_scores_history"() FROM PUBLIC;
REVOKE ALL ON FUNCTION "public"."refresh_send_scores_history"() FROM authenticated;
REVOKE ALL ON FUNCTION "public"."refresh_send_scores_history"() FROM anon;
GRANT ALL ON FUNCTION "public"."refresh_send_scores_history"() TO service_role;

REVOKE ALL ON "public"."send_scores" FROM PUBLIC;
GRANT ALL ON "public"."send_scores" TO anon;
GRANT ALL ON "public"."send_scores" TO authenticated;
GRANT ALL ON "public"."send_scores" TO service_role;

REVOKE ALL ON FUNCTION "private"."get_send_score"(addr bytea) FROM PUBLIC;
GRANT ALL ON FUNCTION "private"."get_send_score"(addr bytea) TO service_role;