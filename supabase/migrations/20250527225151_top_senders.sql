CREATE OR REPLACE FUNCTION top_senders(
    limit_count INTEGER DEFAULT 10,
    latest_distribution_count INTEGER DEFAULT NULL
)
RETURNS SETOF activity_feed_user
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
RETURN QUERY

-- Get latest distributions ids
WITH recent_distributions AS (
  SELECT id
  FROM distributions
  ORDER BY id DESC
  LIMIT COALESCE(latest_distribution_count, GREATEST((SELECT COUNT(*) FROM distributions) - 5, 0)) -- always skip 5 first distributions
),
-- Get all users with scores (no limit yet)
user_scores AS (
    SELECT
        ds.user_id,
        SUM(ds.amount) AS send_score
    FROM distribution_shares ds
    INNER JOIN recent_distributions rd ON ds.distribution_id = rd.id
    GROUP BY ds.user_id
),
-- Filter for valid profiles with tags
valid_users AS (
    SELECT
        p.*,
        us.send_score,
        ARRAY_AGG(t.name) AS tag_names
    FROM user_scores us
    INNER JOIN profiles p ON p.id = us.user_id
    INNER JOIN tags t ON t.user_id = p.id
    WHERE p.is_public = TRUE
      AND p.avatar_url IS NOT NULL
      AND t.status = 'confirmed'
    GROUP BY p.id, p.name, p.avatar_url, p.send_id, us.send_score
)
-- Return top N with all requirements met
SELECT (
    (
        NULL,
        vu.name,
        vu.avatar_url,
        vu.send_id,
        vu.tag_names
    )::activity_feed_user
).*
FROM valid_users vu
ORDER BY vu.send_score DESC
LIMIT limit_count;

END;
$$;
