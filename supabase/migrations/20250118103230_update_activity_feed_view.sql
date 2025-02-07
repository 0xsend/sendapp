SET check_function_bodies = OFF;

DROP VIEW IF EXISTS activity_feed;

DROP FUNCTION IF EXISTS public.leaderboard_referrals_all_time();

DROP TYPE IF EXISTS activity_feed_user CASCADE;

CREATE TYPE activity_feed_user AS (
    id uuid,
    name text,
    avatar_url text,
    send_id integer,
    main_tag_id integer,
    main_tag_name text,
    tags text[]
);

CREATE OR REPLACE FUNCTION public.leaderboard_referrals_all_time()
    RETURNS TABLE(
        rewards_usdc numeric,
        referrals integer,
        "user" activity_feed_user)
    LANGUAGE plpgsql
    STABLE
    SECURITY DEFINER
    SET search_path TO 'public'
    AS $function$
BEGIN
    RETURN query
    SELECT
        l.rewards_usdc,
        l.referrals,
        ROW(
            CASE WHEN l.user_id = auth.uid() THEN
                auth.uid()
            ELSE
                NULL
            END,
            p.name,
            p.avatar_url,
            p.send_id,
            sa.main_tag_id,
(
                SELECT
                    name
                FROM
                    tags
                WHERE
                    id = sa.main_tag_id),
(
                    SELECT
                        array_agg(DISTINCT t.name ORDER BY t.name)
                    FROM
                        send_account_tags sat
                        JOIN tags t ON t.id = sat.tag_id
                    WHERE
                        sat.send_account_id = sa.id
                        AND t.status = 'confirmed'))::activity_feed_user AS "user"
        FROM
            private.leaderboard_referrals_all_time l
            JOIN profiles p ON p.id = user_id
            LEFT JOIN send_accounts sa ON sa.user_id = p.id
        WHERE
            p.is_public = TRUE;
END
$function$;

-- Revoke execute from public and anon
REVOKE EXECUTE ON FUNCTION public.leaderboard_referrals_all_time() FROM public;

REVOKE EXECUTE ON FUNCTION public.leaderboard_referrals_all_time() FROM anon;

-- Grant execute to authenticated only
GRANT EXECUTE ON FUNCTION public.leaderboard_referrals_all_time() TO authenticated;

CREATE OR REPLACE VIEW activity_feed WITH ( security_barrier = ON
) AS
SELECT
    a.created_at,
    a.event_name,
    CASE WHEN a.from_user_id = from_p.id THEN
        ROW (
            CASE WHEN a.from_user_id = auth.uid(
) THEN
                auth.uid(
)
            ELSE
                NULL::uuid
            END,
            from_p.name,
            from_p.avatar_url,
            from_p.send_id,
            from_sa.main_tag_id,
(
                SELECT
                    name
                FROM
                    tags
                WHERE
                    id = from_sa.main_tag_id
),
(
                    SELECT
                        array_agg(
                            DISTINCT t.name ORDER BY t.name
)
                    FROM
                        send_account_tags sat
                        JOIN send_accounts sa ON sa.id = sat.send_account_id
                        JOIN tags t ON t.id = sat.tag_id
                    WHERE
                        sa.user_id = from_p.id
                        AND t.status = 'confirmed'
))::activity_feed_user
        ELSE
            NULL::activity_feed_user
    END AS from_user,
    CASE WHEN a.to_user_id = to_p.id THEN
        ROW (
            CASE WHEN a.to_user_id = auth.uid() THEN
                auth.uid()
            ELSE
                NULL::uuid
            END,
            to_p.name,
            to_p.avatar_url,
            to_p.send_id,
            to_sa.main_tag_id,
(
                SELECT
                    name
                FROM
                    tags
                WHERE
                    id = to_sa.main_tag_id),(
                    SELECT
                        array_agg(DISTINCT t.name ORDER BY t.name)
                    FROM
                        send_account_tags sat
                        JOIN send_accounts sa ON sa.id = sat.send_account_id
                        JOIN tags t ON t.id = sat.tag_id
                    WHERE
                        sa.user_id = to_p.id
                        AND t.status = 'confirmed'))::activity_feed_user
        ELSE
            NULL::activity_feed_user
    END AS to_user,
    a.data
FROM
    activity a
    LEFT JOIN profiles from_p ON a.from_user_id = from_p.id
    LEFT JOIN send_accounts from_sa ON from_sa.user_id = from_p.id
    LEFT JOIN profiles to_p ON a.to_user_id = to_p.id
    LEFT JOIN send_accounts to_sa ON to_sa.user_id = to_p.id
WHERE
    a.from_user_id = auth.uid()
    OR a.to_user_id = auth.uid();

