set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.canton_top_senders(page_number integer DEFAULT 0, page_size integer DEFAULT 10)
 RETURNS SETOF canton_top_sender_result
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    -- Validate and cap page_size to prevent abuse
    IF page_size > 50 THEN
        page_size := 50;
    END IF;

    IF page_size < 1 THEN
        page_size := 1;
    END IF;

    -- Ensure page_number is not negative
    IF page_number < 0 THEN
        page_number := 0;
    END IF;

    RETURN QUERY
    WITH valid_users AS (
        SELECT
            p.id,
            p.name,
            p.avatar_url,
            p.send_id,
            ARRAY_AGG(t.name) AS tag_names,
            cpv.canton_wallet_address
        FROM canton_party_verifications cpv
        INNER JOIN profiles p ON p.id = cpv.user_id
        INNER JOIN tags t ON t.user_id = p.id
        WHERE p.is_public = TRUE
          AND t.status = 'confirmed'
          AND cpv.is_discoverable = TRUE
        GROUP BY p.id, p.name, p.avatar_url, p.send_id, cpv.canton_wallet_address
    ),
    user_scores AS (
        SELECT
            ss.user_id,
            COALESCE(SUM(ss.score), 0) AS send_score
        FROM send_scores ss
        WHERE ss.user_id IN (SELECT id FROM valid_users)
        GROUP BY ss.user_id
        HAVING COALESCE(SUM(ss.score), 0) > 0
    )
    SELECT
        vu.avatar_url,
        vu.name,
        vu.send_id,
        main_tag.name AS main_tag_name,
        vu.tag_names,
        vu.canton_wallet_address
    FROM valid_users vu
    INNER JOIN user_scores us ON us.user_id = vu.id
    LEFT JOIN send_accounts sa ON sa.user_id = vu.id
    LEFT JOIN tags main_tag ON main_tag.id = sa.main_tag_id
    ORDER BY us.send_score DESC
    LIMIT page_size
    OFFSET page_number * page_size;
END;
$function$
;

-- Grant public access to canton_top_senders function (used directly via Supabase API)
REVOKE ALL ON FUNCTION "public"."canton_top_senders"(integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION "public"."canton_top_senders"(integer, integer) TO "anon";
GRANT EXECUTE ON FUNCTION "public"."canton_top_senders"(integer, integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."canton_top_senders"(integer, integer) TO "service_role";

-- Grant type access for anon users
REVOKE USAGE ON TYPE "public"."canton_top_sender_result" FROM PUBLIC;
GRANT USAGE ON TYPE "public"."canton_top_sender_result" TO "anon";
GRANT USAGE ON TYPE "public"."canton_top_sender_result" TO "authenticated";
GRANT USAGE ON TYPE "public"."canton_top_sender_result" TO "service_role";

