-- Changes:
-- - select only users who have paid tag
-- - select only users who have min balance
-- - select only users who have sent SEND token at least once in current month
-- - order by send score
CREATE OR REPLACE FUNCTION today_birthday_senders()
RETURNS SETOF activity_feed_user
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
RETURN QUERY

WITH filtered_profiles AS (
    SELECT *
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
    -- Ensure user is part of the most recent distribution, means user have sent SEND at least once in current month and has min balance
    AND EXISTS (
        SELECT 1
        FROM distribution_shares ds
        WHERE ds.user_id = p.id
        AND ds.distribution_id = (
            SELECT MAX(d.id)
            FROM distributions d
        )
    )
)

SELECT (
   (
        NULL, -- Placeholder for the 'id' field in activity_feed_user, don't want to show users' IDs
        fp.name,
        fp.avatar_url,
        fp.send_id,
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
LEFT JOIN LATERAL (
    SELECT COALESCE(SUM(ds.amount), 0) AS send_score
    FROM distribution_shares ds
    WHERE ds.user_id = fp.id
    AND ds.distribution_id >= 6
) score ON TRUE
ORDER BY score.send_score DESC;
END;
$$;
