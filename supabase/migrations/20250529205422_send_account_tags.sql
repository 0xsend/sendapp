create sequence "public"."send_account_tags_id_seq";

create sequence "public"."tags_id_seq";

drop policy "delete_policy" on "public"."tags";

drop policy "insert_policy" on "public"."tags";

drop policy "select_policy" on "public"."tags";

drop policy "update_policy" on "public"."tags";

alter table "public"."tag_receipts" drop constraint "tag_receipts_tag_name_fkey";

alter table "public"."tags" drop constraint "tags_pkey";

drop index if exists "public"."tags_pkey";

ALTER TYPE "public"."tag_status" ADD VALUE 'available' AFTER 'confirmed';

create table "public"."historical_tag_associations" (
    "id" uuid not null default gen_random_uuid(),
    "tag_name" citext not null,
    "tag_id" bigint not null,
    "user_id" uuid not null,
    "status" tag_status not null,
    "captured_at" timestamp with time zone not null default now()
);


alter table "public"."historical_tag_associations" enable row level security;

create table "public"."send_account_tags" (
    "id" integer not null default nextval('send_account_tags_id_seq'::regclass),
    "send_account_id" uuid not null,
    "tag_id" bigint not null,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "public"."send_account_tags" enable row level security;

alter table "public"."send_accounts" add column "main_tag_id" bigint;

alter table "public"."tag_receipts" add column "tag_id" bigint not null;

alter table "public"."tags" add column "id" bigint not null default nextval('tags_id_seq'::regclass);

alter table "public"."tags" add column "updated_at" timestamp with time zone not null default now();

alter table "public"."tags" alter column "user_id" drop default;

alter table "public"."tags" alter column "user_id" drop not null;

alter sequence "public"."send_account_tags_id_seq" owned by "public"."send_account_tags"."id";

CREATE UNIQUE INDEX historical_tag_associations_pkey ON public.historical_tag_associations USING btree (id);

CREATE INDEX idx_historical_tag_associations_tag_id ON public.historical_tag_associations USING btree (tag_id);

CREATE INDEX idx_historical_tag_associations_tag_name ON public.historical_tag_associations USING btree (tag_name);

CREATE INDEX idx_historical_tag_associations_user_id ON public.historical_tag_associations USING btree (user_id);

CREATE INDEX idx_send_account_tags_send_account_id ON public.send_account_tags USING btree (send_account_id);

CREATE INDEX idx_send_account_tags_tag_id ON public.send_account_tags USING btree (tag_id);

CREATE UNIQUE INDEX idx_send_account_tags_unique ON public.send_account_tags USING btree (send_account_id, tag_id);

CREATE INDEX idx_send_accounts_main_tag_id ON public.send_accounts USING btree (main_tag_id);

CREATE UNIQUE INDEX send_account_tags_pkey ON public.send_account_tags USING btree (id);

CREATE UNIQUE INDEX tags_name_unique ON public.tags USING btree (name);

CREATE UNIQUE INDEX tags_pkey ON public.tags USING btree (id);

alter table "public"."historical_tag_associations" add constraint "historical_tag_associations_pkey" PRIMARY KEY using index "historical_tag_associations_pkey";

alter table "public"."send_account_tags" add constraint "send_account_tags_pkey" PRIMARY KEY using index "send_account_tags_pkey";

alter table "public"."tags" add constraint "tags_pkey" PRIMARY KEY using index "tags_pkey";

alter table "public"."historical_tag_associations" add constraint "historical_tag_associations_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) not valid;

alter table "public"."historical_tag_associations" validate constraint "historical_tag_associations_user_id_fkey";

alter table "public"."send_account_tags" add constraint "send_account_tags_send_account_id_fkey" FOREIGN KEY (send_account_id) REFERENCES send_accounts(id) ON DELETE CASCADE not valid;

alter table "public"."send_account_tags" validate constraint "send_account_tags_send_account_id_fkey";

alter table "public"."send_account_tags" add constraint "send_account_tags_tag_id_fkey" FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE not valid;

alter table "public"."send_account_tags" validate constraint "send_account_tags_tag_id_fkey";

alter table "public"."send_accounts" add constraint "send_accounts_main_tag_id_fkey" FOREIGN KEY (main_tag_id) REFERENCES tags(id) ON DELETE SET NULL not valid;

alter table "public"."send_accounts" validate constraint "send_accounts_main_tag_id_fkey";

alter table "public"."tag_receipts" add constraint "tag_receipts_tag_id_fkey" FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE not valid;

alter table "public"."tag_receipts" validate constraint "tag_receipts_tag_id_fkey";

alter table "public"."tags" add constraint "tags_name_unique" UNIQUE using index "tags_name_unique";

drop function if exists "public"."confirm_tags"(tag_names citext[], event_id text, referral_code_input text);

drop function if exists "public"."confirm_tags"(tag_names citext[], send_account_id uuid, _event_id text, _referral_code text);

CREATE OR REPLACE FUNCTION public.confirm_tags(tag_names citext[], send_account_id uuid, _event_id text, _referral_code text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    _sender bytea;
    _user_id uuid;
    _send_account_id ALIAS FOR send_account_id;
    referrer_id uuid;
BEGIN
    -- Get the sender from the receipt
    SELECT
        scr.sender,
        sa.user_id INTO _sender,
        _user_id
    FROM
        sendtag_checkout_receipts scr
        JOIN send_accounts sa ON decode(substring(sa.address, 3), 'hex') = scr.sender
    WHERE
        scr.event_id = _event_id;
    -- Verify the sender matches the send_account
    IF NOT EXISTS (
        SELECT
            1
        FROM
            send_accounts sa
        WHERE
            id = _send_account_id
            AND decode(substring(sa.address, 3), 'hex') = _sender) THEN
    RAISE EXCEPTION 'Receipt event ID does not match the sender';
END IF;
    -- Create receipt
    INSERT INTO receipts(event_id, user_id)
        VALUES (_event_id, _user_id);
    -- First create send_account_tags entries
    INSERT INTO send_account_tags(send_account_id, tag_id)
    SELECT DISTINCT
        _send_account_id,
        t.id
    FROM
        tags t
    WHERE
        t.name = ANY (tag_names)
        AND t.status = 'pending'
        AND NOT EXISTS (
            SELECT
                1
            FROM
                send_account_tags sat
            WHERE
                sat.send_account_id = _send_account_id
                AND sat.tag_id = t.id);
    -- Then update tags status which will trigger the verification
    UPDATE
        tags
    SET
        status = 'confirmed'
    WHERE
        name = ANY (tag_names)
        AND status = 'pending';
    -- Associate tags with event
    INSERT INTO tag_receipts(tag_name, tag_id, event_id)
    SELECT
        t.name,
        t.id,
        _event_id
    FROM
        tags t
    WHERE
        t.name = ANY (tag_names)
        AND t.status = 'confirmed';
    -- Handle referral
    IF _referral_code IS NOT NULL AND _referral_code <> '' THEN
        SELECT
            id INTO referrer_id
        FROM
            public.profiles
        WHERE
            referral_code = _referral_code;
        IF referrer_id IS NOT NULL AND referrer_id != _user_id THEN
            -- Check if a referral already exists for this user
            IF NOT EXISTS (
                SELECT
                    1
                FROM
                    public.referrals
                WHERE
                    referred_id = _user_id) THEN
            -- Insert only one referral for the user
            INSERT INTO referrals(referrer_id, referred_id)
            VALUES (referrer_id, _user_id);
        END IF;
    END IF;
END IF;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.create_tag(tag_name citext, send_account_id uuid)
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    _tag_id bigint;
    _original_error_code text;
    _original_error_message text;
BEGIN
    BEGIN
        -- Verify user owns the send_account
        IF NOT EXISTS (
            SELECT
                1
            FROM
                send_accounts
            WHERE
                id = send_account_id
                AND user_id = auth.uid()) THEN
        RAISE EXCEPTION 'User does not own this send_account';
    END IF;
    -- Check tag count before insert
    IF (
        SELECT
            COUNT(*)
        FROM
            tags t
            JOIN send_account_tags sat ON sat.tag_id = t.id
            JOIN send_accounts sa ON sa.id = sat.send_account_id
        WHERE
            sa.user_id = auth.uid()) >= 5 THEN
        RAISE EXCEPTION 'User can have at most 5 tags';
    END IF;
    -- Check if tag exists and is available
    WITH available_tag AS (
        UPDATE
            tags
        SET
            status = 'pending',
            user_id = auth.uid(),
            updated_at = NOW()
        WHERE
            name = tag_name
            AND status = 'available'
        RETURNING
            id
),
new_tag AS (
INSERT INTO tags(name, status, user_id)
    SELECT
        tag_name,
        'pending',
        auth.uid()
    WHERE
        NOT EXISTS (
            SELECT
                1
            FROM
                available_tag)
        RETURNING
            id)
    INSERT INTO send_account_tags(send_account_id, tag_id)
    SELECT
        send_account_id,
        id
    FROM (
        SELECT
            id
        FROM
            available_tag
        UNION ALL
        SELECT
            id
        FROM
            new_tag) tags
RETURNING
    tag_id INTO _tag_id;
    EXCEPTION
        WHEN OTHERS THEN
            GET STACKED DIAGNOSTICS
                _original_error_code = RETURNED_SQLSTATE,
                _original_error_message = MESSAGE_TEXT;
            RAISE EXCEPTION USING
                ERRCODE = _original_error_code,
                MESSAGE = _original_error_message;
    END;
    RETURN _tag_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_send_account_tags_deleted()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    -- Update tag status and clear user_id if no other send_account_tags exist
    UPDATE
        tags t
    SET
        status = 'available',
        user_id = NULL,
        updated_at = NOW()
    WHERE
        t.id = OLD.tag_id
        AND NOT EXISTS(
            SELECT
                1
            FROM
                send_account_tags sat
            WHERE
                sat.tag_id = t.id);
    -- Try to update to next oldest confirmed tag if this was the main tag
    UPDATE
        send_accounts sa
    SET
        main_tag_id =(
            SELECT
                t.id
            FROM
                send_account_tags sat
                JOIN tags t ON t.id = sat.tag_id
            WHERE
                sat.send_account_id = OLD.send_account_id
                AND t.status = 'confirmed'
                AND t.id != OLD.tag_id -- Don't select the tag being deleted
            ORDER BY
                sat.created_at ASC
            LIMIT 1)
    WHERE
        sa.id = OLD.send_account_id
        AND sa.main_tag_id = OLD.tag_id;
    -- If no other confirmed tags exist, the ON DELETE SET NULL will handle it
    RETURN OLD;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_tag_confirmation()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    -- If this is the first confirmed tag for the send account, set it as main
    UPDATE
        send_accounts sa
    SET
        main_tag_id = NEW.id
    FROM
        send_account_tags sat
    WHERE
        sat.tag_id = NEW.id
        AND sat.send_account_id = sa.id
        AND sa.main_tag_id IS NULL;
    RETURN NEW;
END;
$function$
;

create or replace view "public"."tag_history" as  SELECT t.id AS tag_id,
    t.name,
    t.status,
    sat.created_at,
    p.send_id
   FROM (((tags t
     JOIN send_account_tags sat ON ((sat.tag_id = t.id)))
     JOIN send_accounts sa ON ((sa.id = sat.send_account_id)))
     JOIN profiles p ON ((p.id = sa.user_id)));


CREATE OR REPLACE FUNCTION public.validate_main_tag_update()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Only prevent setting to NULL if there are other confirmed tags available
  IF NEW.main_tag_id IS NULL AND OLD.main_tag_id IS NOT NULL AND EXISTS(
    SELECT
      1
    FROM
      send_account_tags sat
      JOIN tags t ON t.id = sat.tag_id
    WHERE
      sat.send_account_id = NEW.id AND t.status = 'confirmed') THEN
    RAISE EXCEPTION 'Cannot set main_tag_id to NULL while you have confirmed tags';
  END IF;
  -- Verify the new main_tag_id is one of the user's confirmed tags
  IF NEW.main_tag_id IS NOT NULL AND NOT EXISTS(
    SELECT
      1
    FROM
      send_account_tags sat
      JOIN tags t ON t.id = sat.tag_id
    WHERE
      sat.send_account_id = NEW.id AND t.status = 'confirmed' AND t.id = NEW.main_tag_id) THEN
    RAISE EXCEPTION 'main_tag_id must be one of your confirmed tags';
  END IF;
  RETURN NEW;
END;
$function$
;

create or replace view "public"."activity_feed" as  SELECT a.created_at,
    a.event_name,
        CASE
            WHEN (a.from_user_id = from_p.id) THEN ROW(
            CASE
                WHEN (a.from_user_id = ( SELECT auth.uid() AS uid)) THEN ( SELECT auth.uid() AS uid)
                ELSE NULL::uuid
            END, from_p.name, from_p.avatar_url, from_p.send_id, (( SELECT array_agg(t.name) AS array_agg
               FROM ((tags t
                 JOIN send_account_tags sat ON ((sat.tag_id = t.id)))
                 JOIN send_accounts sa ON ((sa.id = sat.send_account_id)))
              WHERE ((sa.user_id = from_p.id) AND (t.status = 'confirmed'::tag_status))))::text[])::activity_feed_user
            ELSE NULL::activity_feed_user
        END AS from_user,
        CASE
            WHEN (a.to_user_id = to_p.id) THEN ROW(
            CASE
                WHEN (a.to_user_id = ( SELECT auth.uid() AS uid)) THEN ( SELECT auth.uid() AS uid)
                ELSE NULL::uuid
            END, to_p.name, to_p.avatar_url, to_p.send_id, (( SELECT array_agg(t.name) AS array_agg
               FROM ((tags t
                 JOIN send_account_tags sat ON ((sat.tag_id = t.id)))
                 JOIN send_accounts sa ON ((sa.id = sat.send_account_id)))
              WHERE ((sa.user_id = to_p.id) AND (t.status = 'confirmed'::tag_status))))::text[])::activity_feed_user
            ELSE NULL::activity_feed_user
        END AS to_user,
    a.data
   FROM ((activity a
     LEFT JOIN profiles from_p ON ((a.from_user_id = from_p.id)))
     LEFT JOIN profiles to_p ON ((a.to_user_id = to_p.id)))
  WHERE ((a.from_user_id = ( SELECT auth.uid() AS uid)) OR ((a.to_user_id = ( SELECT auth.uid() AS uid)) AND (a.event_name !~~ 'temporal_%'::text)))
  GROUP BY a.created_at, a.event_name, a.from_user_id, a.to_user_id, from_p.id, from_p.name, from_p.avatar_url, from_p.send_id, to_p.id, to_p.name, to_p.avatar_url, to_p.send_id, a.data;

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

CREATE OR REPLACE FUNCTION public.tag_receipts_insert_activity_trigger()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    DELETE FROM activity
    WHERE event_name = 'tag_receipt_usdc'
        AND event_id IN(
            SELECT
                event_id
            FROM
                NEW_TABLE);
    -- Insert activity records using send_account_id from the confirmation
    INSERT INTO activity(event_name, event_id, from_user_id, data)
    SELECT
        'tag_receipt_usdc',
        NEW_TABLE.event_id,
        r.user_id,
        jsonb_build_object('log_addr', scr.log_addr, 'block_num', scr.block_num, 'tx_idx', scr.tx_idx, 'log_idx', scr.log_idx, 'tx_hash', scr.tx_hash, 'tags', array_agg(NEW_TABLE.tag_name), 'value', scr.amount::text)
    FROM
        NEW_TABLE
        JOIN receipts r ON r.event_id = NEW_TABLE.event_id
        JOIN sendtag_checkout_receipts scr ON scr.event_id = NEW_TABLE.event_id
    GROUP BY
        r.user_id,
        NEW_TABLE.event_id,
        scr.event_id,
        scr.log_addr,
        scr.block_num,
        scr.tx_idx,
        scr.log_idx,
        scr.tx_hash,
        scr.amount;
    RETURN NULL;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.tag_search(query text, limit_val integer, offset_val integer)
 RETURNS TABLE(send_id_matches tag_search_result[], tag_matches tag_search_result[], phone_matches tag_search_result[])
 LANGUAGE plpgsql
 IMMUTABLE SECURITY DEFINER
AS $function$
BEGIN
    IF limit_val IS NULL OR(limit_val <= 0 OR limit_val > 100) THEN
        RAISE EXCEPTION 'limit_val must be between 1 and 100';
    END IF;
    IF offset_val IS NULL OR offset_val < 0 THEN
        RAISE EXCEPTION 'offset_val must be greater than or equal to 0';
    END IF;
    RETURN query
    SELECT
        -- send_id matches
(
            SELECT
                array_agg(ROW(sub.avatar_url, sub.tag_name, sub.send_id, sub.phone)::public.tag_search_result)
            FROM(
                SELECT
                    p.avatar_url,
                    t.name AS tag_name,
                    p.send_id,
                    NULL::text AS phone
                FROM
                    profiles p
                LEFT JOIN send_accounts sa ON sa.user_id = p.id
                LEFT JOIN send_account_tags sat ON sat.send_account_id = sa.id
                LEFT JOIN tags t ON t.id = sat.tag_id
                    AND t.status = 'confirmed'
            WHERE
                query SIMILAR TO '\d+'
                AND p.send_id::varchar LIKE '%' || query || '%'
            ORDER BY
                p.send_id
            LIMIT limit_val offset offset_val) sub) AS send_id_matches,
    -- tag matches
(
        SELECT
            array_agg(ROW(sub.avatar_url, sub.tag_name, sub.send_id, sub.phone)::public.tag_search_result)
FROM( SELECT DISTINCT ON(p.id)
    p.avatar_url, t.name AS tag_name, p.send_id, NULL::text AS phone FROM profiles p
    JOIN send_accounts sa ON sa.user_id = p.id
    JOIN send_account_tags sat ON sat.send_account_id = sa.id
    JOIN tags t ON t.id = sat.tag_id
        AND t.status = 'confirmed'
WHERE(t.name <<-> query < 0.7
        OR t.name ILIKE '%' || query || '%')
ORDER BY p.id,(t.name <-> query)
LIMIT limit_val offset offset_val) sub) AS tag_matches,
    -- phone matches
(
        SELECT
            array_agg(ROW(sub.avatar_url, NULL::text, sub.send_id, sub.phone)::public.tag_search_result)
        FROM(
            SELECT
                p.avatar_url, p.send_id, u.phone
            FROM profiles p
            JOIN auth.users u ON u.id = p.id
        WHERE
            p.is_public
            AND query ~ '^\d{8,}$'
            AND u.phone LIKE query || '%' ORDER BY u.phone LIMIT limit_val offset offset_val) sub) AS phone_matches;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.tags_after_insert_or_update_func()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    -- Ensure that a user does not exceed the tag limit
    IF TG_OP = 'INSERT' AND(
        SELECT
            COUNT(DISTINCT t.id)
        FROM
            public.tags t
            JOIN send_account_tags sat ON sat.tag_id = t.id
            JOIN send_accounts sa ON sa.id = sat.send_account_id
        WHERE
            sa.user_id = auth.uid()) > 5 THEN
        RAISE EXCEPTION 'User can have at most 5 tags';
    END IF;
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.tags_before_insert_or_update_func()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    _debug text;
BEGIN
    -- Ensure user is not changing their confirmed tag name
    IF TG_OP = 'UPDATE' AND current_setting('role')::text = 'authenticated' AND NEW.status = 'confirmed'::public.tag_status AND OLD.name <> NEW.name THEN
        RAISE EXCEPTION 'Users cannot change the name of a confirmed tag';
    END IF;
    -- Ensure user is not confirming their own tag
    IF NEW.status = 'confirmed'::public.tag_status AND current_setting('role')::text = 'authenticated' THEN
        RAISE EXCEPTION 'Users cannot confirm their own tags';
    END IF;
    -- For INSERT operations, handle existing tags
    IF TG_OP = 'INSERT' THEN
        -- Check for recent pending tags by other users first
        IF EXISTS (
            SELECT
                1
            FROM
                tags t
                JOIN send_account_tags sat ON sat.tag_id = t.id
                JOIN send_accounts sa ON sa.id = sat.send_account_id
            WHERE
                t.name = NEW.name
                AND t.status = 'pending'::public.tag_status
                AND (NOW() - t.created_at) < INTERVAL '30 minutes'
                AND sa.user_id != auth.uid()) THEN
        RAISE EXCEPTION 'Tag with same name already exists';
    END IF;
    -- Delete send_account_tags for expired pending tags
    DELETE FROM send_account_tags sat USING tags t, send_accounts sa
    WHERE sat.tag_id = t.id
        AND sat.send_account_id = sa.id
        AND t.name = NEW.name
        AND t.status = 'pending'::public.tag_status
        AND (NOW() - t.created_at) > INTERVAL '30 minutes'
        AND sa.user_id != auth.uid();
    -- If there's an available tag, update it instead of inserting
    UPDATE
        tags
    SET
        status = 'available',
        updated_at = now()
    WHERE
        name = NEW.name
        AND status != 'confirmed';
    -- If we found and updated a tag, skip the INSERT
    IF FOUND THEN
        RETURN NULL;
    END IF;
END IF;
    RETURN NEW;
END;
$function$
;

grant delete on table "public"."historical_tag_associations" to "anon";

grant insert on table "public"."historical_tag_associations" to "anon";

grant references on table "public"."historical_tag_associations" to "anon";

grant select on table "public"."historical_tag_associations" to "anon";

grant trigger on table "public"."historical_tag_associations" to "anon";

grant truncate on table "public"."historical_tag_associations" to "anon";

grant update on table "public"."historical_tag_associations" to "anon";

grant delete on table "public"."historical_tag_associations" to "authenticated";

grant insert on table "public"."historical_tag_associations" to "authenticated";

grant references on table "public"."historical_tag_associations" to "authenticated";

grant select on table "public"."historical_tag_associations" to "authenticated";

grant trigger on table "public"."historical_tag_associations" to "authenticated";

grant truncate on table "public"."historical_tag_associations" to "authenticated";

grant update on table "public"."historical_tag_associations" to "authenticated";

grant delete on table "public"."historical_tag_associations" to "service_role";

grant insert on table "public"."historical_tag_associations" to "service_role";

grant references on table "public"."historical_tag_associations" to "service_role";

grant select on table "public"."historical_tag_associations" to "service_role";

grant trigger on table "public"."historical_tag_associations" to "service_role";

grant truncate on table "public"."historical_tag_associations" to "service_role";

grant update on table "public"."historical_tag_associations" to "service_role";

grant delete on table "public"."send_account_tags" to "anon";

grant insert on table "public"."send_account_tags" to "anon";

grant references on table "public"."send_account_tags" to "anon";

grant select on table "public"."send_account_tags" to "anon";

grant trigger on table "public"."send_account_tags" to "anon";

grant truncate on table "public"."send_account_tags" to "anon";

grant update on table "public"."send_account_tags" to "anon";

grant delete on table "public"."send_account_tags" to "authenticated";

grant insert on table "public"."send_account_tags" to "authenticated";

grant references on table "public"."send_account_tags" to "authenticated";

grant select on table "public"."send_account_tags" to "authenticated";

grant trigger on table "public"."send_account_tags" to "authenticated";

grant truncate on table "public"."send_account_tags" to "authenticated";

grant update on table "public"."send_account_tags" to "authenticated";

grant delete on table "public"."send_account_tags" to "service_role";

grant insert on table "public"."send_account_tags" to "service_role";

grant references on table "public"."send_account_tags" to "service_role";

grant select on table "public"."send_account_tags" to "service_role";

grant trigger on table "public"."send_account_tags" to "service_role";

grant truncate on table "public"."send_account_tags" to "service_role";

grant update on table "public"."send_account_tags" to "service_role";

create policy "delete_policy"
on "public"."tags"
as permissive
for delete
to authenticated
using (((status = 'pending'::tag_status) AND (EXISTS ( SELECT 1
   FROM (send_account_tags sat
     JOIN send_accounts sa ON ((sa.id = sat.send_account_id)))
  WHERE ((sat.tag_id = tags.id) AND (sa.user_id = ( SELECT auth.uid() AS uid)))))));

create policy "insert_policy"
on "public"."tags"
as permissive
for insert
to public
with check (((( SELECT auth.uid() AS uid) = user_id) AND (user_id IS NOT NULL)));

create policy "select_policy"
on "public"."tags"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM (send_account_tags sat
     JOIN send_accounts sa ON ((sa.id = sat.send_account_id)))
  WHERE ((sat.tag_id = tags.id) AND (sa.user_id = ( SELECT auth.uid() AS uid))))));

create policy "update_policy"
on "public"."tags"
as permissive
for update
to authenticated
using (((status = 'pending'::tag_status) AND (EXISTS ( SELECT 1
   FROM (send_account_tags sat
     JOIN send_accounts sa ON ((sa.id = sat.send_account_id)))
  WHERE ((sat.tag_id = tags.id) AND (sa.user_id = ( SELECT auth.uid() AS uid)))))))
with check (((status = 'pending'::tag_status) AND (EXISTS ( SELECT 1
   FROM (send_account_tags sat
     JOIN send_accounts sa ON ((sa.id = sat.send_account_id)))
  WHERE ((sat.tag_id = tags.id) AND (sa.user_id = ( SELECT auth.uid() AS uid)))))));

create policy "select_policy"
on "public"."historical_tag_associations"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "delete_policy"
on "public"."send_account_tags"
as permissive
for delete
to public
using ((EXISTS ( SELECT 1
   FROM send_accounts sa
  WHERE ((sa.id = send_account_tags.send_account_id) AND (sa.user_id = auth.uid())))));


create policy "select_policy"
on "public"."send_account_tags"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM send_accounts sa
  WHERE ((sa.id = send_account_tags.send_account_id) AND (sa.user_id = auth.uid())))));

CREATE TRIGGER send_account_tags_deleted AFTER DELETE ON public.send_account_tags FOR EACH ROW EXECUTE FUNCTION handle_send_account_tags_deleted();

CREATE TRIGGER validate_main_tag_update BEFORE UPDATE OF main_tag_id ON public.send_accounts FOR EACH ROW EXECUTE FUNCTION validate_main_tag_update();

CREATE TRIGGER set_main_tag_on_confirmation AFTER UPDATE ON public.tags FOR EACH ROW WHEN ((new.status = 'confirmed'::tag_status)) EXECUTE FUNCTION handle_tag_confirmation();

CREATE TRIGGER set_timestamp BEFORE UPDATE ON public.tags FOR EACH ROW EXECUTE FUNCTION set_current_timestamp_updated_at();

drop view if exists public.referrer;

drop function if exists public.profile_lookup(lookup_type lookup_type_enum, identifier text);


CREATE OR REPLACE FUNCTION public.profile_lookup(lookup_type lookup_type_enum, identifier text)
 RETURNS TABLE(id uuid, avatar_url text, name text, about text, refcode text, x_username text, birthday date, tag citext, address citext, chain_id integer, is_public boolean, sendid integer, all_tags text[], main_tag_id bigint, main_tag_name text)
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
       CASE WHEN p.is_public THEN p.x_username ELSE NULL END AS x_username, -- changed to be null if profile is private
       CASE WHEN p.is_public THEN p.birthday ELSE NULL END AS birthday, -- added birthday to return type, returns null if profile is private
       COALESCE(mt.name, t.name)                                         as tag,
       sa.address                                                        as address,
       sa.chain_id                                                       as chain_id,
       case when current_setting('role')::text = 'service_role' then p.is_public
            when p.is_public then true
            else false end                                               as is_public,
       p.send_id                                                         as sendid,
       ( select array_agg(t2.name::text)
         from tags t2
         join send_account_tags sat2 on sat2.tag_id = t2.id
         join send_accounts sa2 on sa2.id = sat2.send_account_id
         where sa2.user_id = p.id and t2.status = 'confirmed'::tag_status ) as all_tags,
       sa.main_tag_id                                                    as main_tag_id,
       mt.name::text                                                     as main_tag_name
from profiles p
    join auth.users a on a.id = p.id
    left join send_accounts sa on sa.user_id = p.id
    left join tags mt on mt.id = sa.main_tag_id
    left join send_account_tags sat on sat.send_account_id = sa.id
    left join tags t on t.id = sat.tag_id and t.status = 'confirmed'::tag_status
where ((lookup_type = 'sendid' and p.send_id::text = identifier) or
    (lookup_type = 'tag' and t.name = identifier::citext) or
    (lookup_type = 'refcode' and p.referral_code = identifier) or
    (lookup_type = 'address' and sa.address = identifier) or
    (p.is_public and lookup_type = 'phone' and a.phone::text = identifier)) -- lookup by phone number when profile is public
  and (p.is_public -- allow public profiles to be returned
   or ( select auth.uid() ) is not null -- allow profiles to be returned if the user is authenticated
   or current_setting('role')::text = 'service_role') -- allow public profiles to be returned to service role
    limit 1;
end;
$function$
;

create or replace view "public"."referrer" as  WITH referrer AS (
         SELECT p.send_id
           FROM (referrals r
             JOIN profiles p ON ((r.referrer_id = p.id)))
          WHERE (r.referred_id = ( SELECT auth.uid() AS uid))
          ORDER BY r.created_at
         LIMIT 1
        ), profile_lookup AS (
         SELECT p.id,
            p.avatar_url,
            p.name,
            p.about,
            p.refcode,
            p.x_username,
            p.birthday,
            p.tag,
            p.address,
            p.chain_id,
            p.is_public,
            p.sendid,
            p.all_tags,
            p.main_tag_id,
            p.main_tag_name,
            referrer.send_id
           FROM (profile_lookup('sendid'::lookup_type_enum, ( SELECT (referrer_1.send_id)::text AS send_id
                   FROM referrer referrer_1)) p(id, avatar_url, name, about, refcode, x_username, birthday, tag, address, chain_id, is_public, sendid, all_tags, main_tag_id, main_tag_name)
             JOIN referrer ON ((referrer.send_id IS NOT NULL)))
        )
 SELECT profile_lookup.id,
    profile_lookup.avatar_url,
    profile_lookup.name,
    profile_lookup.about,
    profile_lookup.refcode,
    profile_lookup.x_username,
    profile_lookup.birthday,
    profile_lookup.tag,
    profile_lookup.address,
    profile_lookup.chain_id,
    profile_lookup.is_public,
    profile_lookup.sendid,
    profile_lookup.all_tags,
    profile_lookup.main_tag_id,
    profile_lookup.main_tag_name,
    profile_lookup.send_id
   FROM profile_lookup;

