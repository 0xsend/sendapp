CREATE OR REPLACE FUNCTION favourite_senders()
RETURNS SETOF activity_feed_user
LANGUAGE plpgsql
AS $$
BEGIN
RETURN QUERY

    -- Step 1: Filter relevant transfers and determine the counterparty
    WITH user_transfers AS (
        SELECT *,
            -- Determine the counterparty: if the current user is the sender, use the recipient, and vice versa
            CASE
                WHEN (from_user).id = auth.uid() THEN to_user
                ELSE from_user
            END AS counterparty
        FROM activity_feed
        -- Only include rows where both from_user and to_user have a send_id (indicates a transfer between users)
        WHERE (from_user).send_id IS NOT NULL
          AND (to_user).send_id IS NOT NULL
    ),

    -- Count how many interactions the current user has with each counterparty
    counterparty_counts AS (
        SELECT counterparty,
               COUNT(*) AS interaction_count
        FROM user_transfers
        GROUP BY counterparty
    )

-- Select the top 10 counterparties by interaction count
SELECT (counterparty).*
FROM counterparty_counts
ORDER BY interaction_count DESC -- Order the result by most frequent counterparties
LIMIT 10; -- Return only the 10 most frequent counterparties

END;
$$;
