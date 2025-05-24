CREATE OR REPLACE FUNCTION public.tag_search(query text, limit_val integer, offset_val integer)
    RETURNS TABLE(
        send_id_matches tag_search_result[],
        tag_matches tag_search_result[],
        phone_matches tag_search_result[])
    LANGUAGE plpgsql
    IMMUTABLE
    SECURITY DEFINER
    AS $$
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
FROM( SELECT DISTINCT ON(p.id)
    p.avatar_url, t.name AS tag_name, p.send_id, NULL::text AS phone FROM profiles p
    JOIN send_accounts sa ON sa.user_id = p.id
    JOIN send_account_tags sat ON sat.send_account_id = sa.id
    JOIN tags t ON t.id = sat.tag_id
        AND t.status = 'confirmed'
WHERE(t.name <<-> query < 0.7
        OR t.name ILIKE '%' || query || '%')
ORDER BY p.id,(t.name <-> query)
LIMIT limit_val offset offset_val) sub) AS tag_matches,
    -- phone matches
(
        SELECT
            array_agg(ROW(sub.avatar_url, NULL::text, sub.send_id, sub.phone)::public.tag_search_result)
        FROM(
            SELECT
                p.avatar_url, p.send_id, u.phone
            FROM profiles p
            JOIN auth.users u ON u.id = p.id
        WHERE
            p.is_public
            AND query ~ '^\d{8,}$'
            AND u.phone LIKE query || '%' ORDER BY u.phone LIMIT limit_val offset offset_val) sub) AS phone_matches;
END;
$$;

