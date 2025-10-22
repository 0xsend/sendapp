alter table "public"."send_accounts" add column "address_bytes" bytea generated always as (
  case
    when (address ~ '^0x[A-Fa-f0-9]{40}$'::citext)
      then decode(replace((address)::text, '0x'::text, ''::text), 'hex'::text)
    else NULL::bytea
  end
) stored;

CREATE INDEX IF NOT EXISTS "idx_send_accounts_address_bytes" ON "public"."send_accounts" USING "btree" ("address_bytes");
CREATE UNIQUE INDEX IF NOT EXISTS "send_accounts_address_bytes_key" ON "public"."send_accounts" USING "btree" ("address_bytes", "chain_id");

-- RLS policy updates: compare bytea columns directly to send_accounts.address_bytes
ALTER POLICY "users can see their own sendtag_checkout_receipts" ON "public"."sendtag_checkout_receipts"
USING (("sender" = ANY (
  SELECT "send_accounts"."address_bytes"
    FROM "public"."send_accounts"
   WHERE ("send_accounts"."user_id" = (SELECT "auth"."uid"() AS "uid"))
)));

ALTER POLICY "users can see their own transfers" ON "public"."send_account_transfers"
USING ((
  ("f" = ANY (
    SELECT "send_accounts"."address_bytes"
      FROM "public"."send_accounts"
     WHERE ("send_accounts"."user_id" = (SELECT "auth"."uid"() AS "uid"))
  ))
  OR
  ("t" = ANY (
    SELECT "send_accounts"."address_bytes"
      FROM "public"."send_accounts"
     WHERE ("send_accounts"."user_id" = (SELECT "auth"."uid"() AS "uid"))
  ))
));

ALTER POLICY "users can see their own ETH receives" ON "public"."send_account_receives"
USING ((
  ("sender" = ANY (
    SELECT "send_accounts"."address_bytes"
      FROM "public"."send_accounts"
     WHERE ("send_accounts"."user_id" = (SELECT "auth"."uid"() AS "uid"))
  ))
  OR
  ("log_addr" = ANY (
    SELECT "send_accounts"."address_bytes"
      FROM "public"."send_accounts"
     WHERE ("send_accounts"."user_id" = (SELECT "auth"."uid"() AS "uid"))
  ))
));

ALTER POLICY "Send revenues safe receives can be read by the user who created" ON "public"."send_revenues_safe_receives"
USING ((
  (("lower"("concat"('0x', "encode"("sender", 'hex'::"text"))))::"public"."citext" = ANY (
    SELECT "chain_addresses"."address"
      FROM "public"."chain_addresses"
     WHERE ("chain_addresses"."user_id" = (SELECT "auth"."uid"() AS "uid"))
  ))
  OR
  ("sender" = ANY (
    SELECT "send_accounts"."address_bytes"
      FROM "public"."send_accounts"
     WHERE ("send_accounts"."user_id" = (SELECT "auth"."uid"() AS "uid"))
  ))
));

ALTER POLICY "users can see own signing key removed" ON "public"."send_account_signing_key_removed"
USING (("account" = ANY (
  SELECT "send_accounts"."address_bytes"
    FROM "public"."send_accounts"
   WHERE ("send_accounts"."user_id" = (SELECT "auth"."uid"() AS "uid"))
)));

ALTER POLICY "Send account signing key added can be read by the user who crea" ON "public"."send_account_signing_key_added"
USING (("account" IN (
  SELECT "send_accounts"."address_bytes"
    FROM "public"."send_accounts"
   WHERE ("send_accounts"."user_id" = (SELECT "auth"."uid"() AS "uid"))
)));

ALTER POLICY "users can see their own account created" ON "public"."send_account_created"
USING (("account" = ANY (
  SELECT "send_accounts"."address_bytes"
    FROM "public"."send_accounts"
   WHERE ("send_accounts"."user_id" = (SELECT "auth"."uid"() AS "uid"))
)));

-- send_earn policies
ALTER POLICY "users can see their own send_earn_deposit" ON "public"."send_earn_deposit"
USING ((
  "owner" = ANY (
    SELECT "send_accounts"."address_bytes"
      FROM "public"."send_accounts"
     WHERE ("send_accounts"."user_id" = ( SELECT "auth"."uid"() AS "uid"))
  )
));

ALTER POLICY "users can see their own send_earn_withdraw" ON "public"."send_earn_withdraw"
USING ((
  "owner" = ANY (
    SELECT "send_accounts"."address_bytes"
      FROM "public"."send_accounts"
     WHERE ("send_accounts"."user_id" = ( SELECT "auth"."uid"() AS "uid"))
  )
));

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

ALTER MATERIALIZED VIEW "private"."send_scores_history" OWNER TO postgres;
REVOKE ALL ON "private"."send_scores_history" FROM PUBLIC;
REVOKE ALL ON "private"."send_scores_history" FROM authenticated;
GRANT ALL ON "private"."send_scores_history" TO service_role;

CREATE UNIQUE INDEX IF NOT EXISTS send_scores_history_user_id_distribution_id_idx ON private.send_scores_history USING btree (user_id, distribution_id);

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
            sa.address_bytes
           FROM send_accounts sa
           INNER JOIN window_transfers wt_1 ON ((sa.address_bytes = wt_1.f))
          WHERE
                CASE
                    WHEN (CURRENT_USER = ANY (ARRAY['postgres'::name, 'service_role'::name])) THEN true
                    WHEN ((CURRENT_USER = 'authenticated'::name) AND (auth.uid() IS NOT NULL)) THEN (sa.user_id = auth.uid())
                    ELSE false
                END
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
        ), eligible_earn_accounts AS (
         SELECT DISTINCT ebt.owner
           FROM (send_earn_balances_timeline ebt
             CROSS JOIN dws dws_1)
          WHERE (ebt.assets >= (dws_1.earn_min_balance)::numeric)
        )
 SELECT sc.user_id,
    sc.distribution_id,
    sum(LEAST(fwt.transfer_sum, sc.send_ceiling)) AS score,
    count(DISTINCT fwt.t) AS unique_sends,
    max(sc.send_ceiling) AS send_ceiling
   FROM ((filtered_window_transfers fwt
     CROSS JOIN dws)
     JOIN send_ceiling sc ON ((sc.address = fwt.f)))
  WHERE ((dws.earn_min_balance = 0) OR (fwt.t IN ( SELECT eligible_earn_accounts.owner
           FROM eligible_earn_accounts)))
  GROUP BY sc.user_id, sc.distribution_id
 HAVING (sum(LEAST(fwt.transfer_sum, sc.send_ceiling)) > (0)::numeric);


set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.favourite_senders()
 RETURNS SETOF activity_feed_user
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
RETURN QUERY

-- Query each expensive view exactly once
WITH user_send_scores AS (
    SELECT
        ss.user_id,
        COALESCE(SUM(ss.score), 0) AS total_score
    FROM (
        SELECT user_id, score FROM private.send_scores_history
        UNION ALL
        SELECT user_id, score FROM public.send_scores_current
    ) ss
    GROUP BY ss.user_id
),
user_earn_balances AS (
    SELECT
        sa.user_id,
        COALESCE(MAX(seb.assets), 0) AS earn_balance
    FROM send_accounts sa
    INNER JOIN send_earn_balances seb ON (
        sa.address_bytes = seb.owner
    )
    GROUP BY sa.user_id
),
-- Filter relevant transfers and determine the counterparty
user_transfers AS (
    SELECT *,
        -- Determine the counterparty: if the current user is the sender, use the recipient, and vice versa
        CASE
            WHEN (from_user).id = (select auth.uid()) THEN to_user
            ELSE from_user
        END AS counterparty
    FROM activity_feed
    -- Only include rows where both from_user and to_user have a send_id (indicates a transfer between users)
    WHERE created_at >= NOW() - INTERVAL '60 days' -- only last 60 days
      AND (from_user).send_id IS NOT NULL
      AND (to_user).send_id IS NOT NULL
      AND ((from_user).id = (select auth.uid()) OR (to_user).id = (select auth.uid())) -- only tx with user involved
),
-- Count how many interactions the current user has with each counterparty
counterparty_counts AS (
    SELECT counterparty,
           COUNT(*) AS interaction_count
    FROM user_transfers
    WHERE (counterparty).id IS NULL -- include only valid counterparties
    GROUP BY counterparty
    ORDER BY interaction_count DESC
    LIMIT 30 -- top 30 most frequent users
),
-- Get user IDs for counterparties
with_user_id AS (
    SELECT *, (SELECT id FROM profiles WHERE send_id = (counterparty).send_id) AS user_id
    FROM counterparty_counts
    WHERE (SELECT id FROM profiles WHERE send_id = (counterparty).send_id) IS NOT NULL
)

-- Select the top 10 counterparties by send score with earn balance requirement
SELECT (counterparty).* -- only fields from activity feed
FROM with_user_id wui
INNER JOIN user_send_scores uss ON uss.user_id = wui.user_id
INNER JOIN user_earn_balances ueb ON ueb.user_id = wui.user_id
WHERE ueb.earn_balance >= (
    SELECT d.earn_min_balance
    FROM distributions d
    WHERE d.qualification_start <= CURRENT_TIMESTAMP AT TIME ZONE 'UTC'
      AND d.qualification_end >= CURRENT_TIMESTAMP AT TIME ZONE 'UTC'
    ORDER BY d.qualification_start DESC
    LIMIT 1
)
ORDER BY uss.total_score DESC
LIMIT 10; -- return top 10 send score users

END;
$function$
;


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
        sa.address_bytes = seb.owner
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
    LEFT JOIN (
        SELECT
            owner,
            SUM(assets) AS assets
        FROM send_earn_balances
        GROUP BY owner
    ) seb ON sa.address_bytes = seb.owner
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