drop materialized view if exists "private"."send_scores_history";

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
            decode(replace((sa.address)::text, ('0x'::citext)::text, ''::text), 'hex'::text) AS address_bytes
           FROM (window_transfers wt
             JOIN send_accounts sa ON ((decode(replace((sa.address)::text, ('0x'::citext)::text, ''::text), 'hex'::text) = wt.f)))
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
   FROM (( SELECT wt.f AS address,
            wt.distribution_id,
            sum(LEAST(wt.transfer_sum, scs_1.send_ceiling)) AS score,
            count(DISTINCT wt.t) AS unique_sends
           FROM ((window_transfers wt
             JOIN send_ceiling_settings scs_1 ON (((wt.f = scs_1.address) AND (wt.distribution_id = scs_1.distribution_id))))
             JOIN dws ON ((dws.id = scs_1.distribution_id)))
          WHERE ((dws.earn_min_balance = 0) OR (EXISTS ( SELECT 1
                   FROM eligible_earn_accounts elig
                  WHERE ((elig.distribution_id = wt.distribution_id) AND (elig.owner = wt.t)))))
          GROUP BY wt.f, wt.distribution_id
         HAVING (sum(LEAST(wt.transfer_sum, scs_1.send_ceiling)) > (0)::numeric)) scores
     JOIN send_ceiling_settings scs ON (((scores.address = scs.address) AND (scores.distribution_id = scs.distribution_id))));


CREATE UNIQUE INDEX send_scores_history_user_id_distribution_id_idx ON private.send_scores_history USING btree (user_id, distribution_id);

set check_function_bodies = off;

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
        ), window_transfers AS (
         SELECT u.f,
            u.t,
            sum(u.v) AS transfer_sum
           FROM ( SELECT stt.f,
                    stt.t,
                    stt.v
                   FROM (send_token_transfers stt
                     CROSS JOIN dws dws_1)
                  WHERE ((stt.block_time >= dws_1.start_time) AND (stt.block_time <= dws_1.end_time))
                UNION ALL
                 SELECT stv.f,
                    stv.t,
                    (stv.v * '10000000000000000'::numeric)
                   FROM (send_token_v0_transfers stv
                     CROSS JOIN dws dws_1)
                  WHERE ((stv.block_time >= dws_1.start_time) AND (stv.block_time <= dws_1.end_time))) u
          WHERE (u.t IS NOT NULL)
          GROUP BY u.f, u.t
        ), sender_accounts AS (
         SELECT DISTINCT sa.user_id,
            decode(replace((sa.address)::text, ('0x'::citext)::text, ''::text), 'hex'::text) AS address_bytes
           FROM (window_transfers wt_1
             JOIN send_accounts sa ON ((decode(replace((sa.address)::text, ('0x'::citext)::text, ''::text), 'hex'::text) = wt_1.f)))
          WHERE
                CASE
                    WHEN (CURRENT_USER = ANY (ARRAY['postgres'::name, 'service_role'::name])) THEN true
                    WHEN ((CURRENT_USER = 'authenticated'::name) AND (auth.uid() IS NOT NULL)) THEN (sa.user_id = auth.uid())
                    ELSE false
                END
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
        ), eligible_earn_accounts AS (
         SELECT DISTINCT ebt.owner
           FROM (send_earn_balances_timeline ebt
             CROSS JOIN dws dws_1)
          WHERE (ebt.assets >= (dws_1.earn_min_balance)::numeric)
        )
 SELECT sc.user_id,
    sc.distribution_id,
    sum(LEAST(wt.transfer_sum, sc.send_ceiling)) AS score,
    count(DISTINCT wt.t) AS unique_sends,
    max(sc.send_ceiling) AS send_ceiling
   FROM ((window_transfers wt
     CROSS JOIN dws)
     JOIN send_ceiling sc ON ((sc.address = wt.f)))
  WHERE ((dws.earn_min_balance = 0) OR (wt.t IN ( SELECT eligible_earn_accounts.owner
           FROM eligible_earn_accounts)))
  GROUP BY sc.user_id, sc.distribution_id
 HAVING (sum(LEAST(wt.transfer_sum, sc.send_ceiling)) > (0)::numeric);


CREATE OR REPLACE FUNCTION public.today_birthday_senders()
 RETURNS SETOF activity_feed_user
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
RETURN QUERY

WITH birthday_profiles AS (
    SELECT p.*
    FROM profiles p
    WHERE p.is_public = TRUE -- only public profiles
    AND p.birthday IS NOT NULL -- Ensure birthday is set
    AND p.avatar_url IS NOT NULL -- Ensure avatar is set
    AND EXTRACT(MONTH FROM p.birthday) = EXTRACT(MONTH FROM CURRENT_DATE) -- Match current month
    AND EXTRACT(DAY FROM p.birthday) = EXTRACT(DAY FROM CURRENT_DATE) -- Match current day
    -- Ensure user has at least one tag associated via tag_receipts, 1 paid tag
    -- This where can be removed after
    AND EXISTS (
        SELECT 1
        FROM tags t
        JOIN tag_receipts tr ON tr.tag_name = t.name
        WHERE t.user_id = p.id
    )
),
user_send_scores AS (
    SELECT
        ss.user_id,
        COALESCE(SUM(ss.unique_sends), 0) AS total_sends,
        COALESCE(SUM(ss.score), 0) AS total_score
    FROM (
        SELECT user_id, score, unique_sends
        FROM private.send_scores_history
        WHERE user_id IN (SELECT id FROM birthday_profiles)
        UNION ALL
        SELECT user_id, score, unique_sends
        FROM public.send_scores_current
        WHERE user_id IN (SELECT id FROM birthday_profiles)
    ) ss
    GROUP BY ss.user_id
),
user_earn_balances AS (
    SELECT
        sa.user_id,
        COALESCE(MAX(seb.assets), 0) AS earn_balance
    FROM send_accounts sa
    JOIN birthday_profiles bp ON bp.id = sa.user_id
    INNER JOIN send_earn_balances seb ON (
        decode(replace(sa.address::text, '0x', ''), 'hex') = seb.owner
    )
    GROUP BY sa.user_id
),
-- Ensure user has historical send activity and sufficient earn balance
filtered_profiles AS (
    SELECT bp.*, uss.total_score as send_score
    FROM birthday_profiles bp
    INNER JOIN user_send_scores uss ON uss.user_id = bp.id
    INNER JOIN user_earn_balances ueb ON ueb.user_id = bp.id
WHERE uss.total_sends > 100
      AND uss.total_score > (
          SELECT hodler_min_balance
          FROM distributions
          WHERE qualification_start <= CURRENT_TIMESTAMP AT TIME ZONE 'UTC'
            AND qualification_end >= CURRENT_TIMESTAMP AT TIME ZONE 'UTC'
          ORDER BY qualification_start DESC
          LIMIT 1
      )
      AND ueb.earn_balance >= (
          SELECT d.earn_min_balance
          FROM distributions d
          WHERE d.qualification_start <= CURRENT_TIMESTAMP AT TIME ZONE 'UTC'
            AND d.qualification_end >= CURRENT_TIMESTAMP AT TIME ZONE 'UTC'
          ORDER BY d.qualification_start DESC
          LIMIT 1
      )
)

SELECT (
   (
        NULL, -- Placeholder for the 'id' field in activity_feed_user, don't want to show users' IDs
        fp.name,
        fp.avatar_url,
        fp.send_id,
        sa.main_tag_id,
        main_tag.name,
        (
            -- Aggregate all confirmed tags for the user into an array
            SELECT ARRAY_AGG(t.name)
            FROM tags t
            WHERE t.user_id = fp.id
              AND t.status = 'confirmed'
        )
   )::activity_feed_user
).*
FROM filtered_profiles fp
LEFT JOIN send_accounts sa ON sa.user_id = fp.id
LEFT JOIN tags main_tag ON main_tag.id = sa.main_tag_id
ORDER BY fp.send_score DESC;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.top_senders(limit_count integer DEFAULT 10)
 RETURNS SETOF activity_feed_user
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
RETURN QUERY
WITH user_scores AS (
    SELECT
        ss.user_id,
        COALESCE(SUM(ss.score), 0) AS send_score,
        COALESCE(SUM(ss.unique_sends), 0) AS total_sends
    FROM (
        SELECT user_id, score, unique_sends FROM private.send_scores_history
        UNION ALL
        SELECT user_id, score, unique_sends FROM public.send_scores_current
    ) ss
    GROUP BY ss.user_id
    HAVING COALESCE(SUM(ss.score), 0) > 0
       AND COALESCE(SUM(ss.unique_sends), 0) > 0
),
user_earn_balances AS (
    SELECT
        sa.user_id,
        COALESCE(MAX(seb.assets), 0) AS earn_balance
    FROM send_accounts sa
    JOIN user_scores us ON us.user_id = sa.user_id
    INNER JOIN send_earn_balances seb ON (
        decode(replace(sa.address::text, '0x', ''), 'hex') = seb.owner
    )
    GROUP BY sa.user_id
),
valid_users AS (
    SELECT
        p.id,
        p.name,
        p.avatar_url,
        p.send_id,
        us.send_score,
        ARRAY_AGG(t.name) AS tag_names
    FROM user_scores us
    INNER JOIN user_earn_balances ueb ON ueb.user_id = us.user_id
    INNER JOIN profiles p ON p.id = us.user_id
    INNER JOIN tags t ON t.user_id = p.id
    WHERE p.is_public = TRUE
      AND p.avatar_url IS NOT NULL
      AND t.status = 'confirmed'
      AND ueb.earn_balance >= (
          SELECT d.earn_min_balance
          FROM distributions d
          WHERE d.qualification_start <= CURRENT_TIMESTAMP AT TIME ZONE 'UTC'
            AND d.qualification_end >= CURRENT_TIMESTAMP AT TIME ZONE 'UTC'
          ORDER BY d.qualification_start DESC
          LIMIT 1
      )
    GROUP BY p.id, p.name, p.avatar_url, p.send_id, us.send_score
)
-- Return top N with all requirements met
SELECT (
    (
        NULL, -- Placeholder for the 'id' field in activity_feed_user, don't want to show users' IDs
        vu.name,
        vu.avatar_url,
        vu.send_id,
        NULL::bigint,  -- Hide main_tag_id for privacy
        main_tag.name,
        vu.tag_names
    )::activity_feed_user
).*
FROM valid_users vu
LEFT JOIN send_accounts sa ON sa.user_id = vu.id
LEFT JOIN tags main_tag ON main_tag.id = sa.main_tag_id
ORDER BY vu.send_score DESC
LIMIT limit_count;
END;
$function$
;

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



