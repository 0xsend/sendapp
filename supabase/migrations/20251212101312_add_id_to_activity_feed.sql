-- Migration: Add event_id field to activity_feed view
-- The activity_feed view currently lacks a unique identifier. This migration exposes
-- the activity.event_id column in the view to enable unique identification of activity
-- feed entries for pagination, caching, and UI keys.
-- Note: event_id is preferred over the sequential id field to avoid exposing internal
-- database IDs. The (event_name, event_id) pair is guaranteed unique via a unique index.

-- Step 1: Drop functions that depend on activity_feed view
-- These functions query activity_feed but don't need modifications since they
-- don't access the new id field
DROP FUNCTION IF EXISTS public.favourite_senders(integer, integer);
DROP FUNCTION IF EXISTS public.recent_senders(integer, integer);
DROP FUNCTION IF EXISTS public.did_user_swap();
DROP FUNCTION IF EXISTS public.today_birthday_senders(integer, integer);
DROP FUNCTION IF EXISTS public.top_senders(integer, integer);

-- Step 2: Drop and recreate the activity_feed view with the event_id column
DROP VIEW IF EXISTS public.activity_feed;

CREATE OR REPLACE VIEW public.activity_feed AS
SELECT
    a.event_id,
    a.created_at,
    a.event_name,
    CASE
        WHEN (a.from_user_id = from_p.id) THEN ROW(
        CASE
            WHEN (a.from_user_id = ( SELECT auth.uid() AS uid)) THEN ( SELECT auth.uid() AS uid)
            ELSE NULL::uuid
        END, from_p.name, from_p.avatar_url, from_p.send_id,
        CASE
            WHEN (a.from_user_id = ( SELECT auth.uid() AS uid)) THEN from_sa.main_tag_id
            ELSE NULL::bigint
        END, (from_main_tag.name)::text, (( SELECT array_agg(t.name) AS array_agg
           FROM ((tags t
             JOIN send_account_tags sat ON ((sat.tag_id = t.id)))
             JOIN send_accounts sa ON ((sa.id = sat.send_account_id)))
          WHERE ((sa.user_id = from_p.id) AND (t.status = 'confirmed'::tag_status))))::text[], (from_p.verified_at IS NOT NULL)::boolean)::activity_feed_user
        ELSE NULL::activity_feed_user
    END AS from_user,
    CASE
        WHEN (a.to_user_id = to_p.id) THEN ROW(
        CASE
            WHEN (a.to_user_id = ( SELECT auth.uid() AS uid)) THEN ( SELECT auth.uid() AS uid)
            ELSE NULL::uuid
        END, to_p.name, to_p.avatar_url, to_p.send_id,
        CASE
            WHEN (a.to_user_id = ( SELECT auth.uid() AS uid)) THEN to_sa.main_tag_id
            ELSE NULL::bigint
        END, (to_main_tag.name)::text, (( SELECT array_agg(t.name) AS array_agg
           FROM ((tags t
             JOIN send_account_tags sat ON ((sat.tag_id = t.id)))
             JOIN send_accounts sa ON ((sa.id = sat.send_account_id)))
          WHERE ((sa.user_id = to_p.id) AND (t.status = 'confirmed'::tag_status))))::text[], (to_p.verified_at IS NOT NULL)::boolean)::activity_feed_user
        ELSE NULL::activity_feed_user
    END AS to_user,
    a.data
FROM ((((((activity a
    LEFT JOIN profiles from_p ON ((a.from_user_id = from_p.id)))
    LEFT JOIN profiles to_p ON ((a.to_user_id = to_p.id)))
    LEFT JOIN send_accounts from_sa ON ((from_sa.user_id = from_p.id)))
    LEFT JOIN tags from_main_tag ON ((from_main_tag.id = from_sa.main_tag_id)))
    LEFT JOIN send_accounts to_sa ON ((to_sa.user_id = to_p.id)))
    LEFT JOIN tags to_main_tag ON ((to_main_tag.id = to_sa.main_tag_id)))
WHERE ((a.from_user_id = ( SELECT auth.uid() AS uid)) OR ((a.to_user_id = ( SELECT auth.uid() AS uid)) AND (a.event_name !~~ 'temporal_%'::text)))
GROUP BY a.event_id, a.created_at, a.event_name, a.from_user_id, a.to_user_id, from_p.id, from_p.name, from_p.avatar_url, from_p.send_id, to_p.id, to_p.name, to_p.avatar_url, to_p.send_id, a.data, from_sa.main_tag_id, from_main_tag.name, to_sa.main_tag_id, to_main_tag.name, from_p.verified_at, to_p.verified_at;

-- Step 3: Recreate dependent functions
-- These functions remain unchanged except for being recreated after the view modification

CREATE OR REPLACE FUNCTION public.favourite_senders(page_number integer DEFAULT 0, page_size integer DEFAULT 10)
 RETURNS SETOF activity_feed_user
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    -- Validate and cap page_size to prevent abuse
    IF page_size > 50 THEN
        page_size := 50;
    END IF;

    IF page_size < 1 THEN
        page_size := 1;
    END IF;

    -- Ensure page_number is not negative
    IF page_number < 0 THEN
        page_number := 0;
    END IF;

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
SELECT (
    (
        (counterparty).id,
        (counterparty).name,
        (counterparty).avatar_url,
        (counterparty).send_id,
        (counterparty).main_tag_id,
        (counterparty).main_tag_name,
        (counterparty).tags,
        (p.verified_at IS NOT NULL)::boolean
    )::activity_feed_user
).*
FROM with_user_id wui
INNER JOIN user_send_scores uss ON uss.user_id = wui.user_id
INNER JOIN user_earn_balances ueb ON ueb.user_id = wui.user_id
INNER JOIN profiles p ON p.id = wui.user_id
WHERE ueb.earn_balance >= (
    SELECT d.earn_min_balance
    FROM distributions d
    WHERE d.qualification_start <= CURRENT_TIMESTAMP AT TIME ZONE 'UTC'
      AND d.qualification_end >= CURRENT_TIMESTAMP AT TIME ZONE 'UTC'
    ORDER BY d.qualification_start DESC
    LIMIT 1
)
ORDER BY uss.total_score DESC
LIMIT page_size
OFFSET page_number * page_size;

END;
$function$
;

ALTER FUNCTION "public"."favourite_senders"("page_number" integer, "page_size" integer) OWNER TO "postgres";

CREATE OR REPLACE FUNCTION public.recent_senders(
    page_number integer DEFAULT 0,
    page_size integer DEFAULT 10
)
 RETURNS SETOF activity_feed_user
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    -- Validate and cap page_size to prevent abuse
    IF page_size > 50 THEN
        page_size := 50;
    END IF;

    IF page_size < 1 THEN
        page_size := 1;
    END IF;

    -- Ensure page_number is not negative
    IF page_number < 0 THEN
        page_number := 0;
    END IF;

RETURN QUERY

    -- Step 1: Filter relevant transfers and determine the counterparty
    WITH user_transfers AS (
        SELECT *,
            -- Determine the counterparty: if the current user is the sender, use the recipient, and vice versa
            CASE
                WHEN (from_user).id = (select auth.uid()) THEN to_user -- only change is to use (select auth.uid()) instead of auth.uid()
                ELSE from_user
            END AS counterparty
        FROM activity_feed
        -- Only include rows where both from_user and to_user have a send_id (indicates a transfer between users)
        WHERE (from_user).send_id IS NOT NULL
          AND (to_user).send_id IS NOT NULL
    ),

    -- Step 2: Assign a row number to each transfer per counterparty, ordered by most recent
    numbered AS (
        SELECT *,
            ROW_NUMBER() OVER (
                PARTITION BY (counterparty).send_id  -- Group by each unique counterparty
                ORDER BY created_at DESC             -- Order by most recent transfer first
            ) AS occurrence_counter
        FROM user_transfers
    )

-- Step 3: Select only the most recent transfer for each counterparty with profile data
SELECT (
    (
        (counterparty).id,
        (counterparty).name,
        (counterparty).avatar_url,
        (counterparty).send_id,
        (counterparty).main_tag_id,
        (counterparty).main_tag_name,
        (counterparty).tags,
        (p.verified_at IS NOT NULL)::boolean
    )::activity_feed_user
).*
FROM numbered
LEFT JOIN profiles p ON p.send_id = (counterparty).send_id
WHERE occurrence_counter = 1  -- Only the most recent interaction with each counterparty
ORDER BY created_at DESC      -- Order the result by most recent transfer
LIMIT page_size
OFFSET page_number * page_size;

END;
$function$
;

ALTER FUNCTION "public"."recent_senders"("page_number" integer, "page_size" integer) OWNER TO "postgres";

CREATE OR REPLACE FUNCTION public.did_user_swap()
 RETURNS boolean
 LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM activity_feed af
        WHERE (
            EXISTS (
              SELECT 1 FROM liquidity_pools lp
              WHERE (af.data->>'f')::bytea = lp.pool_addr
            )
            OR EXISTS (
              SELECT 1 FROM swap_routers sr
              WHERE (af.data->>'f')::bytea = sr.router_addr
            )
            OR EXISTS (
              SELECT 1 FROM liquidity_pools lp
              WHERE (af.data->>'t')::bytea = lp.pool_addr
            )
            OR EXISTS (
              SELECT 1 FROM swap_routers sr
              WHERE (af.data->>'t')::bytea = sr.router_addr
            )
        )
        LIMIT 1
    );
END;
$function$
;

ALTER FUNCTION "public"."did_user_swap"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION public.today_birthday_senders(
    page_number integer DEFAULT 0,
    page_size integer DEFAULT 10
)
 RETURNS SETOF activity_feed_user
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    -- Validate and cap page_size to prevent abuse
    IF page_size > 50 THEN
        page_size := 50;
    END IF;

    IF page_size < 1 THEN
        page_size := 1;
    END IF;

    -- Ensure page_number is not negative
    IF page_number < 0 THEN
        page_number := 0;
    END IF;

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
        JOIN receipts r ON (
            -- Match on event_id when available (new records)
            (tr.event_id IS NOT NULL AND r.event_id = tr.event_id)
            OR
            -- Fall back to hash matching for old records where event_id is NULL
            (tr.event_id IS NULL AND r.event_id = tr.hash)
        )
        WHERE t.user_id = p.id
        AND t.status = 'confirmed'  -- Only confirmed tags
        AND r.user_id = t.user_id  -- Ensure receipt belongs to current owner
        AND tr.id = (
            SELECT MAX(id)
            FROM tag_receipts
            WHERE tag_name = t.name
        )
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
    SELECT bp.*, uss.total_score as send_score, (bp.verified_at IS NOT NULL) AS is_verified
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
        ),
        fp.is_verified
   )::activity_feed_user
).*
FROM filtered_profiles fp
LEFT JOIN send_accounts sa ON sa.user_id = fp.id
LEFT JOIN tags main_tag ON main_tag.id = sa.main_tag_id
ORDER BY fp.send_score DESC
LIMIT page_size
OFFSET page_number * page_size;
END;
$function$
;

ALTER FUNCTION "public"."today_birthday_senders"("page_number" integer, "page_size" integer) OWNER TO "postgres";

CREATE OR REPLACE FUNCTION public.top_senders(
    page_number integer DEFAULT 0,
    page_size integer DEFAULT 10
)
 RETURNS SETOF activity_feed_user
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    -- Validate and cap page_size to prevent abuse
    IF page_size > 50 THEN
        page_size := 50;
    END IF;

    IF page_size < 1 THEN
        page_size := 1;
    END IF;

    -- Ensure page_number is not negative
    IF page_number < 0 THEN
        page_number := 0;
    END IF;

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
        ARRAY_AGG(t.name) AS tag_names,
        (p.verified_at IS NOT NULL) AS is_verified
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
    GROUP BY p.id, p.name, p.avatar_url, p.send_id, us.send_score, p.verified_at
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
        vu.tag_names,
        vu.is_verified
    )::activity_feed_user
).*
FROM valid_users vu
LEFT JOIN send_accounts sa ON sa.user_id = vu.id
LEFT JOIN tags main_tag ON main_tag.id = sa.main_tag_id
ORDER BY vu.send_score DESC
LIMIT page_size
OFFSET page_number * page_size;
END;
$function$
;

ALTER FUNCTION "public"."top_senders"("page_number" integer, "page_size" integer) OWNER TO "postgres";

REVOKE ALL ON FUNCTION "public"."top_senders"("page_number" integer, "page_size" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."top_senders"("page_number" integer, "page_size" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."top_senders"("page_number" integer, "page_size" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."top_senders"("page_number" integer, "page_size" integer) TO "service_role";
