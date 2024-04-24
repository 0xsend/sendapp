drop type if exists public.tag_search_result cascade;
create type public.tag_search_result as (
                                            avatar_url text,
                                            tag_name text,
                                            send_id integer,
                                            phone text
                                        );

drop function if exists public.tag_search(q text);
create or replace function public.tag_search(
    query text,
    limit_val integer = NULL,
    offset_val integer = NULL
) returns table(
                   send_id_matches public.tag_search_result[],
                   tag_matches public.tag_search_result[],
                   phone_matches public.tag_search_result[]
               ) language plpgsql immutable security definer as $function$
                begin
                    if limit_val is not null
                    and (
                        limit_val <= 0
                        or limit_val > 100
                    ) then raise exception 'limit_val must be between 1 and 100';
                    end if;
                    if offset_val is not null
                    and offset_val < 0 then raise exception 'offset_val must be greater than or equal to 0';
                    end if;
                return query --
    select
        (
            select array_agg(row(sub.avatar_url, sub.tag_name, sub.send_id, sub.phone)::public.tag_search_result)
            from (
                     select p.avatar_url, t.name as tag_name, p.send_id, null::text as phone
                     from profiles p
                              join tags t on t.user_id = p.id
                     where query SIMILAR TO '\d+'
                       and p.send_id::varchar ilike '%' || query || '%'
                     order by p.send_id
                     limit limit_val offset offset_val
                 ) sub
        ) as send_id_matches,
        (
            select array_agg(row(sub.avatar_url, sub.tag_name, sub.send_id, sub.phone)::public.tag_search_result)
            from (
                     select p.avatar_url, t.name as tag_name, p.send_id, null::text as phone
                     from profiles p
                              join tags t on t.user_id = p.id
                     where t.name ILIKE '%' || query || '%'
                     order by (t.name <-> query)
                     limit limit_val offset offset_val
                 ) sub
        ) as tag_matches,
        (
            select array_agg(row(sub.avatar_url, sub.tag_name, sub.send_id, sub.phone)::public.tag_search_result)
            from (
                     select p.avatar_url, t.name as tag_name, p.send_id, u.phone
                     from profiles p
                              join tags t on t.user_id = p.id
                              join auth.users u on u.id = p.id
                     where query ~ '^\d{6,}$'
                       and u.phone like query || '%'
                     order by u.phone
                     limit limit_val offset offset_val
                 ) sub
        ) as phone_matches;
end;
$function$;

revoke all on function public.tag_search(q text, limit_val int, offset_val int) from anon;