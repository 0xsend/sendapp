set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.tag_search(query text, limit_val integer, offset_val integer)
 RETURNS TABLE(send_id_matches tag_search_result[], tag_matches tag_search_result[], phone_matches tag_search_result[])
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
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
                array_agg(ROW(sub.avatar_url, sub.tag_name, sub.send_id, sub.phone, sub.is_verified, sub.verified_at)::public.tag_search_result)
            FROM (
                WITH candidates AS (
                    SELECT
                        p.id AS user_id,
                        p.avatar_url,
                        p.send_id,
                        NULL::text AS phone
                    FROM profiles p
                    WHERE
                        query SIMILAR TO '\d+'
                        AND p.send_id::varchar LIKE '%' || query || '%'
                    ORDER BY p.send_id
                ),
                page AS (
                    SELECT
                        c.user_id,
                        c.avatar_url,
                        c.send_id,
                        c.phone
                    FROM candidates c
                    ORDER BY c.send_id ASC
                    LIMIT limit_val OFFSET offset_val
                ),
                enriched AS (
                    SELECT
                        page.avatar_url,
                        ct.tag_name AS tag_name,
                        page.send_id,
                        page.phone,
                        (va.verified_at_result IS NOT NULL) AS is_verified,
                        va.verified_at_result AS verified_at
                    FROM page
                    LEFT JOIN LATERAL (
                        SELECT t.name AS tag_name
                        FROM send_accounts sa2
                        JOIN send_account_tags sat2 ON sat2.send_account_id = sa2.id
                        JOIN tags t ON t.id = sat2.tag_id AND t.status = 'confirmed'
                        WHERE sa2.user_id = page.user_id
                        ORDER BY t.name ASC
                        LIMIT 1
                    ) ct ON true
                    JOIN profiles p2 ON p2.id = page.user_id
                    CROSS JOIN LATERAL (
                        SELECT public.verified_at(p2) AS verified_at_result
                    ) va
                )
                SELECT * FROM enriched
            ) sub) AS send_id_matches,
    -- tag matches
    (
        SELECT
            array_agg(ROW(sub.avatar_url, sub.tag_name, sub.send_id, sub.phone, sub.is_verified, sub.verified_at)::public.tag_search_result)
        FROM (
            WITH scores AS (
                SELECT user_id, SUM(score) AS total_score
                FROM private.send_scores_history
                GROUP BY user_id
            ),
            candidates AS (
                SELECT
                    p.id AS user_id,
                    p.avatar_url,
                    t.name AS tag_name,
                    p.send_id,
                    NULL::text AS phone,
                    (t.name <-> query) AS distance,
                    COALESCE(scores.total_score, 0) AS send_score,
                    LOWER(t.name) = LOWER(query) AS is_exact,
                    CASE WHEN LOWER(t.name) = LOWER(query) THEN 0 ELSE 1 END AS primary_rank
                FROM profiles p
                JOIN send_accounts sa ON sa.user_id = p.id
                JOIN send_account_tags sat ON sat.send_account_id = sa.id
                JOIN tags t ON t.id = sat.tag_id AND t.status = 'confirmed'
                LEFT JOIN scores ON scores.user_id = p.id
                WHERE
                    LOWER(t.name) = LOWER(query)
                    OR (NOT (LOWER(t.name) = LOWER(query)) AND (t.name <<-> query < 0.7 OR t.name ILIKE '%' || query || '%'))
            ),
            ranked AS (
                SELECT
                    c.user_id,
                    c.avatar_url,
                    c.tag_name,
                    c.send_id,
                    c.phone,
                    c.distance,
                    c.send_score,
                    c.is_exact,
                    c.primary_rank,
                    (
                        CASE
                            WHEN c.is_exact THEN -c.send_score
                            ELSE (CASE WHEN c.distance IS NULL THEN 0 ELSE c.distance END) - (c.send_score / 1000000.0)
                        END
                    ) AS secondary_rank,
                    ROW_NUMBER() OVER (
                        PARTITION BY c.send_id
                        ORDER BY c.primary_rank, (
                            CASE
                                WHEN c.is_exact THEN -c.send_score
                                ELSE (CASE WHEN c.distance IS NULL THEN 0 ELSE c.distance END) - (c.send_score / 1000000.0)
                            END
                        )
                    ) AS rn
                FROM candidates c
            ),
            page AS (
                SELECT
                    r.user_id,
                    r.avatar_url,
                    r.tag_name,
                    r.send_id,
                    r.phone,
                    r.primary_rank,
                    r.secondary_rank
                FROM ranked r
                WHERE r.rn = 1
                ORDER BY r.primary_rank ASC, r.secondary_rank ASC
                LIMIT limit_val OFFSET offset_val
            ),
            enriched AS (
                SELECT
                    page.avatar_url,
                    page.tag_name,
                    page.send_id,
                    page.phone,
                    (va.verified_at_result IS NOT NULL) AS is_verified,
                    va.verified_at_result AS verified_at,
                    page.primary_rank,
                    page.secondary_rank
                FROM page
                JOIN profiles p2 ON p2.id = page.user_id
                CROSS JOIN LATERAL (
                    SELECT public.verified_at(p2) AS verified_at_result
                ) va
            )
            SELECT
                avatar_url,
                tag_name,
                send_id,
                phone,
                is_verified,
                verified_at
            FROM enriched
            ORDER BY
                primary_rank ASC,
                CASE WHEN is_verified THEN 0 ELSE 1 END ASC,
                secondary_rank ASC
        ) sub
    ) AS tag_matches,
    -- phone matches, disabled for now
    (null::public.tag_search_result[]) AS phone_matches;
END;
$function$