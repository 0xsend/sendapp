set check_function_bodies = off;

create or replace function public.tags_before_insert_or_update_func()
    returns trigger
    language plpgsql
    security definer
    set search_path to 'public'
    as $function$
begin
    -- Ensure users can only insert or update their own tags
    if new.user_id <> auth.uid() then
        raise exception 'Users can only create or modify tags for themselves';

    end if;
    -- Ensure user is not changing their confirmed tag name
    if new.status = 'confirmed'::public.tag_status and old.name <> new.name and
	current_setting('role')::text = 'authenticated' then
        raise exception 'Users cannot change the name of a confirmed tag';

    end if;
    -- Ensure user is not confirming their own tag
    if new.status = 'confirmed'::public.tag_status and current_setting('role')::text =
	'authenticated' then
        raise exception 'Users cannot confirm their own tags';

    end if;
    -- Ensure no existing pending tag with same name within the last 30 minutes by another user
    if exists(
        select
            1
        from
            public.tags
        where
            name = new.name
            and status = 'pending'::public.tag_status
            and(NOW() - created_at) < INTERVAL '30 minutes'
            and user_id != new.user_id) then
    raise exception 'Tag with same name already exists';

end if;
    -- Delete older pending tags if they belong to the same user, to avoid duplicates
    delete from public.tags
    where name = new.name
        and user_id != new.user_id
        and status = 'pending'::public.tag_status;
    -- Return the new record to be inserted or updated
    return NEW;

end;

$function$;
