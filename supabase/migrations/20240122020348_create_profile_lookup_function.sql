CREATE OR REPLACE FUNCTION public.profile_lookup(tag text) RETURNS TABLE(
    avatar_url text,
    name text,
    about text,
    referral_code text,
    tag_name citext,
    address citext,
    chain_id integer
  ) LANGUAGE plpgsql IMMUTABLE SECURITY DEFINER AS $function$ begin return query --
        select p.avatar_url::text as avatar_url,
  p.name::text as name,
  p.about::text as about,
  p.referral_code as referral_code,
  t.name as tag_name,
  sa.address as address,
  sa.chain_id as chain_id
from profiles p
  join tags t on t.user_id = p.id
  join send_accounts sa on sa.user_id = p.id
where t.status = 'confirmed'::tag_status
  and t.name = tag
limit 1;

end;

$function$;
