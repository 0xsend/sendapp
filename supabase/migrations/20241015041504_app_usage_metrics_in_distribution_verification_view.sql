CREATE OR REPLACE VIEW "public"."distribution_verifications_summary" WITH ( security_barrier
) AS
WITH base_counts AS (
  SELECT
    distribution_id,
    user_id,
    type,
    count(*) AS type_count,
    MAX(
      CASE WHEN type = 'total_tag_referrals'::public.verification_type THEN
        (metadata ->> 'value')::int
      ELSE
        NULL
      END) AS total_referrals
  FROM
    distribution_verifications
  WHERE
    user_id = auth.uid()
  GROUP BY
    distribution_id,
    user_id,
    type
)
SELECT
  bc.distribution_id,
  bc.user_id,
  SUM(
    CASE WHEN bc.type = 'tag_registration'::public.verification_type THEN
      bc.type_count
    ELSE
      0
    END)::bigint AS tag_registrations,
  SUM(
    CASE WHEN bc.type = 'tag_referral'::public.verification_type THEN
      bc.type_count
    ELSE
      0
    END)::bigint AS tag_referrals,
  MAX(bc.total_referrals)::bigint AS total_referrals,
  BOOL_OR(bc.type = 'send_ten'::public.verification_type) AS has_send_ten,
  BOOL_OR(bc.type = 'send_one_hundred'::public.verification_type) AS has_send_one_hundred,
  BOOL_OR(bc.type = 'create_passkey'::public.verification_type) AS has_create_passkey,
  jsonb_object_agg(bc.type, jsonb_build_object('value', CASE WHEN bc.type_count = 0 THEN
        0
      ELSE
        -- @todo double check that when count = 1, this value = min
        LEAST(dvv.multiplier_min +(bc.type_count - 1) * dvv.multiplier_step, dvv.multiplier_max)
      END, 'multiplier_min', dvv.multiplier_min, 'multiplier_max', dvv.multiplier_max, 'multiplier_step', dvv.multiplier_step)) AS multipliers
FROM
  base_counts bc
  JOIN distribution_verification_values dvv ON bc.distribution_id = dvv.distribution_id
    AND bc.type = dvv.type
GROUP BY
  bc.distribution_id,
  bc.user_id
