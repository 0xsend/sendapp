-- distribution_shares_live.sql
-- Live, DB-driven computation of distribution_shares for the active distribution only.
-- Fixed-point numeric arithmetic (18 decimals) where relevant; exact ease-in-out curve preserved.
-- References:
--  - send_scores views: supabase/schemas/views/send_scores.sql
--  - verification triggers & functions: supabase/schemas/distribution_verifications.sql
--  - weighting curve: apps/distributor/src/weights.ts (cubic Bezier P1=0.10, P2=0.90)

CREATE OR REPLACE FUNCTION public.active_distribution_id()
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id
  FROM distributions
  WHERE (now() AT TIME ZONE 'UTC') >= qualification_start
    AND (now() AT TIME ZONE 'UTC') <  qualification_end
  ORDER BY qualification_start DESC
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.cubic_bezier_multiplier(
  rank integer,
  total integer,
  p1 numeric DEFAULT 0.10,
  p2 numeric DEFAULT 0.90
) RETURNS numeric
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  t   numeric;
  it  numeric;
  res numeric;
BEGIN
  IF total IS NULL OR total <= 1 OR rank IS NULL OR rank <= 1 THEN
    RETURN 0.000000000000000001; -- epsilon to avoid zeroing total weight
  END IF;
  t := (rank - 1)::numeric / GREATEST(total - 1, 1)::numeric;
  IF t < 0 THEN t := 0; END IF; IF t > 1 THEN t := 1; END IF;
  it := 1 - t;
  res := 3*it*it*t*p1 + 3*it*t*t*p2 + t*t*t*1.0;
  RETURN res;
END;
$$;

CREATE OR REPLACE FUNCTION public.compute_active_distribution_shares(mode text DEFAULT 'ease_in_out')
RETURNS TABLE (
  distribution_id integer,
  user_id uuid,
  address citext,
  hodler_pool_amount numeric,
  fixed_pool_amount numeric,
  bonus_pool_amount numeric,
  amount numeric
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  sql text;
BEGIN
  sql := $q$
WITH d AS (
  SELECT d.id, d.number, d.amount::numeric AS dist_amt, d.hodler_min_balance::numeric AS hodler_min,
         d.earn_min_balance::numeric AS earn_min, d.chain_id, d.qualification_start, d.qualification_end
  FROM distributions d
  WHERE d.id = active_distribution_id()
), s AS (
  SELECT ss.minimum_sends::numeric AS min_sends, ss.scaling_divisor::numeric AS scaling_div
  FROM send_slash ss
  JOIN d ON ss.distribution_id = d.id
), dv_bal AS (
  SELECT sa.user_id,
         lower(sa.address)::citext AS address,
         dv.weight::numeric AS bal
  FROM d
  JOIN distribution_verifications dv
    ON dv.distribution_id = d.id
   AND dv.type = 'send_token_hodler'::verification_type
  JOIN send_accounts sa ON sa.user_id = dv.user_id
), min_bal AS (
  SELECT * FROM dv_bal WHERE bal >= (SELECT hodler_min FROM d)
), earn_ok AS (
  SELECT m.user_id
  FROM min_bal m
  JOIN send_accounts sa ON sa.user_id = m.user_id AND sa.address = m.address
  JOIN d ON TRUE
  WHERE (SELECT earn_min FROM d) = 0 OR EXISTS (
    SELECT 1
    FROM send_earn_balances_timeline ebt
    WHERE ebt.owner = decode(replace(sa.address::text, '0x',''),'hex')
      AND ebt.assets::numeric >= (SELECT earn_min FROM d)
      AND ebt.block_time <= EXTRACT(EPOCH FROM now() AT TIME ZONE 'UTC')
  )
), qualifying AS (
  SELECT m.user_id, m.address, m.bal
  FROM min_bal m JOIN earn_ok e USING(user_id)
), sc AS (
  SELECT ss.user_id, ss.score::numeric AS score, ss.send_ceiling::numeric AS send_ceiling
  FROM send_scores ss JOIN d ON ss.distribution_id = d.id
), ratio AS (
  SELECT q.user_id, q.address, q.bal,
         COALESCE(sc.score,0) AS score,
         COALESCE(sc.send_ceiling,0) AS send_ceiling,
         CASE WHEN (COALESCE(sc.send_ceiling,0) * (SELECT min_sends FROM s)) > 0
              THEN LEAST(
                COALESCE(sc.score,0) / NULLIF(COALESCE(sc.send_ceiling,0) * (SELECT min_sends FROM s), 0),
                1
              )
              ELSE 0 END AS slash_pct
  FROM qualifying q LEFT JOIN sc ON sc.user_id = q.user_id
), slashed AS (
  SELECT user_id, address, bal, slash_pct, (bal * slash_pct) AS slashed_bal
  FROM ratio
  WHERE slash_pct > 0
), ranked AS (
  SELECT user_id, address, bal, slash_pct, slashed_bal,
         row_number() OVER (ORDER BY slashed_bal NULLS LAST, address) AS rk,
         count(*)      OVER ()                                    AS cnt
  FROM slashed
), weights AS (
  SELECT user_id, address, bal, slash_pct, slashed_bal, rk, cnt,
    CASE
      WHEN lower(%L) = 'linear' THEN slashed_bal
      WHEN lower(%L) = 'logarithmic' THEN
        CASE WHEN (SELECT SUM(s2.slashed_bal) FROM slashed s2) > 0
             THEN ln(1 + slashed_bal / (SELECT SUM(s2.slashed_bal) FROM slashed s2))
             ELSE 0 END
      WHEN lower(%L) = 'square_root' THEN
        CASE WHEN (SELECT SUM(s2.slashed_bal) FROM slashed s2) > 0
             THEN sqrt(GREATEST(0::numeric, 1 - slashed_bal / (SELECT SUM(s2.slashed_bal) FROM slashed s2)))
             ELSE 0 END
      WHEN lower(%L) = 'exponential' THEN
        CASE WHEN (SELECT SUM(s2.slashed_bal) FROM slashed s2) > 0
             THEN exp( -0.005 * cnt * (slashed_bal / (SELECT SUM(s2.slashed_bal) FROM slashed s2)) )
             ELSE 0 END
      ELSE -- ease_in_out (default)
        slashed_bal * cubic_bezier_multiplier(rk, cnt)
    END AS pool_weight
  FROM ranked
), totals AS (
  SELECT COALESCE(SUM(pool_weight),0) AS total_weight FROM weights
), time_calc AS (
  SELECT d.id AS distribution_id, d.dist_amt,
         LEAST(now() AT TIME ZONE 'UTC', d.qualification_end) AS curr_ts
  FROM d
), time_parts AS (
  SELECT distribution_id, dist_amt, curr_ts,
         date_trunc('month', curr_ts)                          AS m_start,
         date_trunc('month', curr_ts) + interval '1 month'     AS m_next
  FROM time_calc
), time_ratio AS (
  SELECT distribution_id, dist_amt,
         EXTRACT(EPOCH FROM (curr_ts - m_start)) / EXTRACT(EPOCH FROM (m_next - m_start)) AS month_ratio
  FROM time_parts
), init_time AS (
  SELECT distribution_id, dist_amt, GREATEST(LEAST(month_ratio,1),0) AS ratio,
         dist_amt * GREATEST(LEAST(month_ratio,1),0)                  AS time_adj_full
  FROM time_ratio
), init_shares AS (
  SELECT w.user_id, w.address,
         CASE WHEN (SELECT total_weight FROM totals) > 0
              THEN (w.pool_weight / (SELECT total_weight FROM totals)) * (SELECT time_adj_full FROM init_time)
              ELSE 0 END AS init_hodler_share
  FROM weights w
), dvv AS (
  SELECT type, fixed_value::numeric AS fixed_value, bips_value::numeric AS bips_value,
         multiplier_min::numeric AS mult_min, multiplier_max::numeric AS mult_max, multiplier_step::numeric AS mult_step
  FROM distribution_verification_values
  WHERE distribution_id = (SELECT id FROM d)
), dv AS (
  SELECT user_id, type, weight::numeric AS weight, metadata
  FROM distribution_verifications
  WHERE distribution_id = (SELECT id FROM d)
), verified_referrals AS (
  SELECT r.referrer_id AS user_id, r.referred_id
  FROM referrals r
  JOIN d ON TRUE
  JOIN profiles p ON p.id = r.referred_id
  WHERE public.verified_at(p) IS NOT NULL
    AND r.created_at <= d.qualification_end
    AND r.created_at >= d.qualification_start
), fixed_base AS (
  SELECT w.user_id,
         COALESCE(SUM(
           CASE
             WHEN v.type IN ('create_passkey','tag_registration','send_ten','send_one_hundred')
               THEN COALESCE(val.fixed_value,0) * COALESCE(v.weight,0)
             ELSE 0
           END
         ),0) +
         COALESCE(
           (SELECT COALESCE(val2.fixed_value,0) * COUNT(*)
            FROM verified_referrals vr
            JOIN dvv val2 ON val2.type = 'tag_referral' AND val2.fixed_value IS NOT NULL AND val2.fixed_value > 0
            WHERE vr.user_id = w.user_id
           ),0) AS base_fixed
  FROM weights w
  LEFT JOIN dv v ON v.user_id = w.user_id AND v.type IN ('create_passkey','tag_registration','send_ten','send_one_hundred')
  LEFT JOIN dvv val ON val.type = v.type
  GROUP BY w.user_id
), multiplier_factors AS (
  SELECT w.user_id,
         CASE WHEN (SELECT mult_step FROM dvv WHERE type='send_streak') IS NOT NULL THEN
           LEAST(
             COALESCE((SELECT mult_min FROM dvv WHERE type='send_streak'),1.0) +
             GREATEST(COALESCE((SELECT v.weight FROM dv v WHERE v.user_id = w.user_id AND v.type='send_streak'),0)-1,0) *
             COALESCE((SELECT mult_step FROM dvv WHERE type='send_streak'),0),
             COALESCE((SELECT mult_max FROM dvv WHERE type='send_streak'),1.0)
           )
         ELSE NULL END AS m_send_streak,
         CASE WHEN (SELECT mult_step FROM dvv WHERE type='total_tag_referrals') IS NOT NULL THEN
           LEAST(
             COALESCE((SELECT mult_min FROM dvv WHERE type='total_tag_referrals'),1.0) +
             GREATEST((SELECT COUNT(*) FROM verified_referrals vr WHERE vr.user_id = w.user_id)-1,0) *
             COALESCE((SELECT mult_step FROM dvv WHERE type='total_tag_referrals'),0),
             COALESCE((SELECT mult_max FROM dvv WHERE type='total_tag_referrals'),1.0)
           )
         ELSE NULL END AS m_total_ref
  FROM weights w
), multiplier_product AS (
  SELECT user_id,
         COALESCE(
           exp(sum(ln(GREATEST(m, 1.0))))
           , 1.0
         ) AS final_mult
  FROM (
    SELECT user_id, m_send_streak AS m FROM multiplier_factors WHERE m_send_streak IS NOT NULL
    UNION ALL
    SELECT user_id, m_total_ref  AS m FROM multiplier_factors WHERE m_total_ref  IS NOT NULL
  ) t
  GROUP BY user_id
), fixed_calc AS (
  SELECT w.user_id,
         COALESCE(f.base_fixed,0) * COALESCE(mp.final_mult,1.0)                AS fixed_after_mult,
         COALESCE((SELECT score FROM sc WHERE sc.user_id = w.user_id),0)       AS score,
         COALESCE((SELECT init_hodler_share FROM init_shares ih WHERE ih.user_id = w.user_id),0) AS init_hodler_share,
         COALESCE((SELECT slash_pct FROM ratio r WHERE r.user_id = w.user_id LIMIT 1),0)         AS slash_pct
  FROM weights w
  LEFT JOIN fixed_base f ON f.user_id = w.user_id
  LEFT JOIN multiplier_product mp ON mp.user_id = w.user_id
), fixed_final AS (
  SELECT user_id,
         LEAST(
           (fixed_after_mult * slash_pct),
           (init_hodler_share + score)
         ) AS fixed_pool_amount
  FROM fixed_calc
), fixed_totals AS (
  SELECT COALESCE(SUM(fixed_pool_amount),0) AS fixed_allocated
  FROM fixed_final
), hodler_time AS (
  SELECT (SELECT distribution_id FROM init_time) AS distribution_id,
         GREATEST( (SELECT dist_amt FROM d) - (SELECT fixed_allocated FROM fixed_totals), 0) AS hodler_pool_available,
         (SELECT ratio FROM init_time) AS ratio
), hodler_time_amt AS (
  SELECT distribution_id,
         hodler_pool_available,
         ratio,
         hodler_pool_available * ratio AS time_adj_hodler
  FROM hodler_time
), hodler_alloc AS (
  SELECT w.user_id, w.address,
         CASE WHEN (SELECT total_weight FROM totals) > 0
              THEN (w.pool_weight / (SELECT total_weight FROM totals)) * (SELECT time_adj_hodler FROM hodler_time_amt)
              ELSE 0 END AS hodler_pool_amount
  FROM weights w
)
SELECT
  (SELECT id FROM d)                   AS distribution_id,
  h.user_id,
  h.address,
  COALESCE(ha.hodler_pool_amount,0)   AS hodler_pool_amount,
  COALESCE(ff.fixed_pool_amount,0)    AS fixed_pool_amount,
  0                                   AS bonus_pool_amount,
  COALESCE(ha.hodler_pool_amount,0) + COALESCE(ff.fixed_pool_amount,0) AS amount
FROM weights w
JOIN (
  SELECT DISTINCT user_id, address FROM weights
) h ON h.user_id = w.user_id AND h.address = w.address
LEFT JOIN hodler_alloc ha ON ha.user_id = h.user_id AND ha.address = h.address
LEFT JOIN fixed_final ff   ON ff.user_id = h.user_id
WHERE (COALESCE(ha.hodler_pool_amount,0) + COALESCE(ff.fixed_pool_amount,0)) > 0
ORDER BY amount DESC, address ASC
$q$;

  RETURN QUERY EXECUTE format(sql, mode, mode, mode, mode);
END;
$fn$;

CREATE OR REPLACE VIEW public.active_distribution_shares AS
SELECT * FROM public.compute_active_distribution_shares('ease_in_out');

CREATE OR REPLACE VIEW public.user_active_distribution_share AS
SELECT *
FROM public.compute_active_distribution_shares('ease_in_out') s
WHERE s.user_id = auth.uid();

REVOKE ALL ON FUNCTION public.active_distribution_id() FROM PUBLIC;
GRANT ALL ON FUNCTION public.active_distribution_id() TO service_role;

REVOKE ALL ON FUNCTION public.cubic_bezier_multiplier(integer, integer, numeric, numeric) FROM PUBLIC;
GRANT ALL ON FUNCTION public.cubic_bezier_multiplier(integer, integer, numeric, numeric) TO service_role;

REVOKE ALL ON FUNCTION public.compute_active_distribution_shares(text) FROM PUBLIC;
GRANT ALL ON FUNCTION public.compute_active_distribution_shares(text) TO authenticated;
GRANT ALL ON FUNCTION public.compute_active_distribution_shares(text) TO service_role;

ALTER VIEW public.active_distribution_shares OWNER TO postgres;
ALTER VIEW public.user_active_distribution_share OWNER TO postgres;
REVOKE ALL ON public.active_distribution_shares FROM PUBLIC;
REVOKE ALL ON public.user_active_distribution_share FROM PUBLIC;
GRANT SELECT ON public.active_distribution_shares TO anon;
GRANT SELECT ON public.active_distribution_shares TO authenticated;
GRANT SELECT ON public.active_distribution_shares TO service_role;
GRANT SELECT ON public.user_active_distribution_share TO authenticated;
GRANT SELECT ON public.user_active_distribution_share TO service_role;
