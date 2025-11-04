drop function if exists "public"."get_friends"();

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.get_friends()
 RETURNS TABLE(avatar_url text, name text, sendid integer, x_username text, links_in_bio link_in_bio[], birthday date, tag citext, created_at timestamp with time zone, is_verified boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    RETURN QUERY
        WITH current_distribution_id AS (
            SELECT id FROM distributions
            WHERE qualification_start <= CURRENT_TIMESTAMP AT TIME ZONE 'UTC'
              AND qualification_end >= CURRENT_TIMESTAMP AT TIME ZONE 'UTC'
            ORDER BY qualification_start DESC
            LIMIT 1
        ),
        ordered_referrals AS(
            SELECT
                DISTINCT ON (r.referred_id)
                p.avatar_url,
                p.name,
                p.send_id,
                CASE WHEN p.is_public THEN p.x_username ELSE NULL END AS x_username,
                CASE WHEN p.is_public THEN
(SELECT array_agg(link_in_bio_row)
                    FROM (
                        SELECT ROW(
                            CASE WHEN lib.user_id = (SELECT auth.uid()) THEN lib.id ELSE NULL END,
                            CASE WHEN lib.user_id = (SELECT auth.uid()) THEN lib.user_id ELSE NULL END,
                            lib.handle,
                            lib.domain_name,
                            lib.created_at,
                            lib.updated_at,
                            lib.domain
                        )::link_in_bio as link_in_bio_row
                        FROM link_in_bio lib
                        WHERE lib.user_id = p.id AND lib.handle IS NOT NULL
                    ) sub)
                ELSE NULL
                END AS links_in_bio,
                CASE WHEN p.is_public THEN p.birthday ELSE NULL END AS birthday,
                t.name AS tag,
                t.created_at,
                CASE WHEN ds.user_id IS NOT NULL THEN true ELSE false END AS is_verified,
                COALESCE((
                             SELECT
                                 SUM(amount)
                             FROM distribution_shares ds
                             WHERE
                                 ds.user_id = r.referred_id
                               AND distribution_id >= 6), 0) AS send_score
            FROM
                referrals r
                    LEFT JOIN affiliate_stats a ON a.user_id = r.referred_id
                    LEFT JOIN profiles p ON p.id = r.referred_id
                    LEFT JOIN tags t ON t.user_id = r.referred_id
                    LEFT JOIN distribution_shares ds ON ds.user_id = p.id
                        AND ds.distribution_id = (SELECT id FROM current_distribution_id)
            WHERE
                r.referrer_id = (SELECT auth.uid())
                AND t.status = 'confirmed'::tag_status
            ORDER BY
                r.referred_id,
                t.created_at DESC)
        SELECT
            o.avatar_url,
            o.name,
            o.send_id as sendid, -- so it's the same as return type in profile lookup
            o.x_username,
            o.links_in_bio,
            o.birthday,
            o.tag,
            o.created_at,
            o.is_verified
        FROM
            ordered_referrals o
        ORDER BY
            send_score DESC;
END;
$function$
;


