-- Update the distributions table to include the merkle drop address and token decimals
-- So that both send token v0 and send token v1 can use the same distributions table

-- undo the previous changes
--     alter table distributions
--         drop column merkle_drop_addr,
--         drop column token_decimals;

-- include the merkle drop contract address, and token decimals
-- update amount, and hodler_min_balance to use numeric format
alter table distributions
    add column merkle_drop_addr bytea,
    add column token_decimals   numeric,
    alter column amount type numeric,
    alter column hodler_min_balance type numeric;

-- drop the distribution_verifications_summary view (will be recreated)
drop view distribution_verifications_summary;

-- update distribution verification values to use numeric format
alter table distribution_verification_values
    alter column fixed_value type numeric;

-- Recreate the distribution verification summary view
create view distribution_verifications_summary(distribution_id, user_id, verification_values, multipliers) as
WITH base_counts AS (SELECT dv.distribution_id,
                            dv.user_id,
                            dv.type,
                            max(dv.created_at)     AS created_at,
                            sum(dv.weight)         AS total_weight,
                            jsonb_agg(dv.metadata) AS combined_metadata
                     FROM distribution_verifications dv
                              LEFT JOIN distribution_verification_values dvv_1
                                        ON dvv_1.distribution_id = dv.distribution_id AND dvv_1.type = dv.type
                     WHERE dv.user_id = auth.uid()
                     GROUP BY dv.distribution_id, dv.user_id, dv.type)
SELECT dvv.distribution_id,
       COALESCE(bc.user_id, auth.uid())                                                                                                                                                                                       AS user_id,
       array_agg(DISTINCT
                 ROW (dvv.type::text, COALESCE(bc.total_weight, 0::numeric)::bigint, dvv.fixed_value::numeric, dvv.bips_value::numeric, COALESCE(bc.combined_metadata, '[]'::jsonb), bc.created_at)::verification_value_info) AS verification_values,
       array_agg(DISTINCT ROW (dvv.type::text,
           CASE
               WHEN COALESCE(dvv.multiplier_min, 1.0) = 1.0 AND COALESCE(dvv.multiplier_max, 1.0) = 1.0 AND
                    COALESCE(dvv.multiplier_step, 0.0) = 0.0 OR COALESCE(bc.total_weight, 0::numeric) = 0::numeric
                   THEN NULL::numeric
               ELSE LEAST(
                       dvv.multiplier_min + (COALESCE(bc.total_weight, 1::numeric) - 1::numeric) * dvv.multiplier_step,
                       dvv.multiplier_max)
               END, dvv.multiplier_min::numeric, dvv.multiplier_max::numeric, dvv.multiplier_step::numeric, COALESCE(bc.combined_metadata, '[]'::jsonb))::multiplier_info)                                                    AS multipliers
FROM distribution_verification_values dvv
         LEFT JOIN base_counts bc ON bc.distribution_id = dvv.distribution_id AND bc.type = dvv.type
GROUP BY dvv.distribution_id, (COALESCE(bc.user_id, auth.uid()));

-- update distribution shares to use numeric format
alter table distribution_shares
    alter column amount type numeric,
    alter column hodler_pool_amount type numeric,
    alter column bonus_pool_amount type numeric,
    alter column fixed_pool_amount type numeric;
