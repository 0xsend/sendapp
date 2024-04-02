create or replace function public.profile_lookup(tag text)
  returns table(
    id uuid,
    avatar_url text,
    name text,
    about text,
    referral_code text,
    tag_name citext,
    address citext,
    chain_id integer,
    is_public boolean,
    send_id integer)
  language plpgsql
  immutable
  security definer
  as $function$
begin
  return query --
  select
    case when p.id = auth.uid() then
      p.id
    end as id,
    p.avatar_url::text as avatar_url,
    p.name::text as name,
    p.about::text as about,
    p.referral_code as referral_code,
    p.send_id as send_id,
    t.name as tag_name,
    sa.address as address,
    sa.chain_id as chain_id,
    case when current_setting('role')::text = 'service_role' then
      p.is_public
    end as is_public
  from
    profiles p
    join tags t on t.user_id = p.id
    join send_accounts sa on sa.user_id = p.id
  where
    t.status = 'confirmed'::tag_status
    and t.name = tag
    and(p.is_public -- allow public profiles to be returned
      or auth.uid() is not null -- allow profiles to be returned if the user is authenticated
      or current_setting('role')::text = 'service_role') -- allow public profiles to be returned to service role
  limit 1;
end;
$function$;
