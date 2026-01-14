drop view if exists "public"."bridge_customers_safe";

alter table "public"."bridge_customers" add column "email" text;

CREATE INDEX bridge_customers_email_idx ON public.bridge_customers USING btree (email);

CREATE UNIQUE INDEX bridge_customers_email_key ON public.bridge_customers USING btree (email);

alter table "public"."bridge_customers" add constraint "bridge_customers_email_key" UNIQUE using index "bridge_customers_email_key";

create or replace view "public"."bridge_customers_safe" as  SELECT bridge_customers.id,
    bridge_customers.user_id,
    bridge_customers.bridge_customer_id,
    bridge_customers.kyc_link_id,
    bridge_customers.kyc_status,
    bridge_customers.tos_status,
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



