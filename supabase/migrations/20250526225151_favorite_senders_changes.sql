-- Changes:
-- - added security definer and filtering with auth.id
-- - qualify only txs that are in last 60 days
-- - order is now top 30 people by interaction counts, then top 10 by send score
-- - removed bug that users sending to theirselves see theirselves in feed
CREATE OR REPLACE FUNCTION favourite_senders()
RETURNS SETOF activity_feed_user
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
RETURN QUERY


-- Step 1: Filter relevant transfers and determine the counterparty
    WITH user_transfers AS (
    SELECT *,
        -- Determine the counterparty: if the current user is the sender, use the recipient, and vice versa
        CASE
            WHEN (from_user).id = (select auth.uid()) THEN to_user
            ELSE from_user
        END AS counterparty
    FROM activity_feed
    -- Only include rows where both from_user and to_user have a send_id (indicates a transfer between users)
    WHERE created_at >= NOW() - INTERVAL '60 days' -- only last 30 days
      AND (from_user).send_id IS NOT NULL
      AND (to_user).send_id IS NOT NULL
      AND ((from_user).id = (select auth.uid()) OR (to_user).id = (select auth.uid())) -- only tx with user involved
),

-- Count how many interactions the current user has with each counterparty
counterparty_counts AS (
    SELECT counterparty,
           COUNT(*) AS interaction_count
    FROM user_transfers
    WHERE (counterparty).id IS NULL -- ignore if users were sending to their selves
    GROUP BY counterparty
    ORDER BY interaction_count DESC
    LIMIT 30 -- top 30 most frequent users
),

-- need users ids to count send score, activity feed doesnt have it, its not returned by this function, just used in calculations
with_user_id AS (
  SELECT *, (SELECT id FROM profiles WHERE send_id = (counterparty).send_id) AS user_id
  FROM counterparty_counts
)

-- Select the top 10 counterparties by send score
SELECT (counterparty).* -- only fields from activity feed
FROM with_user_id
    LEFT JOIN LATERAL ( -- calculate send score for top 30 frequent users
        SELECT COALESCE(SUM(ds.amount), 0) AS send_score
        FROM distribution_shares ds
        WHERE ds.user_id = with_user_id.user_id
        AND ds.distribution_id >= 6
    ) score ON TRUE
ORDER BY score.send_score DESC
LIMIT 10; -- return top 10 send score users

END;
$$;
