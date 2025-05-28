alter table "public"."tags" drop constraint "tags_name_check";

alter table "public"."tags" add constraint "tags_name_check" CHECK (((length((name)::text) >= 1) AND (length((name)::text) <= 20) AND (name ~ '^[A-Za-z0-9_]+$'::citext))) not valid;

alter table "public"."tags" validate constraint "tags_name_check";

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


set check_function_bodies = off;

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
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
RETURN QUERY


    WITH user_transfers AS (
    SELECT *,
        -- Determine the counterparty: if the current user is the sender, use the recipient, and vice versa
        CASE
            WHEN (from_user).id = (select auth.uid()) THEN to_user
            ELSE from_user
        END AS counterparty
    FROM activity_feed
    -- Only include rows where both from_user and to_user have a send_id (indicates a transfer between users)
    WHERE created_at >= NOW() - INTERVAL '60 days' -- only last 30 days
      AND (from_user).send_id IS NOT NULL
      AND (to_user).send_id IS NOT NULL
      AND ((from_user).id = (select auth.uid()) OR (to_user).id = (select auth.uid())) -- only tx with user involved
),

counterparty_counts AS (
    SELECT counterparty,
           COUNT(*) AS interaction_count
    FROM user_transfers
    WHERE (counterparty).id IS NULL -- ignore if users were sending to their selves
    GROUP BY counterparty
    ORDER BY interaction_count DESC
    LIMIT 30 -- top 30 most frequent users
),

with_user_id AS (
  SELECT *, (SELECT id FROM profiles WHERE send_id = (counterparty).send_id) AS user_id
  FROM counterparty_counts
)

SELECT (counterparty).* -- only fields from activity feed
FROM with_user_id
    LEFT JOIN LATERAL ( -- calculate send score for top 30 frequent users
        SELECT COALESCE(SUM(ds.amount), 0) AS send_score
        FROM distribution_shares ds
        WHERE ds.user_id = with_user_id.user_id
        AND ds.distribution_id >= 6
    ) score ON TRUE
ORDER BY score.send_score DESC
LIMIT 10; -- return top 10 send score users

END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_pending_jackpot_tickets_purchased()
 RETURNS numeric
 LANGUAGE sql
AS $function$
WITH last_jackpot AS (
    -- Retrieve the maximum block number from the sendpot_jackpot_runs table.
  -- This block number represents the end of the last completed jackpot.
  -- If no jackpot runs exist, use 0 as the default value.
  SELECT COALESCE(MAX(block_num), 0) AS last_block
  FROM public.sendpot_jackpot_runs
)
SELECT COALESCE(SUM(tickets_purchased_total_bps), 0) AS total_tickets
FROM public.sendpot_user_ticket_purchases
WHERE block_num >= (SELECT last_block FROM last_jackpot);
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
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
RETURN QUERY
SELECT (
   (
    NULL,
    p.name,
    p.avatar_url,
    p.send_id,
    (
        SELECT ARRAY_AGG(name)
        FROM tags
        WHERE user_id = p.id
          AND status = 'confirmed'
    )
       )::activity_feed_user
).*
FROM profiles p
WHERE is_public = TRUE
  AND p.birthday IS NOT NULL
  AND p.avatar_url IS NOT NULL
  AND EXTRACT(MONTH FROM p.birthday) = EXTRACT(MONTH FROM CURRENT_DATE)
  AND EXTRACT(DAY FROM p.birthday) = EXTRACT(DAY FROM CURRENT_DATE);
END;
$function$
;
