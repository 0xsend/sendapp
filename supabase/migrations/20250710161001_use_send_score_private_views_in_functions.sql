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
        decode(replace(sa.address::text, '0x', ''), 'hex') = seb.owner
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
        SELECT user_id, score, unique_sends FROM private.send_scores_history
        UNION ALL
        SELECT user_id, score, unique_sends FROM public.send_scores_current
    ) ss
    GROUP BY ss.user_id
),
user_earn_balances AS (
    SELECT
        sa.user_id,
        COALESCE(MAX(seb.assets), 0) AS earn_balance
    FROM send_accounts sa
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
    INNER JOIN send_earn_balances seb ON (
        decode(replace(sa.address::text, '0x', ''), 'hex') = seb.owner
    )
    GROUP BY sa.user_id
),
valid_users AS (
    SELECT
        p.*,
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
    GROUP BY p.id, p.avatar_url, p.name, p.about, p.referral_code, p.is_public, p.send_id, p.x_username, p.birthday, us.send_score
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


