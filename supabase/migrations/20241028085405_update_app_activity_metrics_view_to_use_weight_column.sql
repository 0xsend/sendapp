DROP VIEW IF EXISTS "public"."distribution_verifications_summary";

CREATE TYPE multiplier_info AS (
  type TEXT,
  value numeric,
  multiplier_min numeric,
  multiplier_max numeric,
  multiplier_step numeric,
  metadata jsonb
);

CREATE TYPE verification_value_info AS (
  type TEXT,
  weight bigint,
  fixed_value numeric,
  bips_value numeric,
  metadata jsonb
);

CREATE OR REPLACE VIEW "public"."distribution_verifications_summary" WITH ( security_barrier
) AS
WITH base_counts AS (
  SELECT
    dv.distribution_id,
    dv.user_id,
    dv.type,
    SUM(dv.weight) AS total_weight,
    dv.metadata
  FROM
    distribution_verifications dv
    LEFT JOIN distribution_verification_values dvv ON dvv.distribution_id = dv.distribution_id
      AND dvv.type = dv.type
  WHERE
    dv.user_id = auth.uid()
  GROUP BY
    dv.distribution_id,
    dv.user_id,
    dv.type,
    dv.metadata
)
SELECT
  dvv.distribution_id,
  COALESCE(bc.user_id, auth.uid()) AS user_id,
  array_agg(ROW (dvv.type, COALESCE(bc.total_weight, 0), dvv.fixed_value, dvv.bips_value, COALESCE(bc.metadata, '{}'::jsonb))::verification_value_info) AS verification_values,
  array_agg(ROW (dvv.type, CASE WHEN (COALESCE(dvv.multiplier_min, 1.0) = 1.0
        AND COALESCE(dvv.multiplier_max, 1.0) = 1.0
        AND COALESCE(dvv.multiplier_step, 0.0) = 0.0)
        OR bc.total_weight = 0 THEN
        NULL
      ELSE
        LEAST(dvv.multiplier_min +((COALESCE(bc.total_weight, 1) - 1) * dvv.multiplier_step), dvv.multiplier_max)
      END, dvv.multiplier_min, dvv.multiplier_max, dvv.multiplier_step, COALESCE(bc.metadata, '{}'::jsonb))::multiplier_info) AS multipliers
FROM
  distribution_verification_values dvv
  LEFT JOIN base_counts bc ON bc.distribution_id = dvv.distribution_id
    AND bc.type = dvv.type
GROUP BY
  dvv.distribution_id,
  COALESCE(bc.user_id, auth.uid());

