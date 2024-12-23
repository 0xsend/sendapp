set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.tag_search(query text, limit_val integer, offset_val integer)
 RETURNS TABLE(send_id_matches tag_search_result[], tag_matches tag_search_result[], phone_matches tag_search_result[])
 LANGUAGE plpgsql
 IMMUTABLE SECURITY DEFINER
AS $function$
begin
    if limit_val is null or (limit_val <= 0 or limit_val > 100) then
        raise exception 'limit_val must be between 1 and 100';
    end if;
    if offset_val is null or offset_val < 0 then
        raise exception 'offset_val must be greater than or equal to 0';
    end if;
    return query --
        select ( select array_agg(row (sub.avatar_url, sub.tag_name, sub.send_id, sub.phone)::public.tag_search_result)
                 from ( select p.avatar_url, t.name as tag_name, p.send_id, null::text as phone
                        from profiles p
                                left join tags t on t.user_id = p.id and t.status = 'confirmed'
                        where query similar to '\d+'
                          and p.send_id::varchar like '%' || query || '%'
                        order by p.send_id
                        limit limit_val offset offset_val ) sub ) as send_id_matches,
               ( select array_agg(row (sub.avatar_url, sub.tag_name, sub.send_id, sub.phone)::public.tag_search_result)
                 from ( select p.avatar_url, t.name as tag_name, p.send_id, null::text as phone
                        from profiles p
                                join tags t on t.user_id = p.id
                        where t.status = 'confirmed'
                          and (t.name <<-> query < 0.7 or t.name ilike '%' || query || '%')
                        order by (t.name <-> query)
                        limit limit_val offset offset_val ) sub ) as tag_matches,
               ( select array_agg(row (sub.avatar_url, sub.tag_name, sub.send_id, sub.phone)::public.tag_search_result)
                 from ( select p.avatar_url, t.name as tag_name, p.send_id, u.phone
                        from profiles p
                                 left join tags t on t.user_id = p.id and t.status = 'confirmed'
                                 join auth.users u on u.id = p.id
                        where p.is_public
                          and query ~ '^\d{8,}$'
                          and u.phone like query || '%'
                        order by u.phone
                        limit limit_val offset offset_val ) sub ) as phone_matches;
end;
$function$
;

revoke all on function public.tag_search(q text, limit_val int, offset_val int) from anon;
