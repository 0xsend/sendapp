CREATE OR REPLACE FUNCTION public.xd()
 RETURNS SETOF activity_feed_user
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
        WHERE (from_user).send_id IS NOT NULL
          AND (to_user).send_id IS NOT NULL
          AND ((from_user).id = (select auth.uid()) OR (to_user).id = (select auth.uid()))
    ),

    -- Count how many interactions the current user has with each counterparty
    numbered AS (
        SELECT *,
            ROW_NUMBER() OVER (
                PARTITION BY (counterparty).send_id  -- Group by each unique counterparty
                ORDER BY created_at DESC             -- Order by most recent transfer first
            ) AS occurrence_counter
        FROM user_transfers
    ),

    with_counterparty_id AS (
        SELECT *,
            (
                SELECT id FROM profiles p WHERE p.send_id = (counterparty).send_id
            ) AS counterparty_id
        FROM numbered
        WHERE occurrence_counter = 1
    ),

    ranked AS (
        SELECT *,
            COALESCE((
             SELECT
                 SUM(amount)
             FROM distribution_shares ds
             WHERE
                 ds.user_id = counterparty_id
               AND distribution_id >= 6), 0) AS send_score
        FROM with_counterparty_id
    )

-- Select the top 10 counterparties by interaction count
-- SELECT (counterparty).*
SELECT (counterparty).*
FROM ranked
WHERE (counterparty).id IS NULL
ORDER BY send_score DESC;
--     LIMIT 10; -- Return only the 10 most frequent counterparties

END;
$function$
;
