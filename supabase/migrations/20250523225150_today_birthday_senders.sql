CREATE OR REPLACE FUNCTION today_birthday_senders()
RETURNS SETOF activity_feed_user
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
RETURN QUERY
SELECT (
   (
    NULL,
    p.name,
    p.avatar_url,
    p.send_id,
    (
        SELECT ARRAY_AGG(name)
        FROM tags
        WHERE user_id = p.id
          AND status = 'confirmed'
    )
       )::activity_feed_user
).*
FROM profiles p
WHERE is_public = TRUE
  AND p.birthday IS NOT NULL
  AND p.avatar_url IS NOT NULL
  AND EXTRACT(MONTH FROM p.birthday) = EXTRACT(MONTH FROM CURRENT_DATE)
  AND EXTRACT(DAY FROM p.birthday) = EXTRACT(DAY FROM CURRENT_DATE);
END;
$$;
