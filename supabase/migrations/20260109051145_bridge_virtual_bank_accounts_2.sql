alter table "public"."bridge_deposits" drop constraint "bridge_deposits_status_check";

drop view if exists "public"."bridge_customers_safe";

alter table "public"."bridge_customers" add column "rejection_attempts" integer not null default 0;

alter table "public"."bridge_deposits" add constraint "bridge_deposits_status_check" CHECK ((status = ANY (ARRAY['awaiting_funds'::text, 'funds_received'::text, 'funds_scheduled'::text, 'in_review'::text, 'payment_submitted'::text, 'payment_processed'::text, 'undeliverable'::text, 'returned'::text, 'missing_return_policy'::text, 'refunded'::text, 'canceled'::text, 'error'::text, 'refund'::text]))) not valid;

alter table "public"."bridge_deposits" validate constraint "bridge_deposits_status_check";

create or replace view "public"."bridge_customers_safe" as  SELECT bridge_customers.id,
    bridge_customers.user_id,
    bridge_customers.bridge_customer_id,
    bridge_customers.kyc_link_id,
    bridge_customers.kyc_status,
    bridge_customers.tos_status,
    bridge_customers.full_name,
    bridge_customers.email,
    bridge_customers.type,
    bridge_customers.rejection_attempts,
    bridge_customers.created_at,
    bridge_customers.updated_at,
        CASE
            WHEN (bridge_customers.rejection_reasons IS NULL) THEN NULL::jsonb
            ELSE ( SELECT jsonb_agg(
                    CASE
                        WHEN (jsonb_typeof(value.value) = 'object'::text) THEN (value.value - 'developer_reason'::text)
                        ELSE value.value
                    END) AS jsonb_agg
               FROM jsonb_array_elements(bridge_customers.rejection_reasons) value(value))
        END AS rejection_reasons
   FROM bridge_customers;



