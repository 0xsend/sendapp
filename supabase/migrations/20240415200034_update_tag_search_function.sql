DROP TYPE IF EXISTS public.tag_search_result CASCADE;

CREATE TYPE public.tag_search_result AS (
    avatar_url text,
    tag_name text,
    send_id integer,
    phone text
);

DROP FUNCTION IF EXISTS public.tag_search(q text);

CREATE OR REPLACE FUNCTION public.tag_search(query text, limit_val integer, offset_val integer)
    RETURNS TABLE(
        send_id_matches public.tag_search_result[],
        tag_matches public.tag_search_result[],
        phone_matches public.tag_search_result[])
    LANGUAGE plpgsql
    IMMUTABLE
    SECURITY DEFINER
    AS $function$
BEGIN
    IF limit_val IS NULL OR(limit_val <= 0 OR limit_val > 100) THEN
        RAISE EXCEPTION 'limit_val must be between 1 and 100';
    END IF;
    IF offset_val IS NULL OR offset_val < 0 THEN
        RAISE EXCEPTION 'offset_val must be greater than or equal to 0';
    END IF;
    RETURN query --
    SELECT
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
                    JOIN tags t ON t.user_id = p.id
                WHERE
                    query SIMILAR TO '\d+'
                    AND p.send_id::varchar ILIKE '%' || query || '%'
                ORDER BY
                    p.send_id
                LIMIT limit_val offset offset_val) sub) AS send_id_matches,
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
                JOIN tags t ON t.user_id = p.id
            WHERE
                t.status = 'confirmed'
                AND(t.name <<-> query < 0.7
                    OR t.name ILIKE '%' || query || '%')
            ORDER BY
(t.name <-> query)
            LIMIT limit_val offset offset_val) sub) AS tag_matches,
(
        SELECT
            array_agg(ROW(sub.avatar_url, sub.tag_name, sub.send_id, sub.phone)::public.tag_search_result)
        FROM(
            SELECT
                p.avatar_url,
                t.name AS tag_name,
                p.send_id,
                u.phone
            FROM
                profiles p
            LEFT JOIN tags t ON t.user_id = p.id
            JOIN auth.users u ON u.id = p.id
        WHERE
            query ~ '^\d{6,}$'
            AND u.phone LIKE query || '%'
        ORDER BY
            u.phone
        LIMIT limit_val offset offset_val) sub) AS phone_matches;
END;
$function$;

REVOKE ALL ON FUNCTION public.tag_search(q text, limit_val int, offset_val int) FROM anon;

