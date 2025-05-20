-- new function to get info of referred people but only 1st tag per user, no duplicated users
CREATE OR REPLACE FUNCTION public.get_friends()
RETURNS TABLE(avatar_url text, x_username text, birthday date, tag citext, created_at timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    RETURN QUERY
        WITH ordered_referrals AS(
            SELECT
                DISTINCT ON (r.referred_id)
                p.avatar_url,
                CASE WHEN p.is_public THEN p.x_username ELSE NULL END AS x_username,
                CASE WHEN p.is_public THEN p.birthday ELSE NULL END AS birthday,
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
                r.referrer_id = auth.uid()
            ORDER BY
                r.referred_id,
                t.created_at DESC)
        SELECT
            o.avatar_url,
            o.x_username,
            o.birthday,
            o.tag,
            o.created_at
        FROM
            ordered_referrals o
        ORDER BY
            send_score DESC;
END;
$function$
;

-- need to drop it due to changes in its return type, it's then recreated without any changes
DROP FUNCTION IF EXISTS referrer_lookup;

-- need to drop this view due to changes in return type of profile lookup, it's then recreated without any changes
DROP VIEW IF EXISTS referrer;

-- cannot change return type of existing function, need to drop it and recreate it with changes
drop function if exists "public"."profile_lookup"(lookup_type lookup_type_enum, identifier text);

-- cannot alter return types, need to drop and recreate with changes
DROP TYPE IF EXISTS profile_lookup_result;

-- recreating type with new fields
CREATE TYPE profile_lookup_result AS (
    id uuid,
    avatar_url text,
    name text,
    about text,
    refcode text,
    x_username text,
    birthday date, -- new field
    tag citext,
    address citext,
    chain_id integer,
    is_public boolean,
    sendid integer,
    all_tags text[]
    );

-- didn't change function code, just recreating it
-- function so users can find who referred them.
CREATE OR REPLACE FUNCTION referrer_lookup(referral_code text default null)
RETURNS TABLE(
    referrer profile_lookup_result,
    new_referrer profile_lookup_result
)
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
ref_result profile_lookup_result;
    new_ref_result profile_lookup_result;
    referrer_send_id text;
BEGIN
    -- Find the current user's referrer's send_id (if exists)
SELECT send_id INTO referrer_send_id
FROM referrals r
         JOIN profiles p ON r.referrer_id = p.id
WHERE r.referred_id = auth.uid()
    LIMIT 1;

-- Look up existing referrer if valid send_id exists
IF referrer_send_id IS NOT NULL AND referrer_send_id != '' THEN
SELECT * INTO ref_result
FROM profile_lookup('sendid'::lookup_type_enum, referrer_send_id)
         LIMIT 1;
END IF;

    -- Look up new referrer if:
    -- 1. referral_code is valid AND
    -- 2. No existing referrer found
    IF referral_code IS NOT NULL AND referral_code != '' AND referrer_send_id IS NULL THEN
        -- Try tag lookup first, then refcode if needed
SELECT * INTO new_ref_result
FROM profile_lookup('tag'::lookup_type_enum, referral_code)
         LIMIT 1;

IF new_ref_result IS NULL THEN
SELECT * INTO new_ref_result
FROM profile_lookup('refcode'::lookup_type_enum, referral_code)
         LIMIT 1;
END IF;
END IF;

RETURN QUERY
SELECT ref_result, new_ref_result;
END;
$$;

-- added birthday to return type, changed x_username logic
CREATE OR REPLACE FUNCTION public.profile_lookup(lookup_type lookup_type_enum, identifier text)
 RETURNS TABLE(id uuid, avatar_url text, name text, about text, refcode text, x_username text, birthday date, tag citext, address citext, chain_id integer, is_public boolean, sendid integer, all_tags text[])
 LANGUAGE plpgsql
 IMMUTABLE SECURITY DEFINER
AS $function$
begin
    if identifier is null or identifier = '' then raise exception 'identifier cannot be null or empty'; end if;
    if lookup_type is null then raise exception 'lookup_type cannot be null'; end if;
return query --
select case when p.id = ( select auth.uid() ) then p.id end              as id,
       p.avatar_url::text                                                as avatar_url,
        p.name::text                                                      as name,
        p.about::text                                                     as about,
        p.referral_code                                                   as refcode,
       CASE WHEN p.is_public THEN p.x_username ELSE NULL END AS x_username, -- changed to be null if profile is private
       CASE WHEN p.is_public THEN p.birthday ELSE NULL END AS birthday, -- added birthday to return type, returns null if profile is private
       t.name                                                            as tag,
       sa.address                                                        as address,
       sa.chain_id                                                       as chain_id,
       case when current_setting('role')::text = 'service_role' then p.is_public
            when p.is_public then true
            else false end                                               as is_public,
       p.send_id                                                         as sendid,
       ( select array_agg(t.name::text)
         from tags t
         where t.user_id = p.id and t.status = 'confirmed'::tag_status ) as all_tags
from profiles p
    join auth.users a on a.id = p.id
    left join tags t on t.user_id = p.id and t.status = 'confirmed'::tag_status
    left join send_accounts sa on sa.user_id = p.id
where ((lookup_type = 'sendid' and p.send_id::text = identifier) or
    (lookup_type = 'tag' and t.name = identifier::citext) or
    (lookup_type = 'refcode' and p.referral_code = identifier) or
    (lookup_type = 'address' and sa.address = identifier) or
    (p.is_public and lookup_type = 'phone' and a.phone::text = identifier)) -- lookup by phone number when profile is public
  and (p.is_public -- allow public profiles to be returned
   or ( select auth.uid() ) is not null -- allow profiles to be returned if the user is authenticated
   or current_setting('role')::text = 'service_role') -- allow public profiles to be returned to service role
    limit 1;
end;
$function$
;

-- no changes to the view, just recreating it
create or replace view referrer with (security_barrier = ON) as
(
  with referrer as (
    select send_id
    from referrals r
    join profiles p on r.referrer_id = p.id
    where r.referred_id = (select auth.uid())
    order by created_at
    limit 1
  ),
  profile_lookup as (
    select *
    from profile_lookup(
      'sendid'::lookup_type_enum,
      (select send_id::text from referrer)
    ) as p join referrer on send_id is not null)
  select * from profile_lookup
);
