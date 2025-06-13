drop trigger if exists "after_transfer_update_affiliate_stats" on "public"."send_token_transfers";

drop function if exists "public"."update_affiliate_stats_on_transfer"();

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.insert_verification_send_ceiling()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    score_record RECORD;
BEGIN
    -- Exit early if value is not positive
    IF NOT (NEW.v > 0) THEN
        RETURN NEW;
    END IF;

    -- Get send_scores_current result once
    SELECT ss.distribution_id, ss.user_id, ss.score, ss.send_ceiling
    INTO score_record
    FROM send_scores_current ss
    JOIN send_accounts sa ON sa.user_id = ss.user_id
    WHERE sa.address = concat('0x', encode(NEW.f, 'hex'))::citext;

    -- Early exit if no score found
    IF NOT FOUND THEN
        RETURN NEW;
    END IF;

    -- Try to update existing verification
    UPDATE distribution_verifications dv
    SET weight = score_record.score,
        metadata = jsonb_build_object('value', score_record.send_ceiling::text)
    WHERE dv.user_id = score_record.user_id
        AND dv.distribution_id = score_record.distribution_id
        AND dv.type = 'send_ceiling';

    -- If no row was updated, insert new verification
    IF NOT FOUND THEN
        INSERT INTO distribution_verifications(
            distribution_id,
            user_id,
            type,
            weight,
            metadata
        )
        VALUES (
            score_record.distribution_id,
            score_record.user_id,
            'send_ceiling',
            score_record.score,
            jsonb_build_object('value', score_record.send_ceiling::text)
        );
    END IF;

    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error in insert_verification_send_ceiling: %', SQLERRM;
        RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.insert_verification_sends()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    score_record RECORD;
BEGIN
    -- Calculate send_scores_current only once by getting the score for this sender
    SELECT ss.distribution_id, ss.user_id, ss.unique_sends
    INTO score_record
    FROM send_scores_current ss
    JOIN send_accounts sa ON sa.user_id = ss.user_id
    WHERE sa.address = concat('0x', encode(NEW.f, 'hex'))::citext;

    -- Early exit if no score found
    IF NOT FOUND THEN
        RETURN NEW;
    END IF;

    -- Update existing verifications
    UPDATE public.distribution_verifications dv
    SET metadata = jsonb_build_object('value', score_record.unique_sends),
        weight = CASE
            WHEN dv.type = 'send_ten' AND score_record.unique_sends >= 10 THEN 1
            WHEN dv.type = 'send_one_hundred' AND score_record.unique_sends >= 100 THEN 1
            ELSE 0
        END,
        created_at = to_timestamp(NEW.block_time) at time zone 'UTC'
    WHERE dv.distribution_id = score_record.distribution_id
        AND dv.user_id = score_record.user_id
        AND dv.type IN ('send_ten', 'send_one_hundred');

    -- Insert new verifications if they don't exist
    INSERT INTO public.distribution_verifications(
        distribution_id,
        user_id,
        type,
        metadata,
        weight,
        created_at
    )
    SELECT
        score_record.distribution_id,
        score_record.user_id,
        v.type,
        jsonb_build_object('value', score_record.unique_sends),
        CASE
            WHEN v.type = 'send_ten' AND score_record.unique_sends >= 10 THEN 1
            WHEN v.type = 'send_one_hundred' AND score_record.unique_sends >= 100 THEN 1
            ELSE 0
        END,
        to_timestamp(NEW.block_time) at time zone 'UTC'
    FROM (
        VALUES
            ('send_ten'::verification_type),
            ('send_one_hundred'::verification_type)
    ) v(type)
    WHERE NOT EXISTS (
        SELECT 1
        FROM distribution_verifications dv
        WHERE dv.user_id = score_record.user_id
            AND dv.distribution_id = score_record.distribution_id
            AND dv.type = v.type
    );

    RETURN NEW;
END;
$function$
;

create or replace view "public"."send_scores_current" as  WITH distributions_with_score AS (
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
        ), adjusted_amounts AS (
         SELECT ds.user_id,
                CASE
                    WHEN (d.token_addr = '\x3f14920c99beb920afa163031c4e47a3e03b3e4a'::bytea) THEN (ds.amount * '10000000000000000'::numeric)
                    ELSE ds.amount
                END AS adjusted_amount
           FROM ((base_ceiling bc
             JOIN distribution_shares ds ON ((ds.distribution_id = bc.prev_distribution_id)))
             JOIN distributions d ON ((d.id = ds.distribution_id)))
        ), send_ceiling_settings AS (
         SELECT sa.user_id,
            decode(replace(sa.address, '0x'::citext, ''::citext), 'hex'::text) AS address,
            bc.distribution_id,
            round((COALESCE(aa.adjusted_amount, bc.base_amount) / ((bc.minimum_sends * bc.scaling_divisor))::numeric)) AS send_ceiling
           FROM ((base_ceiling bc
             CROSS JOIN send_accounts sa)
             LEFT JOIN adjusted_amounts aa ON ((aa.user_id = sa.user_id)))
        ), earn_balance_data AS (
         SELECT send_earn_deposit.owner,
            send_earn_deposit.block_time,
            send_earn_deposit.assets AS balance
           FROM send_earn_deposit
        UNION ALL
         SELECT send_earn_withdraw.owner,
            send_earn_withdraw.block_time,
            (- send_earn_withdraw.assets) AS balance
           FROM send_earn_withdraw
        ), earn_balances AS (
         SELECT sub.owner,
            sub.block_time,
            sub.balance,
            sub.next_block_time
           FROM ( SELECT earn_balance_data.owner,
                    earn_balance_data.block_time,
                    sum(earn_balance_data.balance) OVER w AS balance,
                    lead(earn_balance_data.block_time) OVER w AS next_block_time
                   FROM earn_balance_data
                  WINDOW w AS (PARTITION BY earn_balance_data.owner ORDER BY earn_balance_data.block_time ROWS UNBOUNDED PRECEDING)) sub
          WHERE (sub.balance >= (( SELECT base_ceiling.earn_min_balance
                   FROM base_ceiling))::numeric)
        ), transfer_sums AS (
         SELECT transfers.f,
            bc.distribution_id,
            transfers.t,
            sum(transfers.v) AS transfer_sum
           FROM (base_ceiling bc
             CROSS JOIN LATERAL ( SELECT send_token_transfers.f,
                    send_token_transfers.t,
                    send_token_transfers.v,
                    send_token_transfers.block_time
                   FROM send_token_transfers
                  WHERE ((send_token_transfers.block_time >= bc.start_time) AND (send_token_transfers.block_time <= bc.end_time))
                UNION ALL
                 SELECT send_token_v0_transfers.f,
                    send_token_v0_transfers.t,
                    (send_token_v0_transfers.v * '10000000000000000'::numeric),
                    send_token_v0_transfers.block_time
                   FROM send_token_v0_transfers
                  WHERE ((send_token_v0_transfers.block_time >= bc.start_time) AND (send_token_v0_transfers.block_time <= bc.end_time))) transfers)
          WHERE ((bc.earn_min_balance = 0) OR (EXISTS ( SELECT 1
                   FROM earn_balances eb
                  WHERE ((eb.owner = transfers.t) AND (eb.block_time <= transfers.block_time) AND ((eb.next_block_time IS NULL) OR (transfers.block_time < eb.next_block_time))))))
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

CREATE OR REPLACE FUNCTION public.insert_send_streak_verifications(distribution_num integer)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
    -- Perform the entire operation within a single function
    WITH distribution_info AS (
        SELECT
            id,
            qualification_start,
            qualification_end
        FROM
            distributions
        WHERE
            "number" = distribution_num
        LIMIT 1
    ),
    daily_transfers AS (
        SELECT
            sa.user_id,
            DATE(to_timestamp(stt.block_time) AT TIME ZONE 'UTC') AS transfer_date,
            COUNT(DISTINCT stt.t) AS unique_recipients
        FROM
            send_token_transfers stt
            JOIN send_accounts sa ON sa.address = CONCAT('0x', ENCODE(stt.f, 'hex'))::CITEXT
        WHERE
            stt.block_time >= EXTRACT(EPOCH FROM (
                SELECT
                    qualification_start
                FROM distribution_info))
            AND stt.block_time < EXTRACT(EPOCH FROM (
                SELECT
                    qualification_end
                FROM distribution_info))
        GROUP BY
            sa.user_id,
            DATE(to_timestamp(stt.block_time) AT TIME ZONE 'UTC')
    ),
    streaks AS (
        SELECT
            user_id,
            transfer_date,
            unique_recipients,
            transfer_date - (ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY transfer_date))::INTEGER AS streak_group
        FROM
            daily_transfers
        WHERE
            unique_recipients > 0
    ),
    max_streaks AS (
        SELECT
            user_id,
            MAX(streak_length) AS max_streak_length
        FROM (
            SELECT
                user_id,
                streak_group,
                COUNT(*) AS streak_length
            FROM
                streaks
            GROUP BY
                user_id,
                streak_group) AS streak_lengths
        GROUP BY
            user_id
    )
    INSERT INTO public.distribution_verifications(
        distribution_id,
        user_id,
        type,
        created_at,
        weight
    )
    SELECT
        (
            SELECT
                id
            FROM
                distribution_info),
        ms.user_id,
        'send_streak'::public.verification_type,
        (SELECT NOW() AT TIME ZONE 'UTC'),
        ms.max_streak_length
    FROM
        max_streaks ms
    WHERE
        ms.max_streak_length > 0;
END;
$function$
;

create or replace view "public"."send_scores_current_unique" as  WITH active_distribution AS (
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
  WHERE (LEAST(
        CASE
            WHEN (subq.earn_balance IS NULL) THEN subq.v
            WHEN (subq.earn_balance >= (( SELECT active_distribution.earn_min_balance
               FROM active_distribution))::numeric) THEN subq.v
            ELSE (0)::numeric
        END, subq.send_ceiling) > (0)::numeric)
  GROUP BY subq.from_user_id, subq.to_user_id;