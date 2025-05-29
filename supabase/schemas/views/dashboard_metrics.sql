-- Cross-table views that depend on multiple schemas
-- This file contains views that reference tables from multiple schema files

-- Dashboard metrics view
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

grant delete, insert, references, select, trigger, truncate, update on dashboard_metrics to anon;

grant delete, insert, references, select, trigger, truncate, update on dashboard_metrics to authenticated;

grant delete, insert, references, select, trigger, truncate, update on dashboard_metrics to service_role;

ALTER TABLE "public"."dashboard_metrics" OWNER TO "postgres";
