-- Search functions that depend on scores
-- This file should be loaded after views are created
CREATE OR REPLACE FUNCTION public.tag_search(query text, limit_val integer, offset_val integer)
 RETURNS TABLE(send_id_matches tag_search_result[], tag_matches tag_search_result[], phone_matches tag_search_result[])
 LANGUAGE plpgsql
 IMMUTABLE SECURITY DEFINER
AS $function$
BEGIN
    IF limit_val IS NULL OR(limit_val <= 0 OR limit_val > 100) THEN
        RAISE EXCEPTION 'limit_val must be between 1 and 100';
    END IF;
    IF offset_val IS NULL OR offset_val < 0 THEN
        RAISE EXCEPTION 'offset_val must be greater than or equal to 0';
    END IF;
    RETURN query
    SELECT
        -- send_id matches
(
            SELECT
                array_agg(ROW(sub.avatar_url, sub.tag_name, sub.send_id, sub.phone)::public.tag_search_result)
            FROM(
                SELECT
                    p.avatar_url,
                    t.name AS tag_name,
                    p.send_id,
                    NULL::text AS phone
                FROM
                    profiles p
                LEFT JOIN send_accounts sa ON sa.user_id = p.id
                LEFT JOIN send_account_tags sat ON sat.send_account_id = sa.id
                LEFT JOIN tags t ON t.id = sat.tag_id
                    AND t.status = 'confirmed'
            WHERE
                query SIMILAR TO '\d+'
                AND p.send_id::varchar LIKE '%' || query || '%'
            ORDER BY
                p.send_id
            LIMIT limit_val offset offset_val) sub) AS send_id_matches,
    -- tag matches
    (
        SELECT
            array_agg(ROW(sub.avatar_url, sub.tag_name, sub.send_id, sub.phone)::public.tag_search_result)
        FROM (
            SELECT
                ranked_matches.avatar_url,
                ranked_matches.tag_name,
                ranked_matches.send_id,
                ranked_matches.phone
            FROM (
                WITH scores AS (
                    -- Aggregate user send scores, summing all scores for cumulative activity
                    SELECT
                        user_id,
                        SUM(score) AS total_score
                    FROM private.send_scores_history
                    GROUP BY user_id
                ),
                tag_matches AS (
                    SELECT
                        p.avatar_url,
                        t.name AS tag_name,
                        p.send_id,
                        NULL::text AS phone,
                        (t.name <-> query) AS distance,  -- Trigram distance: 0=exact, higher=different
                        COALESCE(scores.total_score, 0) AS send_score,
                        -- Compute exact match flag in CTE
                        LOWER(t.name) = LOWER(query) AS is_exact,
                        -- Primary ranking: exact matches (primary_rank=0) always outrank fuzzy matches (primary_rank=1)
                        CASE WHEN LOWER(t.name) = LOWER(query) THEN 0 ELSE 1 END AS primary_rank
                    FROM profiles p
                    JOIN send_accounts sa ON sa.user_id = p.id
                    JOIN send_account_tags sat ON sat.send_account_id = sa.id
                    JOIN tags t ON t.id = sat.tag_id
                        AND t.status = 'confirmed'
                    LEFT JOIN scores ON scores.user_id = p.id
                    WHERE
                        -- Use ILIKE '%' only when NOT exact to avoid excluding true exact matches like 'Ethen_'
                        LOWER(t.name) = LOWER(query)
                        OR (NOT (LOWER(t.name) = LOWER(query)) AND (t.name <<-> query < 0.7 OR t.name ILIKE '%' || query || '%'))
                )
                SELECT
                    tm.avatar_url,
                    tm.tag_name,
                    tm.send_id,
                    tm.phone,
                    tm.distance,
                    tm.send_score,
                    tm.is_exact,
                    tm.primary_rank,
                    (
                        -- Secondary ranking varies by match type:
                        -- For exact matches (primary_rank=0): use negative send_score (higher score = better/lower secondary rank)
                        -- For fuzzy matches (primary_rank=1): use old trigram + send_score formula
                        CASE
                            WHEN tm.is_exact THEN
                                -tm.send_score  -- Negative for DESC ordering within exact matches
                            ELSE
                                -- Old fuzzy ranking formula: distance - (send_score / 1M)
                                CASE WHEN tm.distance IS NULL THEN 0 ELSE tm.distance END
                                - (tm.send_score / 1000000.0)
                        END
                    ) AS secondary_rank,
                    ROW_NUMBER() OVER (PARTITION BY tm.send_id ORDER BY (
                        -- Deduplication uses same ranking logic as main ordering
                        tm.primary_rank,  -- Primary: exact vs fuzzy
                        CASE
                            WHEN tm.is_exact THEN
                                -tm.send_score  -- Secondary: send_score DESC for exact
                            ELSE
                                CASE WHEN tm.distance IS NULL THEN 0 ELSE tm.distance END
                                - (tm.send_score / 1000000.0)  -- Secondary: old formula for fuzzy
                        END
                    )) AS rn
                FROM tag_matches tm
            ) ranked_matches
            WHERE ranked_matches.rn = 1
            ORDER BY ranked_matches.primary_rank ASC, ranked_matches.secondary_rank ASC
            LIMIT limit_val OFFSET offset_val
        ) sub
    ) AS tag_matches,
    -- phone matches, disabled for now
    (null::public.tag_search_result[]) AS phone_matches;
END;
$function$;

-- Functions (that depend on activity_feed view and send scores)

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
ALTER FUNCTION "public"."favourite_senders"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION public.recent_senders()
 RETURNS SETOF activity_feed_user
 LANGUAGE plpgsql
AS $function$
BEGIN
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

-- Step 3: Select only the most recent transfer for each counterparty
SELECT (counterparty).*  -- Return only the counterparty details
FROM numbered
WHERE occurrence_counter = 1  -- Only the most recent interaction with each counterparty
ORDER BY created_at DESC      -- Order the result by most recent transfer
    LIMIT 10;                     -- Return only the 10 most recent counterparties

END;
$function$
;

ALTER FUNCTION "public"."recent_senders"() OWNER TO "postgres";

-- Functions (that depend on activity table directly)
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

REVOKE ALL ON FUNCTION "public"."tag_search"("query" "text", "limit_val" integer, "offset_val" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."tag_search"("query" "text", "limit_val" integer, "offset_val" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."tag_search"("query" "text", "limit_val" integer, "offset_val" integer) TO "service_role";

REVOKE ALL ON FUNCTION "public"."favourite_senders"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."favourite_senders"() TO "anon";
GRANT ALL ON FUNCTION "public"."favourite_senders"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."favourite_senders"() TO "service_role";

REVOKE ALL ON FUNCTION "public"."recent_senders"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."recent_senders"() TO "anon";
GRANT ALL ON FUNCTION "public"."recent_senders"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."recent_senders"() TO "service_role";

REVOKE ALL ON FUNCTION "public"."today_birthday_senders"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."today_birthday_senders"() TO "anon";
GRANT ALL ON FUNCTION "public"."today_birthday_senders"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."today_birthday_senders"() TO "service_role";