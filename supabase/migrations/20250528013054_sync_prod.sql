set check_function_bodies = off;







set check_function_bodies = off;
















CREATE OR REPLACE FUNCTION public.recent_senders()
 RETURNS SETOF activity_feed_user
 LANGUAGE plpgsql
AS $function$
BEGIN
RETURN QUERY

    -- Step 1: Filter relevant transfers and determine the counterparty
    WITH user_transfers AS (
        SELECT *,
            -- Determine the counterparty: if the current user is the sender, use the recipient, and vice versa
            CASE
                WHEN (from_user).id = (select auth.uid()) THEN to_user -- only change is to use (select auth.uid()) instead of auth.uid()
                ELSE from_user
            END AS counterparty
        FROM activity_feed
        -- Only include rows where both from_user and to_user have a send_id (indicates a transfer between users)
        WHERE (from_user).send_id IS NOT NULL
          AND (to_user).send_id IS NOT NULL
    ),

    -- Step 2: Assign a row number to each transfer per counterparty, ordered by most recent
    numbered AS (
        SELECT *,
            ROW_NUMBER() OVER (
                PARTITION BY (counterparty).send_id  -- Group by each unique counterparty
                ORDER BY created_at DESC             -- Order by most recent transfer first
            ) AS occurrence_counter
        FROM user_transfers
    )

-- Step 3: Select only the most recent transfer for each counterparty
SELECT (counterparty).*  -- Return only the counterparty details
FROM numbered
WHERE occurrence_counter = 1  -- Only the most recent interaction with each counterparty
ORDER BY created_at DESC      -- Order the result by most recent transfer
    LIMIT 10;                     -- Return only the 10 most recent counterparties

END;
$function$
;

CREATE OR REPLACE FUNCTION public.referrer_lookup(referral_code text DEFAULT NULL::text)
 RETURNS TABLE(referrer profile_lookup_result, new_referrer profile_lookup_result)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.send_account_receives_insert_activity_trigger()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
declare
    _f_user_id uuid;
    _t_user_id uuid;
    _data      jsonb;
begin
    -- select send_account_receives.event_id into _f_user_id;
    select user_id into _f_user_id from send_accounts where address = concat('0x', encode(NEW.sender, 'hex'))::citext;
    select user_id into _t_user_id from send_accounts where address = concat('0x', encode(NEW.log_addr, 'hex'))::citext;

    _data := jsonb_build_object(
        'log_addr', NEW.log_addr,
        'sender', NEW.sender,
        -- cast value to text to avoid losing precision when converting to json when sending to clients
        'value', NEW.value::text,
        'tx_hash', NEW.tx_hash,
        'block_num', NEW.block_num::text,
        'tx_idx', NEW.tx_idx::text,
        'log_idx', NEW.log_idx::text
    );

    insert into activity (event_name, event_id, from_user_id, to_user_id, data, created_at)
    values ('send_account_receives',
            NEW.event_id,
            _f_user_id,
            _t_user_id,
            _data,
            to_timestamp(NEW.block_time) at time zone 'UTC')
    on conflict (event_name, event_id) do update set
        from_user_id = _f_user_id,
        to_user_id = _t_user_id,
        data = _data,
        created_at = to_timestamp(NEW.block_time) at time zone 'UTC';

    return NEW;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.send_account_signing_key_added_trigger_insert_activity()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
declare
    _f_user_id uuid;
    _data      jsonb;
begin
    select user_id from send_accounts where address = concat('0x', encode(NEW.account, 'hex'))::citext into _f_user_id;

    select json_build_object(
        'log_addr', NEW.log_addr,
        'account', NEW.account,
        'key_slot', NEW.key_slot,
        'key',json_agg(key order by abi_idx),
        'tx_hash', NEW.tx_hash,
        'block_num', NEW.block_num::text,
        'tx_idx', NEW.tx_idx::text,
        'log_idx', NEW.log_idx::text
    )
    from send_account_signing_key_added
    where src_name = NEW.src_name
      and ig_name = NEW.ig_name
      and block_num = NEW.block_num
      and tx_idx = NEW.tx_idx
      and log_idx = NEW.log_idx
    group by ig_name, src_name, block_num, tx_idx, log_idx
    into _data;

    insert into activity (event_name, event_id, from_user_id, to_user_id, data, created_at)
    values ('send_account_signing_key_added',
            NEW.event_id,
            _f_user_id,
            null,
            _data,
            to_timestamp(NEW.block_time) at time zone 'UTC')
    on conflict (event_name, event_id) do update set
        from_user_id = _f_user_id,
        to_user_id = null,
        data = _data,
        created_at = to_timestamp(NEW.block_time) at time zone 'UTC';

    return NEW;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.send_account_signing_key_removed_trigger_insert_activity()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
declare
    _f_user_id uuid;
    _data      jsonb;
begin
    select user_id from send_accounts where address = concat('0x', encode(NEW.account, 'hex'))::citext into _f_user_id;

    select json_build_object(
        'log_addr',
        NEW.log_addr,
        'account', NEW.account,
        'key_slot', NEW.key_slot,
        'key', json_agg(key order by abi_idx),
        'tx_hash', NEW.tx_hash,
        'block_num', NEW.block_num::text,
        'tx_idx', NEW.tx_idx::text,
        'log_idx', NEW.log_idx::text
    )
    from send_account_signing_key_removed
    where src_name = NEW.src_name
      and ig_name = NEW.ig_name
      and block_num = NEW.block_num
      and tx_idx = NEW.tx_idx
      and log_idx = NEW.log_idx
    group by ig_name, src_name, block_num, tx_idx, log_idx
    into _data;

    insert into activity (event_name, event_id, from_user_id, to_user_id, data, created_at)
    values ('send_account_signing_key_removed',
            NEW.event_id,
            _f_user_id,
            null,
            _data,
            to_timestamp(NEW.block_time) at time zone 'UTC')
    on conflict (event_name, event_id) do update set from_user_id = _f_user_id,
                                                     to_user_id   = null,
                                                     data         = _data,
                                                     created_at   = to_timestamp(NEW.block_time) at time zone 'UTC';

    return NEW;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.send_accounts_after_insert()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$ BEGIN -- Ensure that a user does not exceed the send_accounts limit
    IF (
           SELECT COUNT(*)
           FROM public.send_accounts
           WHERE user_id = NEW.user_id
       ) > 1 THEN RAISE EXCEPTION 'User can have at most 1 send account';

    END IF;

-- Return the new record to be inserted or updated
    RETURN NEW;

END;

$function$
;

CREATE OR REPLACE FUNCTION public.stop_change_send_id()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$ BEGIN

  IF OLD.send_id <> NEW.send_id THEN
    RAISE EXCEPTION 'send_id cannot be changed';
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.tags_after_insert_or_update_func()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$ BEGIN -- Ensure that a user does not exceed the tag limit
    IF (
        SELECT COUNT(*)
        FROM public.tags
        WHERE user_id = NEW.user_id
            AND TG_OP = 'INSERT'
    ) > 5 THEN RAISE EXCEPTION 'User can have at most 5 tags';

END IF;

-- Return the new record to be inserted or updated
RETURN NEW;

END;

$function$
;

CREATE OR REPLACE FUNCTION public.today_birthday_senders()
 RETURNS SETOF activity_feed_user
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
RETURN QUERY

WITH filtered_profiles AS (
    SELECT *
    FROM profiles p
    WHERE p.is_public = TRUE -- only public profiles
    AND p.birthday IS NOT NULL -- Ensure birthday is set
    AND p.avatar_url IS NOT NULL -- Ensure avatar is set
    AND EXTRACT(MONTH FROM p.birthday) = EXTRACT(MONTH FROM CURRENT_DATE) -- Match current month
    AND EXTRACT(DAY FROM p.birthday) = EXTRACT(DAY FROM CURRENT_DATE) -- Match current day
    -- Ensure user has at least one tag associated via tag_receipts, 1 paid tag
    -- This where can be removed after
    AND EXISTS (
        SELECT 1
        FROM tags t
        JOIN tag_receipts tr ON tr.tag_name = t.name
        WHERE t.user_id = p.id
    )
    -- Ensure user is part of the most recent distribution, means user have sent SEND at least once in current month and has min balance
    AND EXISTS (
        SELECT 1
        FROM distribution_shares ds
        WHERE ds.user_id = p.id
        AND ds.distribution_id = (
            SELECT MAX(d.id)
            FROM distributions d
        )
    )
)

SELECT (
   (
        NULL, -- Placeholder for the 'id' field in activity_feed_user, don't want to show users' IDs
        fp.name,
        fp.avatar_url,
        fp.send_id,
        (
            -- Aggregate all confirmed tags for the user into an array
            SELECT ARRAY_AGG(t.name)
            FROM tags t
            WHERE t.user_id = fp.id
              AND t.status = 'confirmed'
        )
   )::activity_feed_user
).*
FROM filtered_profiles fp
LEFT JOIN LATERAL (
    SELECT COALESCE(SUM(ds.amount), 0) AS send_score
    FROM distribution_shares ds
    WHERE ds.user_id = fp.id
    AND ds.distribution_id >= 6
) score ON TRUE
ORDER BY score.send_score DESC;
END;
$function$
;


revoke delete on table "temporal"."send_account_transfers" from "anon";

revoke insert on table "temporal"."send_account_transfers" from "anon";

revoke references on table "temporal"."send_account_transfers" from "anon";

revoke select on table "temporal"."send_account_transfers" from "anon";

revoke trigger on table "temporal"."send_account_transfers" from "anon";

revoke truncate on table "temporal"."send_account_transfers" from "anon";

revoke update on table "temporal"."send_account_transfers" from "anon";

revoke delete on table "temporal"."send_account_transfers" from "authenticated";

revoke insert on table "temporal"."send_account_transfers" from "authenticated";

revoke references on table "temporal"."send_account_transfers" from "authenticated";

revoke trigger on table "temporal"."send_account_transfers" from "authenticated";

revoke truncate on table "temporal"."send_account_transfers" from "authenticated";

revoke update on table "temporal"."send_account_transfers" from "authenticated";

revoke delete on table "temporal"."send_earn_deposits" from "anon";

revoke insert on table "temporal"."send_earn_deposits" from "anon";

revoke references on table "temporal"."send_earn_deposits" from "anon";

revoke select on table "temporal"."send_earn_deposits" from "anon";

revoke trigger on table "temporal"."send_earn_deposits" from "anon";

revoke truncate on table "temporal"."send_earn_deposits" from "anon";

revoke update on table "temporal"."send_earn_deposits" from "anon";

revoke delete on table "temporal"."send_earn_deposits" from "authenticated";

revoke insert on table "temporal"."send_earn_deposits" from "authenticated";

revoke references on table "temporal"."send_earn_deposits" from "authenticated";

revoke select on table "temporal"."send_earn_deposits" from "authenticated";

revoke trigger on table "temporal"."send_earn_deposits" from "authenticated";

revoke truncate on table "temporal"."send_earn_deposits" from "authenticated";

revoke update on table "temporal"."send_earn_deposits" from "authenticated";


set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.insert_challenge()
 RETURNS challenges
 LANGUAGE plpgsql
AS $function$
    #variable_conflict use_column
    declare
            _created timestamptz := current_timestamp;
            _expires timestamptz := _created + interval '15 minute';
            _new_challenge challenges;
    begin
        INSERT INTO "public"."challenges"
        (created_at, expires_at)
        VALUES (_created, _expires)
        RETURNING * into _new_challenge;

        return _new_challenge;
    end
$function$
;

CREATE OR REPLACE FUNCTION public.send_account_receives_insert_activity_trigger()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
declare
    _f_user_id uuid;
    _t_user_id uuid;
    _data      jsonb;
begin
    -- select send_account_receives.event_id into _f_user_id;
    select user_id into _f_user_id from send_accounts where address = concat('0x', encode(NEW.sender, 'hex'))::citext;
    select user_id into _t_user_id from send_accounts where address = concat('0x', encode(NEW.log_addr, 'hex'))::citext;

    _data := jsonb_build_object(
        'log_addr', NEW.log_addr,
        'sender', NEW.sender,
        -- cast value to text to avoid losing precision when converting to json when sending to clients
        'value', NEW.value::text,
        'tx_hash', NEW.tx_hash,
        'block_num', NEW.block_num::text,
        'tx_idx', NEW.tx_idx::text,
        'log_idx', NEW.log_idx::text
    );

    insert into activity (event_name, event_id, from_user_id, to_user_id, data, created_at)
    values ('send_account_receives',
            NEW.event_id,
            _f_user_id,
            _t_user_id,
            _data,
            to_timestamp(NEW.block_time) at time zone 'UTC')
    on conflict (event_name, event_id) do update set
        from_user_id = _f_user_id,
        to_user_id = _t_user_id,
        data = _data,
        created_at = to_timestamp(NEW.block_time) at time zone 'UTC';

    return NEW;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.send_account_signing_key_added_trigger_insert_activity()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
declare
    _f_user_id uuid;
    _data      jsonb;
begin
    select user_id from send_accounts where address = concat('0x', encode(NEW.account, 'hex'))::citext into _f_user_id;

    select json_build_object(
        'log_addr', NEW.log_addr,
        'account', NEW.account,
        'key_slot', NEW.key_slot,
        'key',json_agg(key order by abi_idx),
        'tx_hash', NEW.tx_hash,
        'block_num', NEW.block_num::text,
        'tx_idx', NEW.tx_idx::text,
        'log_idx', NEW.log_idx::text
    )
    from send_account_signing_key_added
    where src_name = NEW.src_name
      and ig_name = NEW.ig_name
      and block_num = NEW.block_num
      and tx_idx = NEW.tx_idx
      and log_idx = NEW.log_idx
    group by ig_name, src_name, block_num, tx_idx, log_idx
    into _data;

    insert into activity (event_name, event_id, from_user_id, to_user_id, data, created_at)
    values ('send_account_signing_key_added',
            NEW.event_id,
            _f_user_id,
            null,
            _data,
            to_timestamp(NEW.block_time) at time zone 'UTC')
    on conflict (event_name, event_id) do update set
        from_user_id = _f_user_id,
        to_user_id = null,
        data = _data,
        created_at = to_timestamp(NEW.block_time) at time zone 'UTC';

    return NEW;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.send_account_signing_key_removed_trigger_insert_activity()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
declare
    _f_user_id uuid;
    _data      jsonb;
begin
    select user_id from send_accounts where address = concat('0x', encode(NEW.account, 'hex'))::citext into _f_user_id;

    select json_build_object(
        'log_addr',
        NEW.log_addr,
        'account', NEW.account,
        'key_slot', NEW.key_slot,
        'key', json_agg(key order by abi_idx),
        'tx_hash', NEW.tx_hash,
        'block_num', NEW.block_num::text,
        'tx_idx', NEW.tx_idx::text,
        'log_idx', NEW.log_idx::text
    )
    from send_account_signing_key_removed
    where src_name = NEW.src_name
      and ig_name = NEW.ig_name
      and block_num = NEW.block_num
      and tx_idx = NEW.tx_idx
      and log_idx = NEW.log_idx
    group by ig_name, src_name, block_num, tx_idx, log_idx
    into _data;

    insert into activity (event_name, event_id, from_user_id, to_user_id, data, created_at)
    values ('send_account_signing_key_removed',
            NEW.event_id,
            _f_user_id,
            null,
            _data,
            to_timestamp(NEW.block_time) at time zone 'UTC')
    on conflict (event_name, event_id) do update set from_user_id = _f_user_id,
                                                     to_user_id   = null,
                                                     data         = _data,
                                                     created_at   = to_timestamp(NEW.block_time) at time zone 'UTC';

    return NEW;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.stop_change_send_id()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$ BEGIN

  IF OLD.send_id <> NEW.send_id THEN
    RAISE EXCEPTION 'send_id cannot be changed';
  END IF;
  RETURN NEW;
END;
$function$
;

