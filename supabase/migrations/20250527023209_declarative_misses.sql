set check_function_bodies = off;

CREATE OR REPLACE FUNCTION private.aaa_filter_send_earn_deposit_with_no_send_account_created()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
begin
  if exists ( select 1 from send_account_created where account = new.owner )
  then
    return new;
  else
    return null;
  end if;
end;
$function$
;

CREATE OR REPLACE FUNCTION private.filter_send_account_transfers_with_no_send_account_created()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
begin
  if exists ( select 1 from send_account_created where account = new.f )
    or exists ( select 1 from send_account_created where account = new.t )
  then
    return new;
  else
    return null;
  end if;
end;
$function$
;

CREATE OR REPLACE FUNCTION private.filter_send_earn_withdraw_with_no_send_account_created()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
begin
  if exists ( select 1 from send_account_created where account = new.owner )
  then
    return new;
  else
    return null;
  end if;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.xd()
 RETURNS SETOF activity_feed_user
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
RETURN QUERY

    -- Step 1: Filter relevant transfers and determine the counterparty
    WITH user_transfers AS (
        SELECT *,
            -- Determine the counterparty: if the current user is the sender, use the recipient, and vice versa
            CASE
                WHEN (from_user).id = (select auth.uid()) THEN to_user
                ELSE from_user
            END AS counterparty
        FROM activity_feed
        -- Only include rows where both from_user and to_user have a send_id (indicates a transfer between users)
        WHERE (from_user).send_id IS NOT NULL
          AND (to_user).send_id IS NOT NULL
          AND ((from_user).id = (select auth.uid()) OR (to_user).id = (select auth.uid()))
    ),

    -- Count how many interactions the current user has with each counterparty
    numbered AS (
        SELECT *,
            ROW_NUMBER() OVER (
                PARTITION BY (counterparty).send_id  -- Group by each unique counterparty
                ORDER BY created_at DESC             -- Order by most recent transfer first
            ) AS occurrence_counter
        FROM user_transfers
    ),

    with_counterparty_id AS (
        SELECT *,
            (
                SELECT id FROM profiles p WHERE p.send_id = (counterparty).send_id
            ) AS counterparty_id
        FROM numbered
        WHERE occurrence_counter = 1
    ),

    ranked AS (
        SELECT *,
            COALESCE((
             SELECT
                 SUM(amount)
             FROM distribution_shares ds
             WHERE
                 ds.user_id = counterparty_id
               AND distribution_id >= 6), 0) AS send_score
        FROM with_counterparty_id
    )

-- Select the top 10 counterparties by interaction count
-- SELECT (counterparty).*
SELECT (counterparty).*
FROM ranked
WHERE (counterparty).id IS NULL
ORDER BY send_score DESC;
--     LIMIT 10; -- Return only the 10 most frequent counterparties

END;
$function$
;

CREATE OR REPLACE FUNCTION public.chain_addresses_after_insert()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$ BEGIN -- Ensure users can only insert or update their own tags
    IF NEW.user_id <> auth.uid() THEN RAISE EXCEPTION 'Users can only create addresses for themselves';

END IF;

IF (
    SELECT COUNT(*)
    FROM public.chain_addresses
    WHERE user_id = NEW.user_id
        AND TG_OP = 'INSERT'
) > 1 THEN RAISE EXCEPTION 'User can have at most 1 address';

END IF;

RETURN NEW;

END;

$function$
;

CREATE OR REPLACE FUNCTION public.create_send_account(send_account send_accounts, webauthn_credential webauthn_credentials, key_slot integer)
 RETURNS json
 LANGUAGE plpgsql
AS $function$
declare _send_account send_accounts;

_webauthn_credential webauthn_credentials;

begin --

insert into webauthn_credentials (
    name,
    display_name,
    raw_credential_id,
    public_key,
    sign_count,
    attestation_object,
    key_type
  )
values (
    webauthn_credential.name,
    webauthn_credential.display_name,
    webauthn_credential.raw_credential_id,
    webauthn_credential.public_key,
    webauthn_credential.sign_count,
    webauthn_credential.attestation_object,
    webauthn_credential.key_type
  )
returning * into _webauthn_credential;

insert into send_accounts (address, chain_id, init_code)
values (
    send_account.address,
    send_account.chain_id,
    send_account.init_code
  ) on conflict (address, chain_id) do
update
set init_code = excluded.init_code
returning * into _send_account;

insert into send_account_credentials (account_id, credential_id, key_slot)
values (
    _send_account.id,
    _webauthn_credential.id,
    $3
  );

return json_build_object(
  'send_account',
  _send_account,
  'webauthn_credential',
  _webauthn_credential
);

end;

$function$
;

CREATE OR REPLACE FUNCTION public.favourite_senders()
 RETURNS SETOF activity_feed_user
 LANGUAGE sql
 STABLE
AS $function$
    WITH recent_transfers AS (
        SELECT "from_user" AS user, COUNT(*) AS activity_count
        FROM activity_feed
        WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
        AND event_name = 'send_account_transfers'
        AND (to_user).id = auth.uid()
        AND from_user IS NOT NULL
        GROUP BY from_user
        HAVING COUNT(*) >= 3
        ORDER BY activity_count DESC
        LIMIT 5
    )
    SELECT DISTINCT (recent_transfers.user).*
    FROM recent_transfers
$function$
;

CREATE OR REPLACE FUNCTION public.get_friends()
 RETURNS TABLE(avatar_url text, x_username text, birthday date, tag citext, created_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    RETURN QUERY
        WITH ordered_referrals AS(
            SELECT
                DISTINCT ON (r.referred_id)
                p.avatar_url,
                CASE WHEN p.is_public THEN p.x_username ELSE NULL END AS x_username,
                CASE WHEN p.is_public THEN p.birthday ELSE NULL END AS birthday,
                t.name AS tag,
                t.created_at,
                COALESCE((
                             SELECT
                                 SUM(amount)
                             FROM distribution_shares ds
                             WHERE
                                 ds.user_id = r.referred_id
                               AND distribution_id >= 6), 0) AS send_score
            FROM
                referrals r
                    LEFT JOIN profiles p ON p.id = r.referred_id
                    LEFT JOIN tags t ON t.user_id = r.referred_id
                        AND t.status = 'confirmed'
            WHERE
                r.referrer_id = auth.uid())
        SELECT
            o.avatar_url,
            o.x_username,
            o.birthday,
            o.tag,
            o.created_at
        FROM
            ordered_referrals o
        ORDER BY
            send_score DESC;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_pending_jackpot_tickets_purchased()
 RETURNS numeric
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    pending_tickets_sum numeric;
BEGIN
    WITH recent_run AS (
        -- Get the most recent jackpot run
        SELECT block_num
        FROM public.sendpot_jackpot_runs
        ORDER BY block_num DESC
        LIMIT 1
    )
    SELECT COALESCE(SUM(tickets_purchased_total_bps), 0)
    INTO pending_tickets_sum
    FROM public.sendpot_user_ticket_purchases
    WHERE block_num > COALESCE((SELECT block_num FROM recent_run), 0);

    RETURN pending_tickets_sum;
END;
$function$
;

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

CREATE OR REPLACE FUNCTION public.insert_verification_create_passkey()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  curr_distribution_id bigint;
BEGIN
  -- Get the current distribution id
  SELECT
    id INTO curr_distribution_id
  FROM
    distributions
  WHERE
    qualification_start <= now()
    AND qualification_end >= now()
  ORDER BY
    qualification_start DESC
  LIMIT 1;
  -- Insert verification for create_passkey
  IF curr_distribution_id IS NOT NULL AND NOT EXISTS (
    SELECT
      1
    FROM
      public.distribution_verifications
    WHERE
      user_id = NEW.user_id AND distribution_id = curr_distribution_id AND type = 'create_passkey'::public.verification_type) THEN
    INSERT INTO public.distribution_verifications(
      distribution_id,
      user_id,
      type,
      metadata,
      created_at)
    VALUES(
      curr_distribution_id,
      NEW.user_id,
      'create_passkey'::public.verification_type,
      jsonb_build_object('passkey_created', TRUE),
      NOW());
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.insert_verification_tag_registration()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare curr_distribution_id bigint;

begin --
    -- check if tag is confirmed
if NEW.status <> 'confirmed'::public.tag_status then return NEW;

end if;

curr_distribution_id := (
    select id
    from distributions
    where qualification_start <= now()
        and qualification_end >= now()
    order by qualification_start desc
    limit 1
);

if curr_distribution_id is not null
and not exists (
    select 1
    from public.distribution_verifications
    where user_id = NEW.user_id
        and metadata->>'tag' = NEW.name
        and type = 'tag_registration'::public.verification_type
) then -- insert new verification
insert into public.distribution_verifications (distribution_id, user_id, type, metadata)
values (
    curr_distribution_id,
    NEW.user_id,
    'tag_registration'::public.verification_type,
    jsonb_build_object('tag', NEW.name)
);

end if;

return NEW;

end;

$function$
;

CREATE OR REPLACE FUNCTION public.profile_lookup(lookup_type lookup_type_enum, identifier text)
 RETURNS TABLE(id uuid, avatar_url text, name text, about text, refcode text, x_username text, birthday date, tag citext, address citext, chain_id integer, is_public boolean, sendid integer, all_tags text[])
 LANGUAGE plpgsql
 IMMUTABLE SECURITY DEFINER
AS $function$
begin
    if identifier is null or identifier = '' then raise exception 'identifier cannot be null or empty'; end if;
    if lookup_type is null then raise exception 'lookup_type cannot be null'; end if;
return query --
select case when p.id = ( select auth.uid() ) then p.id end              as id,
       p.avatar_url::text                                                as avatar_url,
        p.name::text                                                      as name,
        p.about::text                                                     as about,
        p.referral_code                                                   as refcode,
       CASE WHEN p.is_public THEN p.x_username ELSE NULL END AS x_username,
       CASE WHEN p.is_public THEN p.birthday ELSE NULL END AS birthday,
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
    (lookup_type = 'tag' and t.name = identifier::citext) or
    (lookup_type = 'refcode' and p.referral_code = identifier) or
    (lookup_type = 'address' and sa.address = identifier) or
    (p.is_public and lookup_type = 'phone' and a.phone::text = identifier))
  and (p.is_public
   or ( select auth.uid() ) is not null
   or current_setting('role')::text = 'service_role')
    limit 1;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.recent_senders()
 RETURNS SETOF activity_feed_user
 LANGUAGE sql
 STABLE
AS $function$
    WITH recent_transfers AS (
        SELECT "from_user" AS user, MAX(created_at) AS last_transfer_date
        FROM activity_feed
        WHERE created_at >= CURRENT_DATE - INTERVAL '60 days'
        AND event_name = 'send_account_transfers'
        AND (to_user).id = auth.uid()
        AND from_user IS NOT NULL
        GROUP BY from_user
        ORDER BY last_transfer_date DESC
        LIMIT 10
    )
    SELECT DISTINCT (recent_transfers.user).*
    FROM recent_transfers
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

CREATE OR REPLACE FUNCTION public.send_account_transfers_trigger_delete_activity()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    DELETE FROM activity
    WHERE event_id = CONCAT(old.ig_name, '/', old.src_name, '/', old.block_num, '/', old.tx_idx, '/', old.log_idx)
        and event_name = 'send_account_transfers';
    RETURN OLD;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.send_account_transfers_trigger_insert_activity()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    from_user_id uuid;
    to_user_id uuid;
    new_created_at timestamp with time zone;
BEGIN
    SELECT user_id INTO from_user_id FROM send_accounts WHERE address = concat('0x', encode(new.f, 'hex'))::citext;
    SELECT user_id INTO to_user_id FROM send_accounts WHERE address = concat('0x', encode(new.t, 'hex'))::citext;
    -- use created_at if tags has confirmed_at, otherwise use block timestamp
    new_created_at = to_timestamp(new.block_time);
    -- both send accounts have user_id
    IF from_user_id IS NOT NULL AND to_user_id IS NOT NULL THEN
        -- insert activity for both
        INSERT INTO activity (event_name, event_id, from_user_id, to_user_id, data, created_at)
        VALUES
            ('send_account_transfers', new.event_id, from_user_id, to_user_id, to_jsonb(new), new_created_at),
            ('send_account_transfers', new.event_id, to_user_id, from_user_id, to_jsonb(new), new_created_at);
    ELSIF from_user_id IS NOT NULL THEN
        -- insert for send
        INSERT INTO activity (event_name, event_id, from_user_id, to_user_id, data, created_at)
        VALUES ('send_account_transfers', new.event_id, from_user_id, NULL, to_jsonb(new), new_created_at);
    ELSIF to_user_id IS NOT NULL THEN
        -- insert for receive
        INSERT INTO activity (event_name, event_id, from_user_id, to_user_id, data, created_at)
        VALUES ('send_account_transfers', new.event_id, NULL, to_user_id, to_jsonb(new), new_created_at);
    END IF;
    RETURN NEW;
END;
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

RETURN NEW;

END;

$function$
;

CREATE OR REPLACE FUNCTION public.today_birthday_senders()
 RETURNS SETOF activity_feed_user
 LANGUAGE sql
 STABLE
AS $function$
   WITH unique_senders AS (
       SELECT DISTINCT from_user_id
       FROM activity
       WHERE to_user_id = auth.uid()
         AND event_name = 'send_account_transfers'
         AND from_user_id IS NOT NULL
   )
   SELECT (
       profiles.id,
       profiles.name,
       profiles.avatar_url,
       profiles.send_id,
       ARRAY(
           SELECT tags.name
           FROM public.tags
           WHERE tags.user_id = profiles.id
             AND tags.status = 'confirmed'
       )
   )::activity_feed_user
   FROM profiles
   INNER JOIN unique_senders ON profiles.id = unique_senders.from_user_id
   WHERE EXTRACT(MONTH FROM profiles.birthday) = EXTRACT(MONTH FROM CURRENT_DATE)
     AND EXTRACT(DAY FROM profiles.birthday) = EXTRACT(DAY FROM CURRENT_DATE)
$function$
;

CREATE OR REPLACE FUNCTION public.update_transfer_activity_before_insert()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    tmp_data jsonb;
    note_id uuid;
    note_text text;
    temporal_status temporal.transfer_status;
BEGIN
    -- Check if the event name contains '_transfers'
    IF position('_transfers' in NEW.event_name) > 0 THEN
        -- Query the temporal.send_account_transfers table
        SELECT note, status INTO note_id, temporal_status
        FROM temporal.send_account_transfers
        WHERE id::text = NEW.event_id AND status = 'confirmed';

        -- Check if a confirmed record was found
        IF note_id IS NOT NULL THEN
            -- Parse the JSON data to get the note_text
            note_text := NEW.data ->> 'note';

            -- Create the temporary JSON object
            tmp_data := jsonb_build_object('note_id', note_id, 'note', note_text);

            -- Merge tmp_data into NEW.data
            NEW.data := NEW.data || tmp_data;
        END IF;
    END IF;

    -- Return the modified row
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION temporal.add_note_activity_temporal_transfer_before_confirmed()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    note_text text;
    activity_sender_user_id uuid;
    activity_receiver_user_id uuid;
BEGIN
    -- Only proceed if status is changing to 'confirmed' and data has a note
    IF NEW.status = 'confirmed' AND OLD.status != 'confirmed' AND NEW.data ? 'note' THEN
        note_text := NEW.data->>'note';

        -- Only proceed if note is not empty
        IF note_text IS NOT NULL AND length(trim(note_text)) > 0 THEN
            -- Get sender and receiver user IDs from the activity table
            SELECT from_user_id, to_user_id INTO activity_sender_user_id, activity_receiver_user_id
            FROM activity
            WHERE event_id = NEW.send_account_transfers_activity_event_id
            AND event_name = 'temporal_send_account_transfers';

            -- Insert note activity with the same timestamp as the transfer
            INSERT INTO activity (
                event_name,
                event_id,
                from_user_id,
                to_user_id,
                data,
                created_at
            )
            VALUES (
                'temporal_send_account_transfers_note',
                NEW.send_account_transfers_activity_event_id || '/note',
                activity_sender_user_id,
                activity_receiver_user_id,
                jsonb_build_object(
                    'note', note_text,
                    'transfer_event_id', NEW.send_account_transfers_activity_event_id
                ),
                (SELECT created_at FROM activity WHERE event_id = NEW.send_account_transfers_activity_event_id AND event_name = 'temporal_send_account_transfers')
            );
        END IF;
    END IF;

    RETURN NEW;
END;
$function$
;


