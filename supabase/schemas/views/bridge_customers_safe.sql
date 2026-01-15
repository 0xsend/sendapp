CREATE OR REPLACE VIEW public.bridge_customers_safe
WITH (security_barrier = true, security_invoker = true) AS
SELECT
    id,
    user_id,
    bridge_customer_id,
    kyc_link_id,
    -- Mask rejected status as under_review for 5 minutes to:
    -- 1. Prevent users from immediately retrying after automated rejection
    -- 2. Handle race condition where Bridge changes status shortly after rejection
    CASE
        WHEN kyc_status = 'rejected' AND updated_at > now() - interval '5 minutes'
        THEN 'under_review'
        ELSE kyc_status
    END AS kyc_status,
    tos_status,
    type,
    rejection_attempts,
    created_at,
    updated_at,
    -- Only show rejection reasons after the 5-minute masking period
    CASE
        WHEN kyc_status = 'rejected' AND updated_at > now() - interval '5 minutes'
        THEN NULL
        WHEN rejection_reasons IS NULL THEN NULL
        ELSE (
            SELECT jsonb_agg(
                CASE
                    WHEN jsonb_typeof(value) = 'object' THEN value - 'developer_reason'
                    ELSE value
                END
            )
            FROM jsonb_array_elements(rejection_reasons) AS value
        )
    END AS rejection_reasons
FROM public.bridge_customers;

ALTER VIEW public.bridge_customers_safe OWNER TO postgres;

REVOKE SELECT ON TABLE public.bridge_customers_safe FROM anon;
GRANT SELECT ON TABLE public.bridge_customers_safe TO authenticated;
GRANT SELECT ON TABLE public.bridge_customers_safe TO service_role;
