SET lock_timeout = '5s';

DROP POLICY IF EXISTS "Allow anonymous read access to distributions" ON "public"."distributions";
CREATE POLICY "Allow anonymous read access to distributions" ON "public"."distributions" FOR SELECT TO "anon" USING (true);

CREATE INDEX IF NOT EXISTS  idx_send_accounts_user_address_bytes ON public.send_accounts USING btree (user_id, address_bytes);

CREATE INDEX IF NOT EXISTS "idx_send_token_transfers_f_block_time" ON "public"."send_token_transfers" USING "btree" ("f", "block_time");
CREATE INDEX IF NOT EXISTS "idx_send_token_transfers_t_block_time" ON "public"."send_token_transfers" USING "btree" ("t", "block_time");

CREATE INDEX IF NOT EXISTS "idx_send_token_v0_transfers_f_block_time" ON "public"."send_token_v0_transfers" USING "btree" ("f", "block_time");
CREATE INDEX IF NOT EXISTS "idx_send_token_v0_transfers_t_block_time" ON "public"."send_token_v0_transfers" USING "btree" ("t", "block_time");

-- Recreate RLS policies with address_bytes lookups
alter policy "users can see their own account created"
on "public"."send_account_created"
using ((EXISTS ( SELECT 1
   FROM send_accounts
  WHERE ((send_accounts.user_id = ( SELECT auth.uid() AS uid)) AND (send_accounts.address_bytes = send_account_created.account)))));

alter policy "users can see their own ETH receives"
on "public"."send_account_receives"
using (((EXISTS ( SELECT 1
   FROM send_accounts
  WHERE ((send_accounts.user_id = ( SELECT auth.uid() AS uid)) AND (send_accounts.address_bytes = send_account_receives.sender)))) OR (EXISTS ( SELECT 1
   FROM send_accounts
  WHERE ((send_accounts.user_id = ( SELECT auth.uid() AS uid)) AND (send_accounts.address_bytes = send_account_receives.log_addr))))));

alter policy "Send account signing key added can be read by the user who crea"
on "public"."send_account_signing_key_added"
using ((EXISTS ( SELECT 1
   FROM send_accounts
  WHERE ((send_accounts.user_id = ( SELECT auth.uid() AS uid)) AND (send_accounts.address_bytes = send_account_signing_key_added.account)))));

alter policy "users can see own signing key removed"
on "public"."send_account_signing_key_removed"
using ((EXISTS ( SELECT 1
   FROM send_accounts
  WHERE ((send_accounts.user_id = ( SELECT auth.uid() AS uid)) AND (send_accounts.address_bytes = send_account_signing_key_removed.account)))));

alter policy "users can see their own send_earn_deposit"
on "public"."send_earn_deposit"
using ((EXISTS ( SELECT 1
   FROM send_accounts
  WHERE ((send_accounts.user_id = ( SELECT auth.uid() AS uid)) AND (send_accounts.address_bytes = send_earn_deposit.owner)))));

alter policy "users can see their own send_earn_withdraw"
on "public"."send_earn_withdraw"
using ((EXISTS ( SELECT 1
   FROM send_accounts
  WHERE ((send_accounts.user_id = ( SELECT auth.uid() AS uid)) AND (send_accounts.address_bytes = send_earn_withdraw.owner)))));

alter policy "Send revenues safe receives can be read by the user who created"
on "public"."send_revenues_safe_receives"
using (((EXISTS ( SELECT 1
   FROM chain_addresses
  WHERE ((chain_addresses.user_id = ( SELECT auth.uid() AS uid)) AND (chain_addresses.address = (lower(concat('0x', encode(send_revenues_safe_receives.sender, 'hex'::text))))::citext)))) OR (EXISTS ( SELECT 1
   FROM send_accounts
  WHERE ((send_accounts.user_id = ( SELECT auth.uid() AS uid)) AND (send_accounts.address_bytes = send_revenues_safe_receives.sender))))));

alter policy "users can see their own transfers"
on "public"."send_account_transfers"
using (((EXISTS ( SELECT 1
   FROM send_accounts
  WHERE ((send_accounts.user_id = ( SELECT auth.uid() AS uid)) AND (send_accounts.address_bytes = send_account_transfers.f)))) OR (EXISTS ( SELECT 1
   FROM send_accounts
  WHERE ((send_accounts.user_id = ( SELECT auth.uid() AS uid)) AND (send_accounts.address_bytes = send_account_transfers.t))))));

alter policy "users can see their own transfers"
on "public"."send_token_transfers"
using ((EXISTS ( SELECT 1
   FROM send_accounts
  WHERE ((send_accounts.user_id = ( SELECT auth.uid() AS uid)) AND ((send_accounts.address_bytes = send_token_transfers.f) OR (send_accounts.address_bytes = send_token_transfers.t))))));

alter policy "users can see their own transfers"
on "public"."send_token_v0_transfers"
using ((EXISTS ( SELECT 1
   FROM send_accounts
  WHERE ((send_accounts.user_id = ( SELECT auth.uid() AS uid)) AND ((send_accounts.address_bytes = send_token_v0_transfers.f) OR (send_accounts.address_bytes = send_token_v0_transfers.t))))));

alter policy "users can see their own ticket purchases"
on "public"."sendpot_user_ticket_purchases"
using ((EXISTS ( SELECT 1
   FROM send_accounts sa
  WHERE ((sa.user_id = ( SELECT auth.uid() AS uid)) AND (sa.address_bytes = sendpot_user_ticket_purchases.recipient)))));

alter policy "users can see their own sendtag_checkout_receipts"
on "public"."sendtag_checkout_receipts"
using ((EXISTS ( SELECT 1
   FROM send_accounts
  WHERE ((send_accounts.user_id = ( SELECT auth.uid() AS uid)) AND (send_accounts.address_bytes = sendtag_checkout_receipts.sender)))));

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
         SELECT DISTINCT f AS address_bytes
         FROM (
           SELECT stt.f
           FROM send_token_transfers stt
           CROSS JOIN dws dws_1
           WHERE (stt.block_time >= dws_1.start_time) AND (stt.block_time <= dws_1.end_time)
           UNION ALL
           SELECT stv.f
           FROM send_token_v0_transfers stv
           CROSS JOIN dws dws_1
           WHERE (stv.block_time >= dws_1.start_time) AND (stv.block_time <= dws_1.end_time)
         ) all_senders
         WHERE f IS NOT NULL
        ), sender_accounts AS (
         SELECT aa.user_id, aa.address_bytes
         FROM authorized_accounts aa
         WHERE EXISTS (
           SELECT 1 FROM actual_senders act WHERE act.address_bytes = aa.address_bytes
         )
        ), window_transfers AS (
         SELECT u.f,
            u.t,
            sum(u.v) AS transfer_sum
           FROM (
             SELECT stt.f,
                    stt.t,
                    stt.v
               FROM send_token_transfers stt
               CROSS JOIN dws dws_1
              WHERE ((stt.block_time >= dws_1.start_time) AND (stt.block_time <= dws_1.end_time))
                AND stt.t IS NOT NULL
AND stt.f IN (SELECT address_bytes FROM sender_accounts)
                AND ((dws_1.earn_min_balance = 0) OR (stt.t IN (SELECT owner FROM eligible_earn_accounts)))
             UNION ALL
             SELECT stv.f,
                    stv.t,
                    (stv.v * '10000000000000000'::numeric)
               FROM send_token_v0_transfers stv
               CROSS JOIN dws dws_1
              WHERE ((stv.block_time >= dws_1.start_time) AND (stv.block_time <= dws_1.end_time))
                AND stv.t IS NOT NULL
AND stv.f IN (SELECT address_bytes FROM sender_accounts)
                AND ((dws_1.earn_min_balance = 0) OR (stv.t IN (SELECT owner FROM eligible_earn_accounts)))
           ) u
          GROUP BY u.f, u.t
        ), filtered_window_transfers AS (
         SELECT wt_1.f,
            wt_1.t,
            wt_1.transfer_sum
           FROM window_transfers wt_1
           WHERE wt_1.f IN (SELECT sa.address_bytes FROM sender_accounts sa)
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

RESET lock_timeout;