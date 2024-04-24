
drop function if exists public.tag_search(q text);
create or replace function public.tag_search(
        query text,
        limit_val integer = NULL,
        offset_val integer = NULL
    ) returns table(
        send_id_matches jsonb,
        tag_matches jsonb,
        phone_matches jsonb
    ) language plpgsql immutable security definer as $function$ 
    begin 
    if limit_val is not null
    and (
        limit_val <= 0
        or limit_val > 1000
    ) then raise exception 'limit_val must be between 1 and 1000';

    end if;

    if offset_val is not null
    and offset_val < 0 then raise exception 'offset_val must be greater than or equal to 0';

    end if;
    
    return query --
  select
    COALESCE(
        (
            select jsonb_agg(
                    jsonb_strip_nulls(
                        jsonb_build_object(
                            'avatar_url',
                            avatar_url,
                            'tag_name',
                            name,
                            'send_id',
                            send_id
                        )
                    )
                )
            from (
                    select p.avatar_url,
                        t.name,
                        p.send_id
                    from profiles p
                        join tags t on t.user_id = p.id
                    where query SIMILAR TO '\d+'
                        and p.send_id::varchar ilike '%' || query || '%'
                    order by p.send_id
                    LIMIT limit_val OFFSET offset_val
                ) sub
        ),
        '[]'
    ) as send_id_matches,
    COALESCE(
        (
            select jsonb_agg(
                    jsonb_strip_nulls(
                        jsonb_build_object(
                            'avatar_url',
                            avatar_url,
                            'tag_name',
                            name,
                            'send_id',
                            send_id
                        )
                    )
                )
            from (
                    select p.avatar_url,
                        t.name,
                        p.send_id
                    from profiles p
                        join tags t on t.user_id = p.id
                        join send_accounts sa on sa.user_id = p.id
                    where
                        t.status = 'confirmed' :: tag_status
                        and p.is_public = true
                        and(
                            t.name <<-> query < 0.9
                            or t.name ilike '%' || query || '%')
                    order by (t.name <->query) asc
                    LIMIT limit_val OFFSET offset_val
                ) sub
        ),
        '[]'
    ) as tag_matches,
    COALESCE(
        (
            select jsonb_agg(
                    jsonb_strip_nulls(
                        jsonb_build_object(
                            'avatar_url',
                            avatar_url,
                            'phone',
                            phone,
                            'tag_name',
                            tag_name,
                            'send_id',
                            send_id
                        )
                    )
                )
            from (
                    select p.avatar_url,
                        u.phone,
                        t.name as tag_name,
                        p.send_id
                    from profiles p
                        join tags t on t.user_id = p.id
                        join auth.users u on u.id = p.id
                    where query ~ '^\d{6,}$'
                        and u.phone like query || '%'
                    order by u.phone
                    LIMIT limit_val OFFSET offset_val
                ) sub
        ),
        '[]'
    ) as phone_matches;
end;
$function$;

revoke all on function public.tag_search(q text, limit_val int, offset_val int) from anon;