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

-- Historical materialized view (scan-once)

create materialized view "private"."send_scores_history" as  WITH dws AS (
         SELECT d.id,
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
        ), bounds AS (
         SELECT min(dws.start_time) AS min_start,
            max(dws.end_time) AS max_end
           FROM dws
        ), transfers AS (
         SELECT stt.f,
            stt.t,
            stt.v,
            stt.block_time
           FROM (send_token_transfers stt
             CROSS JOIN bounds)
          WHERE ((stt.block_time >= bounds.min_start) AND (stt.block_time <= bounds.max_end))
        UNION ALL
         SELECT stv.f,
            stv.t,
            (stv.v * '10000000000000000'::numeric),
            stv.block_time
           FROM (send_token_v0_transfers stv
             CROSS JOIN bounds)
          WHERE ((stv.block_time >= bounds.min_start) AND (stv.block_time <= bounds.max_end))
        ), window_transfers AS (
         SELECT dws.id AS distribution_id,
            tr.f,
            tr.t,
            sum(tr.v) AS transfer_sum
           FROM (transfers tr
             JOIN dws ON (((tr.block_time >= dws.start_time) AND (tr.block_time <= dws.end_time))))
          WHERE (tr.t IS NOT NULL)
          GROUP BY dws.id, tr.f, tr.t
        ), sender_accounts AS (
         SELECT DISTINCT wt.distribution_id,
            sa.user_id,
            sa.address_bytes
           FROM send_accounts sa
           INNER JOIN window_transfers wt ON ((sa.address_bytes = wt.f))
        ), filtered_window_transfers AS (
         SELECT wt.f,
            wt.t,
            wt.transfer_sum,
            wt.distribution_id
           FROM window_transfers wt
           WHERE wt.f IN (SELECT sa.address_bytes FROM sender_accounts sa)
        ), prev_shares AS (
         SELECT dws.id AS distribution_id,
            ds.user_id,
                CASE
                    WHEN (d.token_addr = '\x3f14920c99beb920afa163031c4e47a3e03b3e4a'::bytea) THEN (ds.amount * '10000000000000000'::numeric)
                    ELSE ds.amount
                END AS adjusted_amount
           FROM (((dws
             JOIN distribution_shares ds ON ((ds.distribution_id = dws.prev_distribution_id)))
             JOIN distributions d ON ((d.id = ds.distribution_id)))
             JOIN ( SELECT DISTINCT sender_accounts.distribution_id,
                    sender_accounts.user_id
                   FROM sender_accounts) s ON (((s.user_id = ds.user_id) AND (s.distribution_id = dws.id))))
        ), send_ceiling_settings AS (
         SELECT s.distribution_id,
            s.user_id,
            s.address_bytes AS address,
            round((COALESCE(ps.adjusted_amount,
                CASE
                    WHEN (dws.token_addr = '\x3f14920c99beb920afa163031c4e47a3e03b3e4a'::bytea) THEN (dws.hodler_min_balance * '10000000000000000'::numeric)
                    ELSE dws.hodler_min_balance
                END) / ((dws.minimum_sends * dws.scaling_divisor))::numeric)) AS send_ceiling
           FROM ((sender_accounts s
             JOIN dws ON ((dws.id = s.distribution_id)))
             LEFT JOIN prev_shares ps ON (((ps.user_id = s.user_id) AND (ps.distribution_id = s.distribution_id))))
        ), eligible_earn_accounts AS (
         SELECT DISTINCT dws.id AS distribution_id,
            ebt.owner
           FROM (send_earn_balances_timeline ebt
             JOIN dws ON ((ebt.assets >= (dws.earn_min_balance)::numeric)))
        )
 SELECT scs.user_id,
    scs.distribution_id,
    scores.score,
    scores.unique_sends,
    scs.send_ceiling
   FROM (( SELECT fwt.f AS address,
            fwt.distribution_id,
            sum(LEAST(fwt.transfer_sum, scs_1.send_ceiling)) AS score,
            count(DISTINCT fwt.t) AS unique_sends
           FROM ((filtered_window_transfers fwt
             JOIN send_ceiling_settings scs_1 ON (((fwt.f = scs_1.address) AND (fwt.distribution_id = scs_1.distribution_id))))
             JOIN dws ON ((dws.id = scs_1.distribution_id)))
          WHERE ((dws.earn_min_balance = 0) OR (EXISTS ( SELECT 1
                   FROM eligible_earn_accounts elig
                  WHERE ((elig.distribution_id = fwt.distribution_id) AND (elig.owner = fwt.t)))))
          GROUP BY fwt.f, fwt.distribution_id
         HAVING (sum(LEAST(fwt.transfer_sum, scs_1.send_ceiling)) > (0)::numeric)) scores
     JOIN send_ceiling_settings scs ON (((scores.address = scs.address) AND (scores.distribution_id = scs.distribution_id))));

-- Indexes
CREATE UNIQUE INDEX send_scores_history_user_id_distribution_id_idx ON private.send_scores_history USING btree (user_id, distribution_id);

-- Owners and permissions for history MV
ALTER MATERIALIZED VIEW "private"."send_scores_history" OWNER TO postgres;
REVOKE ALL ON "private"."send_scores_history" FROM PUBLIC;
REVOKE ALL ON "private"."send_scores_history" FROM authenticated;
GRANT ALL ON "private"."send_scores_history" TO service_role;

-- Current scores view (dynamic scan-once implementation)

create or replace view "public"."send_scores_current" as  WITH dws AS (
         SELECT d.id,
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
        ), authorized_accounts AS (
         SELECT sa.user_id,
            sa.address_bytes
           FROM send_accounts sa
          WHERE
                CASE
                    WHEN (CURRENT_USER = ANY (ARRAY['postgres'::name, 'service_role'::name])) THEN true
                    WHEN ((CURRENT_USER = 'authenticated'::name) AND (auth.uid() IS NOT NULL)) THEN (sa.user_id = auth.uid())
                    ELSE false
                END
        ), eligible_earn_accounts AS (
         SELECT DISTINCT ebt.owner
           FROM (send_earn_balances_timeline ebt
             CROSS JOIN dws dws_1)
          WHERE (ebt.assets >= (dws_1.earn_min_balance)::numeric)
        ), actual_senders AS (
         SELECT DISTINCT f AS address_bytes
         FROM (
           SELECT stt.f
           FROM send_token_transfers stt
           CROSS JOIN dws dws_1
           WHERE (stt.block_time >= dws_1.start_time) AND (stt.block_time <= dws_1.end_time)
           UNION ALL
           SELECT stv.f
           FROM send_token_v0_transfers stv
           CROSS JOIN dws dws_1
           WHERE (stv.block_time >= dws_1.start_time) AND (stv.block_time <= dws_1.end_time)
         ) all_senders
         WHERE f IS NOT NULL
        ), sender_accounts AS (
         SELECT aa.user_id, aa.address_bytes
         FROM authorized_accounts aa
         WHERE EXISTS (
           SELECT 1 FROM actual_senders act WHERE act.address_bytes = aa.address_bytes
         )
        ), window_transfers AS (
         SELECT u.f,
            u.t,
            sum(u.v) AS transfer_sum
           FROM (
             SELECT stt.f,
                    stt.t,
                    stt.v
               FROM send_token_transfers stt
               CROSS JOIN dws dws_1
              WHERE ((stt.block_time >= dws_1.start_time) AND (stt.block_time <= dws_1.end_time))
                AND stt.t IS NOT NULL
AND stt.f IN (SELECT address_bytes FROM sender_accounts)
                AND ((dws_1.earn_min_balance = 0) OR (stt.t IN (SELECT owner FROM eligible_earn_accounts)))
             UNION ALL
             SELECT stv.f,
                    stv.t,
                    (stv.v * '10000000000000000'::numeric)
               FROM send_token_v0_transfers stv
               CROSS JOIN dws dws_1
              WHERE ((stv.block_time >= dws_1.start_time) AND (stv.block_time <= dws_1.end_time))
                AND stv.t IS NOT NULL
AND stv.f IN (SELECT address_bytes FROM sender_accounts)
                AND ((dws_1.earn_min_balance = 0) OR (stv.t IN (SELECT owner FROM eligible_earn_accounts)))
           ) u
          GROUP BY u.f, u.t
        ), filtered_window_transfers AS (
         SELECT wt_1.f,
            wt_1.t,
            wt_1.transfer_sum
           FROM window_transfers wt_1
           WHERE wt_1.f IN (SELECT sa.address_bytes FROM sender_accounts sa)
        ), prev_shares AS (
         SELECT ds.user_id,
                CASE
                    WHEN (d.token_addr = '\x3f14920c99beb920afa163031c4e47a3e03b3e4a'::bytea) THEN (ds.amount * '10000000000000000'::numeric)
                    ELSE ds.amount
                END AS adjusted_amount
           FROM (((dws dws_1
             JOIN distribution_shares ds ON ((ds.distribution_id = dws_1.prev_distribution_id)))
             JOIN distributions d ON ((d.id = ds.distribution_id)))
             JOIN sender_accounts s ON ((s.user_id = ds.user_id)))
        ), send_ceiling AS (
         SELECT s.user_id,
            s.address_bytes AS address,
            dws_1.id AS distribution_id,
            round((COALESCE(ps.adjusted_amount,
                CASE
                    WHEN (dws_1.token_addr = '\x3f14920c99beb920afa163031c4e47a3e03b3e4a'::bytea) THEN (dws_1.hodler_min_balance * '10000000000000000'::numeric)
                    ELSE dws_1.hodler_min_balance
                END) / ((dws_1.minimum_sends * dws_1.scaling_divisor))::numeric)) AS send_ceiling
           FROM ((sender_accounts s
             CROSS JOIN dws dws_1)
             LEFT JOIN prev_shares ps ON ((ps.user_id = s.user_id)))
)
 SELECT sc.user_id,
    sc.distribution_id,
    sum(LEAST(fwt.transfer_sum, sc.send_ceiling)) AS score,
    count(DISTINCT fwt.t) AS unique_sends,
    max(sc.send_ceiling) AS send_ceiling
   FROM ((filtered_window_transfers fwt
     CROSS JOIN dws)
     JOIN send_ceiling sc ON ((sc.address = fwt.f)))
  GROUP BY sc.user_id, sc.distribution_id
 HAVING (sum(LEAST(fwt.transfer_sum, sc.send_ceiling)) > (0)::numeric);

-- Owners and permissions for current view
ALTER VIEW "public"."send_scores_current" OWNER TO postgres;
REVOKE ALL ON "public"."send_scores_current" FROM PUBLIC;
GRANT ALL ON "public"."send_scores_current" TO anon;
GRANT ALL ON "public"."send_scores_current" TO authenticated;
GRANT ALL ON "public"."send_scores_current" TO service_role;

-- Owners and permissions for unique current view (preexisting)
ALTER VIEW "public"."send_scores_current_unique" OWNER TO postgres;
REVOKE ALL ON "public"."send_scores_current_unique" FROM PUBLIC;
GRANT ALL ON "public"."send_scores_current_unique" TO anon;
GRANT ALL ON "public"."send_scores_current_unique" TO authenticated;
GRANT ALL ON "public"."send_scores_current_unique" TO service_role;

-- Unified scores view
create or replace view "public"."send_scores" as  SELECT h.user_id,
    h.distribution_id,
    h.score,
    h.unique_sends,
    h.send_ceiling
   FROM get_send_scores_history() h(user_id, distribution_id, score, unique_sends, send_ceiling)
UNION ALL
 SELECT c.user_id,
    c.distribution_id,
    c.score,
    c.unique_sends,
    c.send_ceiling
   FROM send_scores_current c;

-- Owners and permissions for unified view
ALTER VIEW "public"."send_scores" OWNER TO postgres;
REVOKE ALL ON "public"."send_scores" FROM PUBLIC;
GRANT ALL ON "public"."send_scores" TO anon;
GRANT ALL ON "public"."send_scores" TO authenticated;
GRANT ALL ON "public"."send_scores" TO service_role;
