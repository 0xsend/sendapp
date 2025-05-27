CREATE OR REPLACE FUNCTION top_senders()
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
    AND p.avatar_url IS NOT NULL -- Ensure avatar is set
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
LEFT JOIN LATERAL ( -- calculate send score
    SELECT COALESCE(SUM(ds.amount), 0) AS send_score
    FROM distribution_shares ds
    WHERE ds.user_id = fp.id
    AND ds.distribution_id >= 6
) score ON TRUE
ORDER BY score.send_score DESC
LIMIT 10; -- top 10 highest send score senders

END;
$$;
