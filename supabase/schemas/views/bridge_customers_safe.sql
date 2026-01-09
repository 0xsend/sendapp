CREATE OR REPLACE VIEW public.bridge_customers_safe
WITH (security_barrier = true) AS
SELECT
    id,
    user_id,
    bridge_customer_id,
    kyc_link_id,
    kyc_status,
    tos_status,
    full_name,
    email,
    type,
    rejection_attempts,
    created_at,
    updated_at,
    CASE
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
