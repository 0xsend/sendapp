set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.profile_lookup(lookup_type lookup_type_enum, identifier text)
 RETURNS TABLE(id uuid, avatar_url text, name text, about text, refcode text, tag citext, address citext, chain_id integer, is_public boolean, sendid integer, all_tags text[])
 LANGUAGE plpgsql
 IMMUTABLE SECURITY DEFINER
AS $function$
begin
    if identifier is null or identifier = '' then raise exception 'identifier cannot be null or empty'; end if;
    if lookup_type is null then raise exception 'lookup_type cannot be null'; end if;
    return query --
        select case when p.id = ( select auth.uid() ) then p.id end              as id,
               p.avatar_url::text                                                as avatar_url,
               p.name::text                                                      as tag,
               p.about::text                                                     as about,
               p.referral_code                                                   as refcode,
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
               (lookup_type = 'tag' and t.name = identifier) or
               (lookup_type = 'refcode' and p.referral_code = identifier) or
               (lookup_type = 'address' and sa.address = identifier) or
               (lookup_type = 'phone' and a.phone::text = identifier))
          and (p.is_public -- allow public profiles to be returned
            or ( select auth.uid() ) is not null -- allow profiles to be returned if the user is authenticated
            or current_setting('role')::text = 'service_role') -- allow public profiles to be returned to service role
        limit 1;
end;
$function$
;


