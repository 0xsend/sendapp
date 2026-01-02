-- Step 1: Drop dependent views first
drop view if exists "public"."activity_feed";
drop view if exists "public"."dashboard_metrics";
drop view if exists "public"."send_scores";
drop view if exists "public"."send_scores_current";
drop view if exists "public"."send_scores_current_unique";
drop materialized view if exists "private"."send_scores_history";

-- Step 2: Add the is_verified column BEFORE creating views that reference it
alter table "public"."send_accounts" add column if not exists "is_verified" boolean not null default false;

-- Step 3: Create indexes on send_accounts
CREATE INDEX IF NOT EXISTS idx_send_accounts_is_verified ON public.send_accounts USING btree (address_bytes) WHERE (is_verified = true);

-- Step 4: Create indexes on send_check_claimed for performance
CREATE INDEX IF NOT EXISTS idx_send_check_claimed_redeemer_time ON public.send_check_claimed USING btree (redeemer, block_time, token) WHERE (redeemer <> sender);
CREATE INDEX IF NOT EXISTS idx_send_check_claimed_scores_composite ON public.send_check_claimed USING btree (token, block_time, sender, redeemer) WHERE (redeemer <> sender);
CREATE INDEX IF NOT EXISTS idx_send_check_claimed_send_token_only ON public.send_check_claimed USING btree (block_time DESC, sender, redeemer) WHERE ((token = '\xeab49138ba2ea6dd776220fe26b7b8e446638956'::bytea) AND (redeemer <> sender));

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION private.get_send_score(addr bytea)
 RETURNS TABLE(distribution_id integer, score numeric, unique_sends bigint, send_ceiling numeric)
 LANGUAGE plpgsql
 STABLE
AS $function$
BEGIN
    RETURN QUERY
    WITH active_distribution AS (
        SELECT
            d.id,
            d.number,
            EXTRACT(epoch FROM d.qualification_start) AS start_time,
            EXTRACT(epoch FROM d.qualification_end) AS end_time,
            d.hodler_min_balance,
            d.earn_min_balance,
            d.token_addr,
            ss.minimum_sends,
            ss.scaling_divisor,
            (SELECT distributions.id FROM distributions WHERE distributions.number = (d.number - 1)) AS prev_distribution_id
        FROM distributions d
        JOIN send_slash ss ON ss.distribution_id = d.id
        WHERE now() AT TIME ZONE 'UTC' >= d.qualification_start
        AND now() AT TIME ZONE 'UTC' < d.qualification_end
        LIMIT 1
    ),
    send_ceiling AS (
        SELECT
            ad.id AS distribution_id,
            ROUND((
                COALESCE(
                    (SELECT
                        CASE
                            WHEN d.token_addr = '\x3f14920c99beb920afa163031c4e47a3e03b3e4a'::bytea
                            THEN ds.amount * '10000000000000000'::numeric
                            ELSE ds.amount
                        END
                    FROM distribution_shares ds
                    JOIN distributions d ON d.id = ds.distribution_id
                    JOIN send_accounts sa ON sa.user_id = ds.user_id
                    WHERE ds.distribution_id = ad.prev_distribution_id
                    AND sa.address = concat('0x', encode(addr, 'hex'))::citext
                    AND ds.amount > 0),
                    CASE
                        WHEN ad.token_addr = '\x3f14920c99beb920afa163031c4e47a3e03b3e4a'::bytea
                        THEN ad.hodler_min_balance * '10000000000000000'::numeric
                        ELSE ad.hodler_min_balance
                    END
                ) / (ad.minimum_sends * ad.scaling_divisor)
            ))::numeric AS send_ceiling,
            ad.earn_min_balance,
            ad.start_time,
            ad.end_time
        FROM active_distribution ad
    )
    SELECT
        sc.distribution_id,
        SUM(LEAST(transfer_sums.amount, sc.send_ceiling)) as score,
        COUNT(DISTINCT transfer_sums.t) as unique_sends,
        sc.send_ceiling
    FROM send_ceiling sc
    LEFT JOIN LATERAL (
        SELECT t, SUM(v) as amount
        FROM (
            SELECT
                stt.t,
                stt.v,
                stt.block_time
            FROM send_token_transfers stt
            WHERE stt.f = addr
            AND stt.block_time >= sc.start_time
            AND stt.block_time <= sc.end_time
            UNION ALL
            SELECT
                stv.t,
                stv.v * '10000000000000000'::numeric,
                stv.block_time
            FROM send_token_v0_transfers stv
            WHERE stv.f = addr
            AND stv.block_time >= sc.start_time
            AND stv.block_time <= sc.end_time
            UNION ALL
            -- Send Check claims (SEND token only, verified redeemer)
            -- OPTIMIZED: Direct is_verified check instead of profiles JOIN
            SELECT
                scc.redeemer AS t,
                scc.amount AS v,
                scc.block_time
            FROM send_check_claimed scc
            JOIN send_accounts sa_redeemer ON scc.redeemer = sa_redeemer.address_bytes
            WHERE scc.sender = addr
            AND scc.block_time >= sc.start_time
            AND scc.block_time <= sc.end_time
            AND scc.token = '\xeab49138ba2ea6dd776220fe26b7b8e446638956'::bytea
            AND sa_redeemer.is_verified = TRUE  -- OPTIMIZATION: Direct column check
            AND scc.redeemer != scc.sender
        ) transfers
        WHERE sc.earn_min_balance = 0
        OR EXISTS (
            SELECT 1
            FROM send_earn_balances_timeline ebt
            WHERE ebt.owner = transfers.t
            AND ebt.assets >= sc.earn_min_balance
            AND ebt.block_time <= transfers.block_time
        )
        GROUP BY t
    ) transfer_sums ON true
    GROUP BY sc.distribution_id, sc.send_ceiling
    HAVING SUM(LEAST(transfer_sums.amount, sc.send_ceiling)) > 0;
END;
$function$
;

create materialized view "private"."send_scores_history" as  WITH dws AS (
         SELECT d.id,
            EXTRACT(epoch FROM d.qualification_start) AS start_time,
            EXTRACT(epoch FROM d.qualification_end) AS end_time,
            d.hodler_min_balance,
            d.earn_min_balance,
            d.token_addr,
            ss.minimum_sends,
            ss.scaling_divisor,
            ( SELECT distributions.id
                   FROM distributions
                  WHERE (distributions.number = (d.number - 1))) AS prev_distribution_id
           FROM (distributions d
             JOIN send_slash ss ON ((ss.distribution_id = d.id)))
          WHERE (d.qualification_end < (now() AT TIME ZONE 'UTC'::text))
        ), bounds AS (
         SELECT min(dws.start_time) AS min_start,
            max(dws.end_time) AS max_end
           FROM dws
        ), transfers AS (
         SELECT stt.f,
            stt.t,
            stt.v,
            stt.block_time
           FROM (send_token_transfers stt
             CROSS JOIN bounds)
          WHERE ((stt.block_time >= bounds.min_start) AND (stt.block_time <= bounds.max_end))
        UNION ALL
         SELECT stv.f,
            stv.t,
            (stv.v * '10000000000000000'::numeric),
            stv.block_time
           FROM (send_token_v0_transfers stv
             CROSS JOIN bounds)
          WHERE ((stv.block_time >= bounds.min_start) AND (stv.block_time <= bounds.max_end))
        UNION ALL
         SELECT scc.sender AS f,
            scc.redeemer AS t,
            scc.amount AS v,
            scc.block_time
           FROM ((send_check_claimed scc
             JOIN send_accounts sa_redeemer ON ((scc.redeemer = sa_redeemer.address_bytes)))
             CROSS JOIN bounds)
          WHERE ((scc.block_time >= bounds.min_start) AND (scc.block_time <= bounds.max_end) AND (scc.token = '\xeab49138ba2ea6dd776220fe26b7b8e446638956'::bytea) AND (sa_redeemer.is_verified = true) AND (scc.redeemer <> scc.sender))
        ), window_transfers AS (
         SELECT dws.id AS distribution_id,
            tr.f,
            tr.t,
            sum(tr.v) AS transfer_sum
           FROM (transfers tr
             JOIN dws ON (((tr.block_time >= dws.start_time) AND (tr.block_time <= dws.end_time))))
          WHERE (tr.t IS NOT NULL)
          GROUP BY dws.id, tr.f, tr.t
        ), sender_accounts AS (
         SELECT DISTINCT wt.distribution_id,
            sa.user_id,
            sa.address_bytes
           FROM (send_accounts sa
             JOIN window_transfers wt ON ((sa.address_bytes = wt.f)))
        ), filtered_window_transfers AS (
         SELECT wt.f,
            wt.t,
            wt.transfer_sum,
            wt.distribution_id
           FROM window_transfers wt
          WHERE (wt.f IN ( SELECT sa.address_bytes
                   FROM sender_accounts sa))
        ), prev_shares AS (
         SELECT dws.id AS distribution_id,
            ds.user_id,
                CASE
                    WHEN (d.token_addr = '\x3f14920c99beb920afa163031c4e47a3e03b3e4a'::bytea) THEN (ds.amount * '10000000000000000'::numeric)
                    ELSE ds.amount
                END AS adjusted_amount
           FROM (((dws
             JOIN distribution_shares ds ON ((ds.distribution_id = dws.prev_distribution_id)))
             JOIN distributions d ON ((d.id = ds.distribution_id)))
             JOIN ( SELECT DISTINCT sender_accounts.distribution_id,
                    sender_accounts.user_id
                   FROM sender_accounts) s ON (((s.user_id = ds.user_id) AND (s.distribution_id = dws.id))))
          WHERE (ds.amount > (0)::numeric)
        ), send_ceiling_settings AS (
         SELECT s.distribution_id,
            s.user_id,
            s.address_bytes AS address,
            round((COALESCE(ps.adjusted_amount,
                CASE
                    WHEN (dws.token_addr = '\x3f14920c99beb920afa163031c4e47a3e03b3e4a'::bytea) THEN (dws.hodler_min_balance * '10000000000000000'::numeric)
                    ELSE dws.hodler_min_balance
                END) / ((dws.minimum_sends * dws.scaling_divisor))::numeric)) AS send_ceiling
           FROM ((sender_accounts s
             JOIN dws ON ((dws.id = s.distribution_id)))
             LEFT JOIN prev_shares ps ON (((ps.user_id = s.user_id) AND (ps.distribution_id = s.distribution_id))))
        ), eligible_earn_accounts AS (
         SELECT DISTINCT dws.id AS distribution_id,
            ebt.owner
           FROM (send_earn_balances_timeline ebt
             JOIN dws ON ((ebt.assets >= (dws.earn_min_balance)::numeric)))
        )
 SELECT scs.user_id,
    scs.distribution_id,
    scores.score,
    scores.unique_sends,
    scs.send_ceiling
   FROM (( SELECT fwt.f AS address,
            fwt.distribution_id,
            sum(LEAST(fwt.transfer_sum, scs_1.send_ceiling)) AS score,
            count(DISTINCT fwt.t) AS unique_sends
           FROM ((filtered_window_transfers fwt
             JOIN send_ceiling_settings scs_1 ON (((fwt.f = scs_1.address) AND (fwt.distribution_id = scs_1.distribution_id))))
             JOIN dws ON ((dws.id = scs_1.distribution_id)))
          WHERE ((dws.earn_min_balance = 0) OR (EXISTS ( SELECT 1
                   FROM eligible_earn_accounts elig
                  WHERE ((elig.distribution_id = fwt.distribution_id) AND (elig.owner = fwt.t)))))
          GROUP BY fwt.f, fwt.distribution_id
         HAVING (sum(LEAST(fwt.transfer_sum, scs_1.send_ceiling)) > (0)::numeric)) scores
     JOIN send_ceiling_settings scs ON (((scores.address = scs.address) AND (scores.distribution_id = scs.distribution_id))));

CREATE UNIQUE INDEX send_scores_history_user_id_distribution_id_idx ON private.send_scores_history USING btree (user_id, distribution_id);

-- (Moved to top of file)

CREATE OR REPLACE FUNCTION public.refresh_send_account_verification_status()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    curr_distribution_id bigint;
BEGIN
    -- Get current distribution
    SELECT id INTO curr_distribution_id
    FROM distributions
    WHERE qualification_start <= CURRENT_TIMESTAMP AT TIME ZONE 'UTC'
      AND qualification_end >= CURRENT_TIMESTAMP AT TIME ZONE 'UTC'
    ORDER BY qualification_start DESC
    LIMIT 1;

    -- Only set is_verified for users with shares in current distribution
    -- Never clear is_verified - once verified, always verified
    IF curr_distribution_id IS NOT NULL THEN
        UPDATE send_accounts
        SET is_verified = TRUE
        WHERE user_id IN (
            SELECT DISTINCT user_id
            FROM distribution_shares
            WHERE distribution_id = curr_distribution_id
        )
        AND is_verified = FALSE;
    END IF;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_send_account_verified_on_share_delete()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    -- No-op: once verified, always verified
    -- We don't clear is_verified when shares are deleted
    RETURN OLD;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_send_account_verified_on_share_insert()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    curr_distribution_id bigint;
BEGIN
    -- Get current distribution
    SELECT id INTO curr_distribution_id
    FROM distributions
    WHERE qualification_start <= CURRENT_TIMESTAMP AT TIME ZONE 'UTC'
      AND qualification_end >= CURRENT_TIMESTAMP AT TIME ZONE 'UTC'
    ORDER BY qualification_start DESC
    LIMIT 1;

    -- Only update if inserting a share for the current distribution
    IF curr_distribution_id IS NOT NULL AND NEW.distribution_id = curr_distribution_id THEN
        UPDATE send_accounts
        SET is_verified = TRUE
        WHERE user_id = NEW.user_id
          AND is_verified = FALSE;
    END IF;

    RETURN NEW;
END;
$function$
;

create or replace view "public"."activity_feed" as  SELECT a.event_id,
    a.created_at,
    a.event_name,
        CASE
            WHEN (a.from_user_id = from_p.id) THEN ROW(
            CASE
                WHEN (a.from_user_id = ( SELECT auth.uid() AS uid)) THEN ( SELECT auth.uid() AS uid)
                ELSE NULL::uuid
            END, from_p.name, from_p.avatar_url, from_p.send_id,
            CASE
                WHEN (a.from_user_id = ( SELECT auth.uid() AS uid)) THEN from_sa.main_tag_id
                ELSE NULL::bigint
            END, (from_main_tag.name)::text, (( SELECT array_agg(t.name) AS array_agg
               FROM ((tags t
                 JOIN send_account_tags sat ON ((sat.tag_id = t.id)))
                 JOIN send_accounts sa ON ((sa.id = sat.send_account_id)))
              WHERE ((sa.user_id = from_p.id) AND (t.status = 'confirmed'::tag_status))))::text[], (from_p.verified_at IS NOT NULL))::activity_feed_user
            ELSE NULL::activity_feed_user
        END AS from_user,
        CASE
            WHEN (a.to_user_id = to_p.id) THEN ROW(
            CASE
                WHEN (a.to_user_id = ( SELECT auth.uid() AS uid)) THEN ( SELECT auth.uid() AS uid)
                ELSE NULL::uuid
            END, to_p.name, to_p.avatar_url, to_p.send_id,
            CASE
                WHEN (a.to_user_id = ( SELECT auth.uid() AS uid)) THEN to_sa.main_tag_id
                ELSE NULL::bigint
            END, (to_main_tag.name)::text, (( SELECT array_agg(t.name) AS array_agg
               FROM ((tags t
                 JOIN send_account_tags sat ON ((sat.tag_id = t.id)))
                 JOIN send_accounts sa ON ((sa.id = sat.send_account_id)))
              WHERE ((sa.user_id = to_p.id) AND (t.status = 'confirmed'::tag_status))))::text[], (to_p.verified_at IS NOT NULL))::activity_feed_user
            ELSE NULL::activity_feed_user
        END AS to_user,
    a.data
   FROM ((((((activity a
     LEFT JOIN profiles from_p ON ((a.from_user_id = from_p.id)))
     LEFT JOIN profiles to_p ON ((a.to_user_id = to_p.id)))
     LEFT JOIN send_accounts from_sa ON ((from_sa.user_id = from_p.id)))
     LEFT JOIN tags from_main_tag ON ((from_main_tag.id = from_sa.main_tag_id)))
     LEFT JOIN send_accounts to_sa ON ((to_sa.user_id = to_p.id)))
     LEFT JOIN tags to_main_tag ON ((to_main_tag.id = to_sa.main_tag_id)))
  WHERE ((a.from_user_id = ( SELECT auth.uid() AS uid)) OR ((a.to_user_id = ( SELECT auth.uid() AS uid)) AND (a.event_name !~~ 'temporal_%'::text)))
  GROUP BY a.event_id, a.created_at, a.event_name, a.from_user_id, a.to_user_id, from_p.id, from_p.name, from_p.avatar_url, from_p.send_id, to_p.id, to_p.name, to_p.avatar_url, to_p.send_id, a.data, from_sa.main_tag_id, from_main_tag.name, to_sa.main_tag_id, to_main_tag.name, from_p.verified_at, to_p.verified_at;


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


create or replace view "public"."send_scores_current" as  WITH dws AS (
         SELECT d.id,
            EXTRACT(epoch FROM d.qualification_start) AS start_time,
            EXTRACT(epoch FROM d.qualification_end) AS end_time,
            d.hodler_min_balance,
            d.earn_min_balance,
            d.token_addr,
            ss.minimum_sends,
            ss.scaling_divisor,
            ( SELECT distributions.id
                   FROM distributions
                  WHERE (distributions.number = (d.number - 1))) AS prev_distribution_id
           FROM (distributions d
             JOIN send_slash ss ON ((ss.distribution_id = d.id)))
          WHERE (((now() AT TIME ZONE 'UTC'::text) >= d.qualification_start) AND ((now() AT TIME ZONE 'UTC'::text) < d.qualification_end))
         LIMIT 1
        ), authorized_accounts AS (
         SELECT sa.user_id,
            sa.address_bytes
           FROM send_accounts sa
          WHERE
                CASE
                    WHEN (CURRENT_USER = ANY (ARRAY['postgres'::name, 'service_role'::name])) THEN true
                    WHEN ((CURRENT_USER = 'authenticated'::name) AND (auth.uid() IS NOT NULL)) THEN (sa.user_id = auth.uid())
                    ELSE false
                END
        ), eligible_earn_accounts AS (
         SELECT DISTINCT ebt.owner
           FROM (send_earn_balances_timeline ebt
             CROSS JOIN dws dws_1)
          WHERE (ebt.assets >= (dws_1.earn_min_balance)::numeric)
        ), actual_senders AS (
         SELECT DISTINCT all_senders.f AS address_bytes
           FROM ( SELECT stt.f
                   FROM (send_token_transfers stt
                     CROSS JOIN dws dws_1)
                  WHERE ((stt.block_time >= dws_1.start_time) AND (stt.block_time <= dws_1.end_time))
                UNION ALL
                 SELECT stv.f
                   FROM (send_token_v0_transfers stv
                     CROSS JOIN dws dws_1)
                  WHERE ((stv.block_time >= dws_1.start_time) AND (stv.block_time <= dws_1.end_time))
                UNION ALL
                 SELECT scc.sender AS f
                   FROM ((send_check_claimed scc
                     JOIN send_accounts sa_redeemer ON ((scc.redeemer = sa_redeemer.address_bytes)))
                     CROSS JOIN dws dws_1)
                  WHERE ((scc.block_time >= dws_1.start_time) AND (scc.block_time <= dws_1.end_time) AND (scc.token = '\xeab49138ba2ea6dd776220fe26b7b8e446638956'::bytea) AND (sa_redeemer.is_verified = true) AND (scc.redeemer <> scc.sender))) all_senders
          WHERE (all_senders.f IS NOT NULL)
        ), sender_accounts AS (
         SELECT aa.user_id,
            aa.address_bytes
           FROM authorized_accounts aa
          WHERE (EXISTS ( SELECT 1
                   FROM actual_senders act
                  WHERE (act.address_bytes = aa.address_bytes)))
        ), window_transfers AS (
         SELECT u.f,
            u.t,
            sum(u.v) AS transfer_sum
           FROM ( SELECT stt.f,
                    stt.t,
                    stt.v
                   FROM (send_token_transfers stt
                     CROSS JOIN dws dws_1)
                  WHERE ((stt.block_time >= dws_1.start_time) AND (stt.block_time <= dws_1.end_time) AND (stt.t IS NOT NULL) AND (stt.f IN ( SELECT sender_accounts.address_bytes
                           FROM sender_accounts)) AND ((dws_1.earn_min_balance = 0) OR (stt.t IN ( SELECT eligible_earn_accounts.owner
                           FROM eligible_earn_accounts))))
                UNION ALL
                 SELECT stv.f,
                    stv.t,
                    (stv.v * '10000000000000000'::numeric)
                   FROM (send_token_v0_transfers stv
                     CROSS JOIN dws dws_1)
                  WHERE ((stv.block_time >= dws_1.start_time) AND (stv.block_time <= dws_1.end_time) AND (stv.t IS NOT NULL) AND (stv.f IN ( SELECT sender_accounts.address_bytes
                           FROM sender_accounts)) AND ((dws_1.earn_min_balance = 0) OR (stv.t IN ( SELECT eligible_earn_accounts.owner
                           FROM eligible_earn_accounts))))
                UNION ALL
                 SELECT scc.sender AS f,
                    scc.redeemer AS t,
                    scc.amount AS v
                   FROM ((send_check_claimed scc
                     JOIN send_accounts sa_redeemer ON ((scc.redeemer = sa_redeemer.address_bytes)))
                     CROSS JOIN dws dws_1)
                  WHERE ((scc.block_time >= dws_1.start_time) AND (scc.block_time <= dws_1.end_time) AND (scc.token = '\xeab49138ba2ea6dd776220fe26b7b8e446638956'::bytea) AND (sa_redeemer.is_verified = true) AND (scc.redeemer <> scc.sender) AND (scc.sender IN ( SELECT sender_accounts.address_bytes
                           FROM sender_accounts)) AND ((dws_1.earn_min_balance = 0) OR (scc.redeemer IN ( SELECT eligible_earn_accounts.owner
                           FROM eligible_earn_accounts))))) u
          GROUP BY u.f, u.t
        ), filtered_window_transfers AS (
         SELECT wt_1.f,
            wt_1.t,
            wt_1.transfer_sum
           FROM window_transfers wt_1
          WHERE (wt_1.f IN ( SELECT sa.address_bytes
                   FROM sender_accounts sa))
        ), prev_shares AS (
         SELECT ds.user_id,
                CASE
                    WHEN (d.token_addr = '\x3f14920c99beb920afa163031c4e47a3e03b3e4a'::bytea) THEN (ds.amount * '10000000000000000'::numeric)
                    ELSE ds.amount
                END AS adjusted_amount
           FROM (((dws dws_1
             JOIN distribution_shares ds ON ((ds.distribution_id = dws_1.prev_distribution_id)))
             JOIN distributions d ON ((d.id = ds.distribution_id)))
             JOIN sender_accounts s ON ((s.user_id = ds.user_id)))
          WHERE (ds.amount > (0)::numeric)
        ), send_ceiling AS (
         SELECT s.user_id,
            s.address_bytes AS address,
            dws_1.id AS distribution_id,
            round((COALESCE(ps.adjusted_amount,
                CASE
                    WHEN (dws_1.token_addr = '\x3f14920c99beb920afa163031c4e47a3e03b3e4a'::bytea) THEN (dws_1.hodler_min_balance * '10000000000000000'::numeric)
                    ELSE dws_1.hodler_min_balance
                END) / ((dws_1.minimum_sends * dws_1.scaling_divisor))::numeric)) AS send_ceiling
           FROM ((sender_accounts s
             CROSS JOIN dws dws_1)
             LEFT JOIN prev_shares ps ON ((ps.user_id = s.user_id)))
        )
 SELECT sc.user_id,
    sc.distribution_id,
    sum(LEAST(fwt.transfer_sum, sc.send_ceiling)) AS score,
    count(DISTINCT fwt.t) AS unique_sends,
    max(sc.send_ceiling) AS send_ceiling
   FROM ((filtered_window_transfers fwt
     CROSS JOIN dws)
     JOIN send_ceiling sc ON ((sc.address = fwt.f)))
  GROUP BY sc.user_id, sc.distribution_id
 HAVING (sum(LEAST(fwt.transfer_sum, sc.send_ceiling)) > (0)::numeric);


create or replace view "public"."send_scores_current_unique" as  WITH access_control AS (
         SELECT
                CASE
                    WHEN (CURRENT_USER = ANY (ARRAY['postgres'::name, 'service_role'::name])) THEN true
                    WHEN ((CURRENT_USER = 'authenticated'::name) AND (auth.uid() IS NOT NULL)) THEN false
                    ELSE NULL::boolean
                END AS show_all_users,
            auth.uid() AS current_user_id
        ), active_distribution AS (
         SELECT distributions.id,
            distributions.number,
            EXTRACT(epoch FROM distributions.qualification_start) AS start_time,
            EXTRACT(epoch FROM distributions.qualification_end) AS end_time,
            distributions.hodler_min_balance,
            distributions.earn_min_balance,
            distributions.token_addr
           FROM distributions
          WHERE (((now() AT TIME ZONE 'UTC'::text) >= distributions.qualification_start) AND ((now() AT TIME ZONE 'UTC'::text) < distributions.qualification_end))
         LIMIT 1
        ), send_ceiling_settings AS (
         WITH previous_distribution AS (
                 SELECT ds.user_id,
                    ds.amount AS user_prev_shares
                   FROM (distribution_shares ds
                     JOIN distributions d ON ((d.id = ds.distribution_id)))
                  WHERE ((d.number = ( SELECT (active_distribution.number - 1)
                           FROM active_distribution)) AND (ds.amount > (0)::numeric))
                )
         SELECT sa.user_id,
            round((COALESCE(pd.user_prev_shares, ad.hodler_min_balance) / (( SELECT (s_s.minimum_sends * s_s.scaling_divisor)
                   FROM send_slash s_s
                  WHERE (s_s.distribution_id = ( SELECT active_distribution.id
                           FROM active_distribution))))::numeric)) AS send_ceiling
           FROM ((send_accounts sa
             CROSS JOIN active_distribution ad)
             LEFT JOIN previous_distribution pd ON ((pd.user_id = sa.user_id)))
        ), valid_transfers AS (
         SELECT stt.f,
            stt.t,
            stt.v,
            stt.block_time,
            sa_from.user_id AS from_user_id,
            sa_to.user_id AS to_user_id,
                CASE
                    WHEN (( SELECT active_distribution.earn_min_balance
                       FROM active_distribution) > 0) THEN COALESCE(( SELECT bt.assets
                       FROM send_earn_balances_timeline bt
                      WHERE ((bt.owner = stt.t) AND (bt.block_time <= stt.block_time))
                      ORDER BY bt.block_time DESC
                     LIMIT 1), (0)::numeric)
                    ELSE NULL::numeric
                END AS earn_balance
           FROM (((send_token_transfers stt
             JOIN send_accounts sa_from ON ((sa_from.address = (concat('0x', encode(stt.f, 'hex'::text)))::citext)))
             LEFT JOIN send_accounts sa_to ON ((sa_to.address = (concat('0x', encode(stt.t, 'hex'::text)))::citext)))
             CROSS JOIN active_distribution ad)
          WHERE ((stt.block_time >= ad.start_time) AND (stt.block_time < ad.end_time))
        )
 SELECT ( SELECT active_distribution.id
           FROM active_distribution) AS distribution_id,
    subq.from_user_id,
    subq.to_user_id,
    max(LEAST(
        CASE
            WHEN (subq.earn_balance IS NULL) THEN subq.v
            WHEN (subq.earn_balance >= (( SELECT active_distribution.earn_min_balance
               FROM active_distribution))::numeric) THEN subq.v
            ELSE (0)::numeric
        END, subq.send_ceiling)) AS capped_amount,
    max(subq.send_ceiling) AS send_ceiling
   FROM ( SELECT vt.from_user_id,
            vt.to_user_id,
            vt.v,
            vt.earn_balance,
            scs.send_ceiling
           FROM (valid_transfers vt
             JOIN send_ceiling_settings scs ON ((vt.from_user_id = scs.user_id)))) subq
  WHERE ((LEAST(
        CASE
            WHEN (subq.earn_balance IS NULL) THEN subq.v
            WHEN (subq.earn_balance >= (( SELECT active_distribution.earn_min_balance
               FROM active_distribution))::numeric) THEN subq.v
            ELSE (0)::numeric
        END, subq.send_ceiling) > (0)::numeric) AND ((( SELECT access_control.show_all_users
           FROM access_control) = true) OR ((( SELECT access_control.show_all_users
           FROM access_control) = false) AND (subq.from_user_id = ( SELECT access_control.current_user_id
           FROM access_control)))))
  GROUP BY subq.from_user_id, subq.to_user_id;


create or replace view "public"."send_scores" as  SELECT h.user_id,
    h.distribution_id,
    h.score,
    h.unique_sends,
    h.send_ceiling
   FROM get_send_scores_history() h(user_id, distribution_id, score, unique_sends, send_ceiling)
UNION ALL
 SELECT c.user_id,
    c.distribution_id,
    c.score,
    c.unique_sends,
    c.send_ceiling
   FROM send_scores_current c;


CREATE TRIGGER update_send_account_verified_on_delete AFTER DELETE ON public.distribution_shares FOR EACH ROW EXECUTE FUNCTION update_send_account_verified_on_share_delete();

CREATE TRIGGER update_send_account_verified_on_insert AFTER INSERT ON public.distribution_shares FOR EACH ROW EXECUTE FUNCTION update_send_account_verified_on_share_insert();


