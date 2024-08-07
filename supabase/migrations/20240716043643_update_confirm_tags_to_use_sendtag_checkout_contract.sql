set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.confirm_tags(tag_names citext[], event_id text, referral_code_input text)
    RETURNS void
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path TO 'public'
AS $function$
declare tag_owner_ids uuid [];

        distinct_user_ids INT;

        tag_owner_id uuid;

        referrer_id uuid;

        _event_id alias for $2;
begin
    -- Check if the tags exist and fetch their owners.
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

    if event_id is null
        or event_id = '' then raise exception 'Receipt event ID is required for paid tags.';

    end if;

    -- Ensure event_id matches the sender
    if (
           select count(distinct scr.sender)
           from public.sendtag_checkout_receipts scr
                    join send_accounts sa on decode(substring(sa.address, 3), 'hex') = scr.sender
           where scr.event_id = _event_id
             and sa.user_id = tag_owner_id
       ) <> 1 then raise exception 'Receipt event ID does not match the sender';
    end if;

    -- save receipt event_id
    insert into public.receipts (event_id, user_id) values (_event_id, tag_owner_id);

    -- Associate the tags with the onchain event
    insert into public.tag_receipts (tag_name, event_id)
    select unnest(tag_names),
           event_id;

-- Confirm the tags
    update public.tags
    set status = 'confirmed'::public.tag_status
    where name = any (tag_names)
      and status = 'pending'::public.tag_status;

-- Create referral code redemptions
    if referral_code_input is not null
        and referral_code_input <> '' then
        SELECT id INTO referrer_id
        FROM public.profiles
        WHERE referral_code = referral_code_input;

        if referrer_id is not null -- 'Referral code is not valid.'
            and referrer_id <> tag_owner_id then -- Referrer cannot be the tag owner.
            INSERT INTO public.referrals (referrer_id, referred_id, tag)
            select referrer_id,
                   tag_owner_id,
                   unnest(tag_names);

        end if;

    end if;

end;

$function$
;
