-- non optimized use with caution
CREATE OR REPLACE VIEW send_scores_current_unique
WITH ("security_invoker"='on', "security_barrier"='on') AS
WITH active_distribution AS (
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
              SELECT balance
              FROM send_earn_balances_timeline bt
              WHERE bt.owner = stt.t
                AND bt.block_time <= stt.block_time
              ORDER BY block_time DESC
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
  LEAST(
    CASE
      WHEN earn_balance IS NULL THEN v
      WHEN earn_balance >= (SELECT earn_min_balance FROM active_distribution) THEN v
      ELSE 0
    END,
    send_ceiling
  ) as capped_amount,
  send_ceiling
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
) > 0;

ALTER VIEW send_scores_current_unique OWNER TO postgres;

-- Historical materialized view
create materialized view "public"."send_scores_history" as  WITH distributions_with_score AS (
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
          WHERE (((transfers.block_time >= dws.start_time) AND (transfers.block_time <= dws.end_time)) AND ((dws.earn_min_balance = 0) OR (EXISTS ( SELECT 1
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

CREATE UNIQUE INDEX ON send_scores_history (user_id, distribution_id);

ALTER MATERIALIZED VIEW send_scores_history OWNER TO postgres;

-- Add permissions for the materialized view
GRANT ALL ON send_scores_history TO service_role;

-- Current scores view
create or replace view "public"."send_scores_current" as  WITH distributions_with_score AS (
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
          WHERE (((transfers.block_time >= dws.start_time) AND (transfers.block_time <= dws.end_time)) AND ((dws.earn_min_balance = 0) OR (EXISTS ( SELECT 1
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
     JOIN send_ceiling_settings scs ON (((scores.address = scs.address) AND (scores.distribution_id = scs.distribution_id))))
  WHERE (EXISTS ( SELECT 1
           FROM distributions_with_score d
          WHERE ((d.id = scs.distribution_id) AND (EXTRACT(epoch FROM (now() AT TIME ZONE 'UTC'::text)) >= d.start_time) AND (EXTRACT(epoch FROM (now() AT TIME ZONE 'UTC'::text)) < d.end_time))));

ALTER VIEW send_scores_current OWNER TO postgres;

create or replace view "public"."send_scores" as  SELECT send_scores_history.user_id,
    send_scores_history.distribution_id,
    send_scores_history.score,
    send_scores_history.unique_sends,
    send_scores_history.send_ceiling
   FROM send_scores_history
UNION ALL
 SELECT send_scores_current.user_id,
    send_scores_current.distribution_id,
    send_scores_current.score,
    send_scores_current.unique_sends,
    send_scores_current.send_ceiling
   FROM send_scores_current;

ALTER VIEW send_scores OWNER TO postgres;