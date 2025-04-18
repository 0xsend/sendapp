drop function if exists "public"."get_affiliate_referrals"();

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.get_affiliate_referrals()
 RETURNS TABLE(send_plus_minus numeric, avatar_url text, tag citext, created_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    RETURN QUERY
        WITH ordered_referrals AS(
            SELECT
                COALESCE(a.send_plus_minus, 0)::numeric AS send_plus_minus,
                p.avatar_url,
                t.name AS tag,
                t.created_at,
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
            WHERE
                r.referrer_id = auth.uid())
        SELECT
            o.send_plus_minus,
            o.avatar_url,
            o.tag,
            o.created_at
        FROM
            ordered_referrals o
        ORDER BY
            send_score DESC;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_affiliate_stats_summary()
 RETURNS TABLE(id uuid, created_at timestamp with time zone, user_id uuid, referral_count bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    RETURN QUERY
        SELECT
            a.id,
            a.created_at,
            a.user_id,
            COUNT(DISTINCT r.referred_id)::bigint AS referral_count
        FROM
            affiliate_stats a
                LEFT JOIN referrals r ON r.referrer_id = a.user_id
        WHERE
            a.user_id = auth.uid()
        GROUP BY
            a.id,
            a.created_at,
            a.user_id;
END;
$function$
;


