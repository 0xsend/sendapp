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


alter table "public"."tags" drop constraint "tags_name_check";

create table "public"."workflow_ids" (
    "array_agg" text[]
);


alter table "public"."profiles" add column "nickname" text;

CREATE INDEX idx_affiliate_stats_user_created ON public.affiliate_stats USING btree (user_id, created_at DESC);

CREATE INDEX idx_send_accounts_address_user ON public.send_accounts USING btree (address, user_id);

CREATE INDEX idx_sendtag_receipts ON public.sendtag_checkout_receipts USING btree (amount, reward);

CREATE INDEX idx_tags_status_created ON public.tags USING btree (status, created_at DESC) WHERE (status = 'confirmed'::tag_status);

alter table "public"."tags" add constraint "tags_name_check" CHECK (((length((name)::text) >= 1) AND (length((name)::text) <= 20) AND (name ~ '^[A-Za-z0-9_]+$'::citext))) not valid;

alter table "public"."tags" validate constraint "tags_name_check";

set check_function_bodies = off;

create or replace view "public"."dashboard_metrics" as  WITH time_window AS (
         SELECT EXTRACT(epoch FROM (now() - '24:00:00'::interval)) AS cutoff_time
        ), daily_transfers AS (
         SELECT t.f,
            t.t,
            t.log_addr,
            t.v,
            t.block_time
           FROM send_account_transfers t,
            time_window tw
          WHERE (t.block_time >= tw.cutoff_time)
        ), recent_transfers AS (
         SELECT t.f AS from_addr,
            t.t AS to_addr,
            t.log_addr,
            t.v AS amount,
            t.block_time,
                CASE
                    WHEN (t.log_addr = decode('833589fcd6edb6e08f4c7c32d4f71b54bda02913'::text, 'hex'::text)) THEN (t.v / 1000000.0)
                    ELSE (0)::numeric
                END AS usdc_amount,
                CASE
                    WHEN (t.log_addr = ANY (ARRAY[decode('3f14920c99beb920afa163031c4e47a3e03b3e4a'::text, 'hex'::text), decode('Eab49138BA2Ea6dd776220fE26b7b8E446638956'::text, 'hex'::text)])) THEN (t.v / 1000000000000000000.0)
                    ELSE (0)::numeric
                END AS send_amount
           FROM daily_transfers t
        ), account_mapping AS (
         SELECT rt.from_addr,
            rt.to_addr,
            rt.log_addr,
            rt.amount,
            rt.block_time,
            rt.usdc_amount,
            rt.send_amount,
            p_from.id AS from_profile_id,
            p_to.id AS to_profile_id
           FROM ((((recent_transfers rt
             LEFT JOIN send_accounts sa_from ON (((lower(concat('0x', encode(rt.from_addr, 'hex'::text))))::citext = sa_from.address)))
             LEFT JOIN profiles p_from ON ((p_from.id = sa_from.user_id)))
             LEFT JOIN send_accounts sa_to ON (((lower(concat('0x', encode(rt.to_addr, 'hex'::text))))::citext = sa_to.address)))
             LEFT JOIN profiles p_to ON ((p_to.id = sa_to.user_id)))
        ), ip_transfer_data AS (
         SELECT s.ip AS ip_address,
            r.ip AS to_ip,
                CASE
                    WHEN (am.log_addr = decode('833589fcd6edb6e08f4c7c32d4f71b54bda02913'::text, 'hex'::text)) THEN 'USDC'::text
                    WHEN (am.log_addr = ANY (ARRAY[decode('3f14920c99beb920afa163031c4e47a3e03b3e4a'::text, 'hex'::text), decode('Eab49138BA2Ea6dd776220fE26b7b8E446638956'::text, 'hex'::text)])) THEN 'SEND'::text
                    ELSE 'UNKNOWN'::text
                END AS currency,
            sum(
                CASE
                    WHEN (am.log_addr = decode('833589fcd6edb6e08f4c7c32d4f71b54bda02913'::text, 'hex'::text)) THEN am.usdc_amount
                    ELSE (0)::numeric
                END) AS amount,
            (count(*))::integer AS tx_count
           FROM ((account_mapping am
             LEFT JOIN LATERAL ( SELECT sessions.ip
                   FROM auth.sessions
                  WHERE ((sessions.user_id = ( SELECT profiles.id
                           FROM profiles
                          WHERE (profiles.id = ( SELECT send_accounts.user_id
                                   FROM send_accounts
                                  WHERE (send_accounts.address = (lower(concat('0x', encode(am.from_addr, 'hex'::text))))::citext))))) AND (sessions.created_at <= to_timestamp((am.block_time)::double precision)))
                  ORDER BY sessions.created_at DESC
                 LIMIT 1) s ON (true))
             LEFT JOIN LATERAL ( SELECT sessions.ip
                   FROM auth.sessions
                  WHERE ((sessions.user_id = ( SELECT profiles.id
                           FROM profiles
                          WHERE (profiles.id = ( SELECT send_accounts.user_id
                                   FROM send_accounts
                                  WHERE (send_accounts.address = (lower(concat('0x', encode(am.to_addr, 'hex'::text))))::citext))))) AND (sessions.created_at <= to_timestamp((am.block_time)::double precision)) AND (sessions.created_at >= to_timestamp(((am.block_time - (86400)::numeric))::double precision)))
                  ORDER BY sessions.created_at DESC
                 LIMIT 1) r ON (true))
          WHERE (s.ip IS NOT NULL)
          GROUP BY s.ip, r.ip, am.log_addr
        ), top_all_ips AS (
         SELECT ip_transfer_data.ip_address,
            json_agg(json_build_object('to_ip', ip_transfer_data.to_ip, 'currency', ip_transfer_data.currency, 'amount', ip_transfer_data.amount)) AS transfer_data,
            sum(ip_transfer_data.tx_count) AS tx_count
           FROM ip_transfer_data
          GROUP BY ip_transfer_data.ip_address
          ORDER BY (sum(ip_transfer_data.tx_count)) DESC
        )
 SELECT ( SELECT (count(DISTINCT send_account_credentials.account_id))::integer AS count
           FROM send_account_credentials) AS passkeys,
    ( SELECT (count(*))::integer AS count
           FROM tags
          WHERE (tags.status = 'confirmed'::tag_status)) AS sendtags,
    ( SELECT (count(DISTINCT account_mapping.from_profile_id))::integer AS count
           FROM account_mapping
          WHERE (account_mapping.from_profile_id IS NOT NULL)) AS daily_active_senders,
    ( SELECT (count(DISTINCT account_mapping.to_profile_id))::integer AS count
           FROM account_mapping
          WHERE (account_mapping.to_profile_id IS NOT NULL)) AS daily_active_receivers,
    ( SELECT (count(DISTINCT COALESCE(am.from_profile_id, am.to_profile_id)))::integer AS count
           FROM account_mapping am) AS daily_active_transfers,
    ( SELECT (count(*))::integer AS count
           FROM daily_transfers) AS total_transactions,
    ( SELECT COALESCE(sum(
                CASE
                    WHEN (daily_transfers.log_addr = decode('833589fcd6edb6e08f4c7c32d4f71b54bda02913'::text, 'hex'::text)) THEN (COALESCE(daily_transfers.v, (0)::numeric) / 1000000.0)
                    ELSE (0)::numeric
                END), (0)::numeric) AS "coalesce"
           FROM daily_transfers) AS usdc_volume,
    ( SELECT COALESCE(sum(
                CASE
                    WHEN (daily_transfers.log_addr = ANY (ARRAY[decode('3f14920c99beb920afa163031c4e47a3e03b3e4a'::text, 'hex'::text), decode('Eab49138BA2Ea6dd776220fE26b7b8E446638956'::text, 'hex'::text)])) THEN (COALESCE(daily_transfers.v, (0)::numeric) / 1000000000000000000.0)
                    ELSE (0)::numeric
                END), (0)::numeric) AS "coalesce"
           FROM daily_transfers) AS send_volume,
    ( SELECT (COALESCE((sum(sendtag_checkout_receipts.amount) / 1000000.0), (0)::numeric) - COALESCE((sum(sendtag_checkout_receipts.reward) / 1000000.0), (0)::numeric))
           FROM sendtag_checkout_receipts) AS sendtag_revenue,
    ( SELECT COALESCE((sum(sendtag_checkout_receipts.reward) / 1000000.0), (0)::numeric) AS "coalesce"
           FROM sendtag_checkout_receipts) AS sendtag_referral_payouts,
    ( SELECT json_agg(row_to_json(t.*)) AS json_agg
           FROM ( SELECT tags.name
                   FROM tags
                  WHERE (tags.status = 'confirmed'::tag_status)
                  ORDER BY tags.created_at DESC
                 LIMIT 10) t) AS new_sendtags,
    ( SELECT json_agg(row_to_json(t.*)) AS json_agg
           FROM ( WITH new_affiliates AS (
                         SELECT a.user_id,
                            a.created_at AS affiliate_created_at,
                            count(r.referred_id) AS referral_count
                           FROM (affiliate_stats a
                             LEFT JOIN referrals r ON ((r.referrer_id = a.user_id)))
                          GROUP BY a.user_id, a.created_at
                         HAVING (count(r.referred_id) > 0)
                        ), recent_transfers AS (
                         SELECT (concat('0x', encode(st.t, 'hex'::text)))::citext AS receiver_address,
                            st.v AS amount,
                            st.block_time
                           FROM send_token_transfers st
                          WHERE (st.block_time >= EXTRACT(epoch FROM (now() - '30 days'::interval)))
                        )
                 SELECT t_1.name
                   FROM (((new_affiliates na
                     JOIN send_accounts sa ON ((sa.user_id = na.user_id)))
                     LEFT JOIN recent_transfers rt ON ((rt.receiver_address = sa.address)))
                     JOIN tags t_1 ON (((t_1.user_id = na.user_id) AND (t_1.status = 'confirmed'::tag_status))))
                  GROUP BY na.user_id, na.affiliate_created_at, na.referral_count, t_1.name
                 HAVING (COALESCE(sum(rt.amount), (0)::numeric) > (0)::numeric)
                  ORDER BY na.affiliate_created_at DESC
                 LIMIT 10) t) AS new_affiliates,
    ( SELECT json_agg(row_to_json(tai.*)) AS json_agg
           FROM top_all_ips tai) AS top_all_ips;


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

    -- Count how many interactions the current user has with each counterparty
    counterparty_counts AS (
        SELECT counterparty,
               COUNT(*) AS interaction_count
        FROM user_transfers
        GROUP BY counterparty
    )

SELECT (counterparty).*
FROM counterparty_counts
ORDER BY interaction_count DESC -- Order the result by most frequent counterparties
    LIMIT 10; -- Return only the 10 most frequent counterparties

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
        (
            select id
            from distributions
            where qualification_start <= now()
                and qualification_end >= now()
            order by qualification_start desc
            limit 1
        ), NEW.user_id, 'tag_registration'::public.verification_type, jsonb_build_object('tag', NEW.name)
    );

end if;

return NEW;

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
begin
    delete
    from activity
    where event_id = OLD.event_id
        and event_name = 'send_account_transfers';
    return OLD;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.send_account_transfers_trigger_insert_activity()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
declare
    _f_user_id uuid;
    _t_user_id uuid;
    _data jsonb;
begin
    -- select send app info for from address
    select user_id into _f_user_id from send_accounts where address = concat('0x', encode(NEW.f, 'hex'))::citext;
    select user_id into _t_user_id from send_accounts where address = concat('0x', encode(NEW.t, 'hex'))::citext;

    -- cast v to text to avoid losing precision when converting to json when sending to clients
    _data := json_build_object(
        'log_addr', NEW.log_addr,
        'f', NEW.f,
        't', NEW.t,
        'v', NEW.v::text,
        'tx_hash', NEW.tx_hash,
        'block_num', NEW.block_num::text,
        'tx_idx', NEW.tx_idx::text,
        'log_idx', NEW.log_idx::text
    );

    insert into activity (event_name, event_id, from_user_id, to_user_id, data, created_at)
    values ('send_account_transfers',
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

grant delete on table "public"."workflow_ids" to "anon";

grant insert on table "public"."workflow_ids" to "anon";

grant references on table "public"."workflow_ids" to "anon";

grant select on table "public"."workflow_ids" to "anon";

grant trigger on table "public"."workflow_ids" to "anon";

grant truncate on table "public"."workflow_ids" to "anon";

grant update on table "public"."workflow_ids" to "anon";

grant delete on table "public"."workflow_ids" to "authenticated";

grant insert on table "public"."workflow_ids" to "authenticated";

grant references on table "public"."workflow_ids" to "authenticated";

grant select on table "public"."workflow_ids" to "authenticated";

grant trigger on table "public"."workflow_ids" to "authenticated";

grant truncate on table "public"."workflow_ids" to "authenticated";

grant update on table "public"."workflow_ids" to "authenticated";

grant delete on table "public"."workflow_ids" to "service_role";

grant insert on table "public"."workflow_ids" to "service_role";

grant references on table "public"."workflow_ids" to "service_role";

grant select on table "public"."workflow_ids" to "service_role";

grant trigger on table "public"."workflow_ids" to "service_role";

grant truncate on table "public"."workflow_ids" to "service_role";

grant update on table "public"."workflow_ids" to "service_role";


