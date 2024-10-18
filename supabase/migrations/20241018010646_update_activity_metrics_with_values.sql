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
        0
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
  dvv.distribution_id,
  COALESCE(bc.user_id, auth.uid()) AS user_id,
  SUM(
    CASE WHEN dvv.type = 'tag_registration'::public.verification_type THEN
      COALESCE(bc.type_count, 0)
    ELSE
      0
    END)::bigint AS tag_registrations,
  SUM(
    CASE WHEN dvv.type = 'tag_referral'::public.verification_type THEN
      COALESCE(bc.type_count, 0)
    ELSE
      0
    END)::bigint AS tag_referrals,
  MAX(COALESCE(bc.total_referrals, 0))::bigint AS total_tag_referrals,
  jsonb_object_agg(dvv.type, jsonb_build_object('count', COALESCE(bc.type_count, 0), 'fixed_value', dvv.fixed_value, 'bips_value', dvv.bips_value)) AS verification_values,
  -- @todo set value to null if multiplier is unused
  jsonb_object_agg(dvv.type, jsonb_build_object('value', CASE WHEN COALESCE(bc.type_count, 0) = 0 THEN
        1
      WHEN dvv.type = 'total_tag_referrals'::public.verification_type THEN
        LEAST(dvv.multiplier_min +(COALESCE(bc.total_referrals, 0) * dvv.multiplier_step), dvv.multiplier_max)
      ELSE
        LEAST(dvv.multiplier_min +((COALESCE(bc.type_count, 0) - 1) * dvv.multiplier_step), dvv.multiplier_max)
      END, 'multiplier_min', dvv.multiplier_min, 'multiplier_max', dvv.multiplier_max, 'multiplier_step', dvv.multiplier_step)) AS multipliers
FROM
  distribution_verification_values dvv
  LEFT JOIN base_counts bc ON bc.distribution_id = dvv.distribution_id
    AND bc.type = dvv.type
GROUP BY
  dvv.distribution_id,
  COALESCE(bc.user_id, auth.uid());

