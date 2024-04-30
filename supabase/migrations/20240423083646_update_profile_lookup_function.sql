DROP TYPE IF EXISTS public.id_type_enum CASCADE;
DROP function if exists public.profile_lookup(tag text);
CREATE TYPE id_type_enum AS ENUM(
  'send_id',
  'tag_name',
  'referral_code',
  'address',
  'phone'
);

CREATE OR REPLACE FUNCTION public.profile_lookup(id_type id_type_enum, identifier text)
  RETURNS TABLE(
    id uuid,
    avatar_url text,
    name text,
    about text,
    referral_code text,
    tag_name citext,
    address citext,
    phone text,
    chain_id integer,
    is_public boolean,
    send_id integer,
    all_tags text[])
  LANGUAGE plpgsql
  IMMUTABLE
  SECURITY DEFINER
  AS $function$
BEGIN
  IF identifier IS NULL OR identifier = '' THEN
    RAISE EXCEPTION 'identifier cannot be null or empty';
  END IF;
  IF id_type IS NULL THEN
    RAISE EXCEPTION 'id_type cannot be null';
  END IF;
  RETURN query --
  SELECT
    CASE WHEN p.id =(
      SELECT
        auth.uid()) THEN
      p.id
    END AS id,
    p.avatar_url::text AS avatar_url,
    p.name::text AS name,
    p.about::text AS about,
    p.referral_code AS referral_code,
    t.name AS tag_name,
    sa.address AS address,
    a.phone AS phone,
    sa.chain_id AS chain_id,
    CASE WHEN current_setting('role')::text = 'service_role' THEN
      p.is_public
    WHEN p.is_public THEN
      TRUE
    ELSE
      FALSE
    END AS is_public,
    p.send_id AS send_id
    ,(
      SELECT
        array_agg(t.name::text)
      FROM
        tags t
      WHERE
        t.user_id = p.id
        AND t.status = 'confirmed'::tag_status) AS all_tags
  FROM
    profiles p
    JOIN auth.users a ON a.id = p.id
    LEFT JOIN tags t ON t.user_id = p.id
      AND t.status = 'confirmed'::tag_status
  LEFT JOIN send_accounts sa ON sa.user_id = p.id
WHERE((id_type = 'send_id'
    AND p.send_id::text = identifier)
    OR(id_type = 'tag_name'
      AND t.name = identifier)
    OR(id_type = 'referral_code'
      AND p.referral_code = identifier)
    OR(id_type = 'address'
      AND sa.address = identifier)
    OR(id_type = 'phone'
      AND a.phone::text = identifier))
    AND(p.is_public -- allow public profiles to be returned
      OR(
        SELECT
          auth.uid()) IS NOT NULL -- allow profiles to be returned if the user is authenticated
        OR current_setting('role')::text = 'service_role') -- allow public profiles to be returned to service role
  LIMIT 1;
END;
$function$;

