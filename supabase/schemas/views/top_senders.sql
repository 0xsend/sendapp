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