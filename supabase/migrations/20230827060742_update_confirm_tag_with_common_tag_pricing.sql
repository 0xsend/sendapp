set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.confirm_tags(tag_names citext [], receipt_hash citext) RETURNS void LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public' AS $function$
declare tag_owner_ids uuid [];

distinct_user_ids INT;

tag_owner_id uuid;

free_tags citext [];

paid_tags citext [];

begin -- Check if the tags exist and fetch their owners.
select array_agg(user_id) into tag_owner_ids
from public.tags
where name = any (tag_names)
    and status = 'pending'::public.tag_status;

-- If any of the tags do not exist or are not in pending status, throw an error.
if array_length(tag_owner_ids, 1) <> array_length(tag_names, 1) then raise exception 'One or more tags do not exist or are not in pending status.';

end if;

-- Check if all tags belong to the same user
select count(distinct user_id) into distinct_user_ids
from unnest(tag_owner_ids) as user_id;

if distinct_user_ids <> 1 then raise exception 'Tags must belong to the same user.';

end if;

-- Fetch single user_id
select distinct user_id into tag_owner_id
from unnest(tag_owner_ids) as user_id;

-- Separate tags into free and paid
select array(
        select tag
        from unnest(tag_names) as tag
        where length(tag) >= 6
    ) into free_tags;

select array(
        select tag
        from unnest(tag_names) as tag
        where length(tag) < 6
    ) into paid_tags;

-- save receipt hash
if receipt_hash is not null
and receipt_hash <> '' then
insert into public.receipts (hash, user_id)
values (receipt_hash, tag_owner_id);

end if;

-- Confirm common send tags (6+ characters) first one is free, the rest are paid
if array_length(free_tags, 1) is not null then -- check if already confirmed a common tag
if array_length(
    (
        select array_agg(name)
        from public.tags
        where status = 'confirmed'::public.tag_status
            and user_id = tag_owner_id
            and length(name) >= 6
    ),
    1
) is not null then if receipt_hash is null
or receipt_hash = '' then raise exception 'Receipt hash is required for paid tags.';

end if;

end if;

-- check if more than one common send tag is being confirmed
if array_length(
    (
        select array_agg(tag)
        from unnest(free_tags) as tag
        where length(tag) >= 6
    ),
    1
) > 1 then if receipt_hash is null
or receipt_hash = '' then raise exception 'Receipt hash is required for paid tags.';

end if;

end if;

-- Associate the common tags with the receipt hash
if receipt_hash is not null
and receipt_hash <> '' then
insert into public.tag_receipts (tag_name, hash)
select unnest(free_tags),
    receipt_hash;

end if;

-- Confirm the common tags
update public.tags
set status = 'confirmed'::public.tag_status
where name = any (free_tags)
    and status = 'pending'::public.tag_status;

end if;

-- Confirm paid tags (1-5 characters) with a receipt
if array_length(paid_tags, 1) is not null then if receipt_hash is null
or receipt_hash = '' then raise exception 'Receipt hash is required for paid tags.';

end if;

update public.tags
set status = 'confirmed'::public.tag_status
where name = any (paid_tags)
    and status = 'pending'::public.tag_status;

-- Associate the paid tags with the receipt hash
insert into public.tag_receipts (tag_name, hash)
select unnest(paid_tags),
    receipt_hash;

end if;

end;

$function$;
