-- Fix insert_verification_value function to have default values for multiplier fields
-- This prevents NULL constraint violations when there are no previous distribution values
-- to inherit from (e.g., for sendpot_ticket_purchase on fresh databases in 2026)

CREATE OR REPLACE FUNCTION "public"."insert_verification_value"(
    "distribution_number" integer,
    "type" "public"."verification_type",
    "fixed_value" numeric DEFAULT NULL::numeric,
    "bips_value" integer DEFAULT NULL::integer,
    "multiplier_min" numeric DEFAULT NULL::numeric,
    "multiplier_max" numeric DEFAULT NULL::numeric,
    "multiplier_step" numeric DEFAULT NULL::numeric
) RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    prev_verification_values RECORD;
BEGIN
    SELECT * INTO prev_verification_values
    FROM public.distribution_verification_values dvv
    WHERE distribution_id = (SELECT id FROM distributions WHERE "number" = insert_verification_value.distribution_number - 1 LIMIT 1)
    AND dvv.type = insert_verification_value.type
    LIMIT 1;

    INSERT INTO public.distribution_verification_values(
        type,
        fixed_value,
        bips_value,
        multiplier_min,
        multiplier_max,
        multiplier_step,
        distribution_id
    ) VALUES (
        insert_verification_value.type,
        COALESCE(insert_verification_value.fixed_value, prev_verification_values.fixed_value, 0),
        COALESCE(insert_verification_value.bips_value, prev_verification_values.bips_value, 0),
        COALESCE(insert_verification_value.multiplier_min, prev_verification_values.multiplier_min, 1.0),
        COALESCE(insert_verification_value.multiplier_max, prev_verification_values.multiplier_max, 1.0),
        COALESCE(insert_verification_value.multiplier_step, prev_verification_values.multiplier_step, 0.0),
        (SELECT id FROM distributions WHERE "number" = insert_verification_value.distribution_number LIMIT 1)
    );
END;
$$;
