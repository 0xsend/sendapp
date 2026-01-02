drop materialized view if exists "private"."send_scores_history";

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
            -- Send Check claims (SEND token only)
            SELECT
                scc.redeemer AS t,
                scc.amount AS v,
                scc.block_time
            FROM send_check_claimed scc
            WHERE scc.sender = addr
            AND scc.block_time >= sc.start_time
            AND scc.block_time <= sc.end_time
            AND scc.token = '\xeab49138ba2ea6dd776220fe26b7b8e446638956'::bytea
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
           FROM (send_check_claimed scc
             CROSS JOIN bounds)
          WHERE ((scc.block_time >= bounds.min_start) AND (scc.block_time <= bounds.max_end) AND (scc.token = '\xeab49138ba2ea6dd776220fe26b7b8e446638956'::bytea) AND (scc.redeemer <> scc.sender))
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



CREATE INDEX idx_send_check_claimed_redeemer_time ON public.send_check_claimed USING btree (redeemer, block_time, token) WHERE (redeemer <> sender);

CREATE INDEX idx_send_check_claimed_scores_composite ON public.send_check_claimed USING btree (token, block_time, sender, redeemer) WHERE (redeemer <> sender);

CREATE INDEX idx_send_check_claimed_send_token_only ON public.send_check_claimed USING btree (block_time DESC, sender, redeemer) WHERE ((token = '\xeab49138ba2ea6dd776220fe26b7b8e446638956'::bytea) AND (redeemer <> sender));

CREATE UNIQUE INDEX send_scores_history_user_id_distribution_id_idx ON private.send_scores_history USING btree (user_id, distribution_id);

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
                   FROM (send_check_claimed scc
                     CROSS JOIN dws dws_1)
                  WHERE ((scc.block_time >= dws_1.start_time) AND (scc.block_time <= dws_1.end_time) AND (scc.token = '\xeab49138ba2ea6dd776220fe26b7b8e446638956'::bytea) AND (scc.redeemer <> scc.sender))) all_senders
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
                   FROM (send_check_claimed scc
                     CROSS JOIN dws dws_1)
                  WHERE ((scc.block_time >= dws_1.start_time) AND (scc.block_time <= dws_1.end_time) AND (scc.token = '\xeab49138ba2ea6dd776220fe26b7b8e446638956'::bytea) AND (scc.redeemer <> scc.sender) AND (scc.sender IN ( SELECT sender_accounts.address_bytes
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



