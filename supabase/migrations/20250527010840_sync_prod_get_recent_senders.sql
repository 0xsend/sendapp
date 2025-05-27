CREATE OR REPLACE FUNCTION public.get_recent_senders()
 RETURNS TABLE(account_id bigint, name text, avatar_url text, address citext, send_id bigint, tag citext)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  user_profile profiles;
BEGIN
  -- Get the current user's profile
  SELECT * INTO user_profile FROM profiles WHERE id = auth.uid();

  RETURN QUERY
  WITH recent_transfers AS (
    SELECT DISTINCT f, block_time
    FROM send_account_transfers
    WHERE t = decode(substring(user_profile.address, 3), 'hex')
      AND f != decode(substring(user_profile.address, 3), 'hex')
    ORDER BY block_time DESC
    LIMIT 100
  ),
  sender_profiles AS (
    SELECT DISTINCT ON (sa.address)
      sa.id AS account_id,
      p.name,
      p.avatar_url,
      sa.address,
      p.send_id,
      t.name AS tag
    FROM recent_transfers rt
    JOIN send_accounts sa ON sa.address = concat('0x', encode(rt.f, 'hex'))::citext
    JOIN profiles p ON p.id = sa.user_id
    LEFT JOIN tags t ON t.user_id = p.id AND t.status = 'confirmed'
    WHERE sa.user_id != auth.uid()
    ORDER BY sa.address, rt.block_time DESC
  )
  SELECT sp.*
  FROM sender_profiles sp
  LIMIT 50;
END;
$function$
;
