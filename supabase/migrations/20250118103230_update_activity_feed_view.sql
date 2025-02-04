SET check_function_bodies = OFF;

DROP VIEW IF EXISTS activity_feed;

CREATE OR REPLACE VIEW activity_feed WITH ( security_barrier = ON
) AS
SELECT
    a.created_at,
    a.event_name,
    a.data,
    ROW (
        a.from_user_id,
        from_p.name,
        from_p.avatar_url,
        from_p.send_id,
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
)::text[])::activity_feed_user AS from_user,
    ROW (a.to_user_id,
        to_p.name,
        to_p.avatar_url,
        to_p.send_id,
(
            SELECT
                array_agg(DISTINCT t.name ORDER BY t.name)
            FROM
                send_account_tags sat
                JOIN send_accounts sa ON sa.id = sat.send_account_id
                JOIN tags t ON t.id = sat.tag_id
            WHERE
                sa.user_id = to_p.id
                AND t.status = 'confirmed')::text[])::activity_feed_user AS to_user
FROM
    activity a
    LEFT JOIN profiles from_p ON from_p.id = a.from_user_id
    LEFT JOIN profiles to_p ON to_p.id = a.to_user_id
WHERE
    a.from_user_id = auth.uid()
    OR a.to_user_id = auth.uid();

