set check_function_bodies = off;

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
-- Ensure user has historical send activity
filtered_profiles AS (
    SELECT bp.*
    FROM birthday_profiles bp
    WHERE EXISTS (
        SELECT 1
        FROM (
            SELECT
                SUM(ss.unique_sends) as total_sends,
                SUM(ss.score) as total_score
            FROM send_scores ss
            WHERE ss.user_id = bp.id
        ) totals
        WHERE totals.total_sends > 100
        AND totals.total_score > (SELECT hodler_min_balance FROM distributions WHERE id = (SELECT MAX(d.id) FROM distributions d))
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
LEFT JOIN LATERAL (
    SELECT COALESCE(SUM(ss.score), 0) AS send_score
    FROM send_scores ss
    WHERE ss.user_id = fp.id
) score ON TRUE
ORDER BY score.send_score DESC;
END;
$function$
;


