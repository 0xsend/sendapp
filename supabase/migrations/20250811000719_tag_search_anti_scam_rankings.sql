set check_function_bodies = off;

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
$function$
;