set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.get_send_scores_history()
 RETURNS TABLE(user_id uuid, distribution_id integer, score numeric, unique_sends bigint, send_ceiling numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$

BEGIN
    -- Admin callers (postgres, service_role) see all scores
    IF current_user IN ('postgres', 'service_role') THEN
        RETURN QUERY SELECT * FROM private.send_scores_history;
    -- Authenticated users see only their own scores
    ELSIF auth.role() = 'authenticated' AND auth.uid() IS NOT NULL THEN
        RETURN QUERY SELECT * FROM private.send_scores_history WHERE send_scores_history.user_id = auth.uid();
    -- Anonymous/other callers see nothing
    ELSE
        RETURN;
    END IF;
END;
$function$
;


create or replace view "public"."send_scores_current" as  WITH authorized_accounts AS (
         SELECT sa.user_id,
            decode(replace((sa.address)::text, ('0x'::citext)::text, ''::text), 'hex'::text) AS address_bytes
           FROM send_accounts sa
          WHERE
                CASE
                    -- Admin callers (postgres, service_role) see all scores
                    WHEN current_user IN ('postgres', 'service_role') THEN true
                    -- Authenticated users see only their own scores
                    WHEN auth.role() = 'authenticated' AND auth.uid() IS NOT NULL THEN (sa.user_id = auth.uid())
                    -- Anonymous/other callers see nothing
                    ELSE false
                END
        ), distributions_with_score AS (
         SELECT d.id,
            d.number,
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
        ), base_ceiling AS (
         SELECT dws.id AS distribution_id,
                CASE
                    WHEN (dws.token_addr = '\x3f14920c99beb920afa163031c4e47a3e03b3e4a'::bytea) THEN (dws.hodler_min_balance * '10000000000000000'::numeric)
                    ELSE dws.hodler_min_balance
                END AS base_amount,
            dws.minimum_sends,
            dws.scaling_divisor,
            dws.prev_distribution_id,
            dws.earn_min_balance,
            dws.start_time,
            dws.end_time
           FROM distributions_with_score dws
        ), authorized_distribution_shares AS (
         SELECT ds.user_id,
                CASE
                    WHEN (d.token_addr = '\x3f14920c99beb920afa163031c4e47a3e03b3e4a'::bytea) THEN (ds.amount * '10000000000000000'::numeric)
                    ELSE ds.amount
                END AS adjusted_amount
           FROM (((base_ceiling bc
             JOIN distribution_shares ds ON ((ds.distribution_id = bc.prev_distribution_id)))
             JOIN distributions d ON ((d.id = ds.distribution_id)))
             JOIN authorized_accounts aa ON ((aa.user_id = ds.user_id)))
        ), send_ceiling_settings AS (
         SELECT aa.user_id,
            aa.address_bytes AS address,
            bc.distribution_id,
            round((COALESCE(ads.adjusted_amount, bc.base_amount) / ((bc.minimum_sends * bc.scaling_divisor))::numeric)) AS send_ceiling
           FROM ((base_ceiling bc
             CROSS JOIN authorized_accounts aa)
             LEFT JOIN authorized_distribution_shares ads ON ((ads.user_id = aa.user_id)))
        ), earn_balances_timeline AS (
         SELECT earn_data.owner,
            earn_data.block_time,
            sum(earn_data.balance) OVER w AS balance,
            lead(earn_data.block_time) OVER w AS next_block_time
           FROM ( SELECT send_earn_deposit.owner,
                    send_earn_deposit.block_time,
                    send_earn_deposit.assets AS balance
                   FROM send_earn_deposit
                UNION ALL
                 SELECT send_earn_withdraw.owner,
                    send_earn_withdraw.block_time,
                    (- send_earn_withdraw.assets)
                   FROM send_earn_withdraw) earn_data
          WINDOW w AS (PARTITION BY earn_data.owner ORDER BY earn_data.block_time ROWS UNBOUNDED PRECEDING)
        ), eligible_earn_accounts AS (
         SELECT DISTINCT ebt.owner
           FROM (earn_balances_timeline ebt
             CROSS JOIN base_ceiling bc)
          WHERE (ebt.balance >= (bc.earn_min_balance)::numeric)
        ), transfer_sums AS (
         SELECT transfers.f,
            bc.distribution_id,
            transfers.t,
            sum(transfers.v) AS transfer_sum
           FROM (base_ceiling bc
             CROSS JOIN LATERAL ( SELECT stt.f,
                    stt.t,
                    stt.v,
                    stt.block_time
                   FROM (send_token_transfers stt
                     JOIN authorized_accounts aa ON ((aa.address_bytes = stt.f)))
                  WHERE ((stt.block_time >= bc.start_time) AND (stt.block_time <= bc.end_time))
                UNION ALL
                 SELECT stv.f,
                    stv.t,
                    (stv.v * '10000000000000000'::numeric),
                    stv.block_time
                   FROM (send_token_v0_transfers stv
                     JOIN authorized_accounts aa ON ((aa.address_bytes = stv.f)))
                  WHERE ((stv.block_time >= bc.start_time) AND (stv.block_time <= bc.end_time))) transfers)
          WHERE ((bc.earn_min_balance = 0) OR (transfers.t IN ( SELECT eligible_earn_accounts.owner
                   FROM eligible_earn_accounts)))
          GROUP BY transfers.f, bc.distribution_id, transfers.t
        )
 SELECT scs.user_id,
    scs.distribution_id,
    scores.score,
    scores.unique_sends,
    scs.send_ceiling
   FROM (( SELECT ts.f AS address,
            ts.distribution_id,
            sum(LEAST(ts.transfer_sum, scs_1.send_ceiling)) AS score,
            count(DISTINCT ts.t) AS unique_sends
           FROM (transfer_sums ts
             JOIN send_ceiling_settings scs_1 ON (((ts.f = scs_1.address) AND (ts.distribution_id = scs_1.distribution_id))))
          GROUP BY ts.f, ts.distribution_id
         HAVING (sum(LEAST(ts.transfer_sum, scs_1.send_ceiling)) > (0)::numeric)) scores
     JOIN send_ceiling_settings scs ON (((scores.address = scs.address) AND (scores.distribution_id = scs.distribution_id))));



create or replace view "public"."send_scores_current_unique" as  WITH access_control AS (
         SELECT
                CASE
                    WHEN (CURRENT_USER = ANY (ARRAY['postgres'::name, 'service_role'::name])) THEN true
                    WHEN ((auth.role() = 'authenticated'::text) AND (auth.uid() IS NOT NULL)) THEN false
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
                  WHERE (d.number = ( SELECT (active_distribution.number - 1)
                           FROM active_distribution))
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
                       FROM active_distribution) > 0) THEN COALESCE(( SELECT bt.balance
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