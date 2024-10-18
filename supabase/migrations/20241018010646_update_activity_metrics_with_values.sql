DROP VIEW IF EXISTS "public"."distribution_verifications_summary";

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
  MAX(bc.total_referrals)::bigint AS total_tag_referrals,
  jsonb_object_agg(bc.type, jsonb_build_object('count', bc.type_count, 'fixed_value', dvv.fixed_value, 'bips_value', dvv.bips_value)) AS verification_values,
  jsonb_object_agg(bc.type, jsonb_build_object('value', CASE WHEN bc.type_count = 0 THEN
        1
      WHEN bc.type = 'total_tag_referrals'::public.verification_type THEN
        LEAST(dvv.multiplier_min +((bc.total_referrals) * dvv.multiplier_step), dvv.multiplier_max)
    ELSE
      LEAST(dvv.multiplier_min +((bc.type_count - 1) * dvv.multiplier_step), dvv.multiplier_max)
      END, 'multiplier_min', dvv.multiplier_min, 'multiplier_max', dvv.multiplier_max, 'multiplier_step', dvv.multiplier_step)) AS multipliers
FROM
  base_counts bc
  JOIN distribution_verification_values dvv ON bc.distribution_id = dvv.distribution_id
    AND bc.type = dvv.type
GROUP BY
  bc.distribution_id,
  bc.user_id;

