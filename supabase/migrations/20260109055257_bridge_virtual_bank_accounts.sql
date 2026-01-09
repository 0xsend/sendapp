create table "public"."bridge_customers" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "bridge_customer_id" text,
    "kyc_link_id" text not null,
    "kyc_status" text not null default 'not_started'::text,
    "tos_status" text not null default 'pending'::text,
    "full_name" text,
    "email" text not null,
    "type" text not null default 'individual'::text,
    "rejection_reasons" jsonb,
    "rejection_attempts" integer not null default 0,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "public"."bridge_customers" enable row level security;

create table "public"."bridge_deposits" (
    "id" uuid not null default gen_random_uuid(),
    "virtual_account_id" uuid,
    "transfer_template_id" uuid,
    "bridge_transfer_id" text not null,
    "last_event_id" text,
    "last_event_type" text,
    "payment_rail" text not null,
    "amount" numeric not null,
    "currency" text not null default 'usd'::text,
    "status" text not null default 'funds_received'::text,
    "sender_name" text,
    "sender_routing_number" text,
    "trace_number" text,
    "destination_tx_hash" text,
    "fee_amount" numeric,
    "net_amount" numeric,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "public"."bridge_deposits" enable row level security;

create table "public"."bridge_transfer_templates" (
    "id" uuid not null default gen_random_uuid(),
    "bridge_customer_id" uuid not null,
    "bridge_transfer_template_id" text not null,
    "source_currency" text not null default 'usd'::text,
    "destination_currency" text not null default 'usdc'::text,
    "destination_payment_rail" text not null default 'base'::text,
    "destination_address" text not null,
    "source_deposit_instructions" jsonb,
    "status" text not null default 'active'::text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "public"."bridge_transfer_templates" enable row level security;

create table "public"."bridge_virtual_accounts" (
    "id" uuid not null default gen_random_uuid(),
    "bridge_customer_id" uuid not null,
    "bridge_virtual_account_id" text not null,
    "source_currency" text not null default 'usd'::text,
    "destination_currency" text not null default 'usdc'::text,
    "destination_payment_rail" text not null default 'base'::text,
    "destination_address" text not null,
    "source_deposit_instructions" jsonb,
    "status" text not null default 'active'::text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "public"."bridge_virtual_accounts" enable row level security;

create table "public"."bridge_webhook_events" (
    "id" uuid not null default gen_random_uuid(),
    "bridge_event_id" text not null,
    "event_type" text not null,
    "event_created_at" timestamp with time zone,
    "payload" jsonb not null,
    "processed_at" timestamp with time zone,
    "error" text,
    "created_at" timestamp with time zone not null default now()
);


alter table "public"."bridge_webhook_events" enable row level security;

CREATE INDEX bridge_customers_bridge_customer_id_idx ON public.bridge_customers USING btree (bridge_customer_id);

CREATE UNIQUE INDEX bridge_customers_bridge_customer_id_key ON public.bridge_customers USING btree (bridge_customer_id);

CREATE INDEX bridge_customers_kyc_link_id_idx ON public.bridge_customers USING btree (kyc_link_id);

CREATE UNIQUE INDEX bridge_customers_kyc_link_id_key ON public.bridge_customers USING btree (kyc_link_id);

CREATE INDEX bridge_customers_kyc_status_idx ON public.bridge_customers USING btree (kyc_status);

CREATE UNIQUE INDEX bridge_customers_pkey ON public.bridge_customers USING btree (id);

CREATE INDEX bridge_customers_user_id_idx ON public.bridge_customers USING btree (user_id);

CREATE UNIQUE INDEX bridge_customers_user_id_unique ON public.bridge_customers USING btree (user_id);

CREATE UNIQUE INDEX bridge_deposits_bridge_transfer_id_key ON public.bridge_deposits USING btree (bridge_transfer_id);

CREATE INDEX bridge_deposits_created_at_idx ON public.bridge_deposits USING btree (created_at DESC);

CREATE UNIQUE INDEX bridge_deposits_pkey ON public.bridge_deposits USING btree (id);

CREATE INDEX bridge_deposits_status_idx ON public.bridge_deposits USING btree (status);

CREATE INDEX bridge_deposits_transfer_template_id_idx ON public.bridge_deposits USING btree (transfer_template_id);

CREATE INDEX bridge_deposits_virtual_account_id_idx ON public.bridge_deposits USING btree (virtual_account_id);

CREATE UNIQUE INDEX bridge_transfer_templates_active_unique ON public.bridge_transfer_templates USING btree (bridge_customer_id) WHERE (status = 'active'::text);

CREATE INDEX bridge_transfer_templates_bridge_customer_id_idx ON public.bridge_transfer_templates USING btree (bridge_customer_id);

CREATE INDEX bridge_transfer_templates_bridge_template_id_idx ON public.bridge_transfer_templates USING btree (bridge_transfer_template_id);

CREATE UNIQUE INDEX bridge_transfer_templates_bridge_transfer_template_id_key ON public.bridge_transfer_templates USING btree (bridge_transfer_template_id);

CREATE UNIQUE INDEX bridge_transfer_templates_pkey ON public.bridge_transfer_templates USING btree (id);

CREATE UNIQUE INDEX bridge_virtual_accounts_active_unique ON public.bridge_virtual_accounts USING btree (bridge_customer_id) WHERE (status = 'active'::text);

CREATE INDEX bridge_virtual_accounts_bridge_customer_id_idx ON public.bridge_virtual_accounts USING btree (bridge_customer_id);

CREATE INDEX bridge_virtual_accounts_bridge_va_id_idx ON public.bridge_virtual_accounts USING btree (bridge_virtual_account_id);

CREATE UNIQUE INDEX bridge_virtual_accounts_bridge_virtual_account_id_key ON public.bridge_virtual_accounts USING btree (bridge_virtual_account_id);

CREATE UNIQUE INDEX bridge_virtual_accounts_pkey ON public.bridge_virtual_accounts USING btree (id);

CREATE UNIQUE INDEX bridge_webhook_events_bridge_event_id_key ON public.bridge_webhook_events USING btree (bridge_event_id);

CREATE INDEX bridge_webhook_events_created_at_idx ON public.bridge_webhook_events USING btree (created_at DESC);

CREATE INDEX bridge_webhook_events_event_type_idx ON public.bridge_webhook_events USING btree (event_type);

CREATE UNIQUE INDEX bridge_webhook_events_pkey ON public.bridge_webhook_events USING btree (id);

CREATE INDEX bridge_webhook_events_processed_at_idx ON public.bridge_webhook_events USING btree (processed_at) WHERE (processed_at IS NULL);

alter table "public"."bridge_customers" add constraint "bridge_customers_pkey" PRIMARY KEY using index "bridge_customers_pkey";

alter table "public"."bridge_deposits" add constraint "bridge_deposits_pkey" PRIMARY KEY using index "bridge_deposits_pkey";

alter table "public"."bridge_transfer_templates" add constraint "bridge_transfer_templates_pkey" PRIMARY KEY using index "bridge_transfer_templates_pkey";

alter table "public"."bridge_virtual_accounts" add constraint "bridge_virtual_accounts_pkey" PRIMARY KEY using index "bridge_virtual_accounts_pkey";

alter table "public"."bridge_webhook_events" add constraint "bridge_webhook_events_pkey" PRIMARY KEY using index "bridge_webhook_events_pkey";

alter table "public"."bridge_customers" add constraint "bridge_customers_bridge_customer_id_key" UNIQUE using index "bridge_customers_bridge_customer_id_key";

alter table "public"."bridge_customers" add constraint "bridge_customers_kyc_link_id_key" UNIQUE using index "bridge_customers_kyc_link_id_key";

alter table "public"."bridge_customers" add constraint "bridge_customers_kyc_status_check" CHECK ((kyc_status = ANY (ARRAY['not_started'::text, 'incomplete'::text, 'under_review'::text, 'approved'::text, 'rejected'::text, 'paused'::text, 'offboarded'::text, 'awaiting_questionnaire'::text, 'awaiting_ubo'::text]))) not valid;

alter table "public"."bridge_customers" validate constraint "bridge_customers_kyc_status_check";

alter table "public"."bridge_customers" add constraint "bridge_customers_tos_status_check" CHECK ((tos_status = ANY (ARRAY['pending'::text, 'approved'::text]))) not valid;

alter table "public"."bridge_customers" validate constraint "bridge_customers_tos_status_check";

alter table "public"."bridge_customers" add constraint "bridge_customers_type_check" CHECK ((type = ANY (ARRAY['individual'::text, 'business'::text]))) not valid;

alter table "public"."bridge_customers" validate constraint "bridge_customers_type_check";

alter table "public"."bridge_customers" add constraint "bridge_customers_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."bridge_customers" validate constraint "bridge_customers_user_id_fkey";

alter table "public"."bridge_customers" add constraint "bridge_customers_user_id_unique" UNIQUE using index "bridge_customers_user_id_unique";

alter table "public"."bridge_deposits" add constraint "bridge_deposits_bridge_transfer_id_key" UNIQUE using index "bridge_deposits_bridge_transfer_id_key";

alter table "public"."bridge_deposits" add constraint "bridge_deposits_payment_rail_check" CHECK ((payment_rail = ANY (ARRAY['ach_push'::text, 'wire'::text]))) not valid;

alter table "public"."bridge_deposits" validate constraint "bridge_deposits_payment_rail_check";

alter table "public"."bridge_deposits" add constraint "bridge_deposits_source_check" CHECK (((virtual_account_id IS NOT NULL) OR (transfer_template_id IS NOT NULL))) not valid;

alter table "public"."bridge_deposits" validate constraint "bridge_deposits_source_check";

alter table "public"."bridge_deposits" add constraint "bridge_deposits_status_check" CHECK ((status = ANY (ARRAY['awaiting_funds'::text, 'funds_received'::text, 'funds_scheduled'::text, 'in_review'::text, 'payment_submitted'::text, 'payment_processed'::text, 'undeliverable'::text, 'returned'::text, 'missing_return_policy'::text, 'refunded'::text, 'canceled'::text, 'error'::text, 'refund'::text]))) not valid;

alter table "public"."bridge_deposits" validate constraint "bridge_deposits_status_check";

alter table "public"."bridge_deposits" add constraint "bridge_deposits_transfer_template_id_fkey" FOREIGN KEY (transfer_template_id) REFERENCES bridge_transfer_templates(id) ON DELETE CASCADE not valid;

alter table "public"."bridge_deposits" validate constraint "bridge_deposits_transfer_template_id_fkey";

alter table "public"."bridge_deposits" add constraint "bridge_deposits_virtual_account_id_fkey" FOREIGN KEY (virtual_account_id) REFERENCES bridge_virtual_accounts(id) ON DELETE CASCADE not valid;

alter table "public"."bridge_deposits" validate constraint "bridge_deposits_virtual_account_id_fkey";

alter table "public"."bridge_transfer_templates" add constraint "bridge_transfer_templates_bridge_customer_id_fkey" FOREIGN KEY (bridge_customer_id) REFERENCES bridge_customers(id) ON DELETE CASCADE not valid;

alter table "public"."bridge_transfer_templates" validate constraint "bridge_transfer_templates_bridge_customer_id_fkey";

alter table "public"."bridge_transfer_templates" add constraint "bridge_transfer_templates_bridge_transfer_template_id_key" UNIQUE using index "bridge_transfer_templates_bridge_transfer_template_id_key";

alter table "public"."bridge_transfer_templates" add constraint "bridge_transfer_templates_status_check" CHECK ((status = ANY (ARRAY['active'::text, 'inactive'::text, 'closed'::text]))) not valid;

alter table "public"."bridge_transfer_templates" validate constraint "bridge_transfer_templates_status_check";

alter table "public"."bridge_virtual_accounts" add constraint "bridge_virtual_accounts_bridge_customer_id_fkey" FOREIGN KEY (bridge_customer_id) REFERENCES bridge_customers(id) ON DELETE CASCADE not valid;

alter table "public"."bridge_virtual_accounts" validate constraint "bridge_virtual_accounts_bridge_customer_id_fkey";

alter table "public"."bridge_virtual_accounts" add constraint "bridge_virtual_accounts_bridge_virtual_account_id_key" UNIQUE using index "bridge_virtual_accounts_bridge_virtual_account_id_key";

alter table "public"."bridge_virtual_accounts" add constraint "bridge_virtual_accounts_status_check" CHECK ((status = ANY (ARRAY['active'::text, 'inactive'::text, 'closed'::text]))) not valid;

alter table "public"."bridge_virtual_accounts" validate constraint "bridge_virtual_accounts_status_check";

alter table "public"."bridge_webhook_events" add constraint "bridge_webhook_events_bridge_event_id_key" UNIQUE using index "bridge_webhook_events_bridge_event_id_key";

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


grant delete on table "public"."bridge_customers" to "anon";

grant insert on table "public"."bridge_customers" to "anon";

grant references on table "public"."bridge_customers" to "anon";

grant select on table "public"."bridge_customers" to "anon";

grant trigger on table "public"."bridge_customers" to "anon";

grant truncate on table "public"."bridge_customers" to "anon";

grant update on table "public"."bridge_customers" to "anon";

grant delete on table "public"."bridge_customers" to "authenticated";

grant insert on table "public"."bridge_customers" to "authenticated";

grant references on table "public"."bridge_customers" to "authenticated";

grant select on table "public"."bridge_customers" to "authenticated";

grant trigger on table "public"."bridge_customers" to "authenticated";

grant truncate on table "public"."bridge_customers" to "authenticated";

grant update on table "public"."bridge_customers" to "authenticated";

grant delete on table "public"."bridge_customers" to "service_role";

grant insert on table "public"."bridge_customers" to "service_role";

grant references on table "public"."bridge_customers" to "service_role";

grant select on table "public"."bridge_customers" to "service_role";

grant trigger on table "public"."bridge_customers" to "service_role";

grant truncate on table "public"."bridge_customers" to "service_role";

grant update on table "public"."bridge_customers" to "service_role";

grant delete on table "public"."bridge_deposits" to "anon";

grant insert on table "public"."bridge_deposits" to "anon";

grant references on table "public"."bridge_deposits" to "anon";

grant select on table "public"."bridge_deposits" to "anon";

grant trigger on table "public"."bridge_deposits" to "anon";

grant truncate on table "public"."bridge_deposits" to "anon";

grant update on table "public"."bridge_deposits" to "anon";

grant delete on table "public"."bridge_deposits" to "authenticated";

grant insert on table "public"."bridge_deposits" to "authenticated";

grant references on table "public"."bridge_deposits" to "authenticated";

grant select on table "public"."bridge_deposits" to "authenticated";

grant trigger on table "public"."bridge_deposits" to "authenticated";

grant truncate on table "public"."bridge_deposits" to "authenticated";

grant update on table "public"."bridge_deposits" to "authenticated";

grant delete on table "public"."bridge_deposits" to "service_role";

grant insert on table "public"."bridge_deposits" to "service_role";

grant references on table "public"."bridge_deposits" to "service_role";

grant select on table "public"."bridge_deposits" to "service_role";

grant trigger on table "public"."bridge_deposits" to "service_role";

grant truncate on table "public"."bridge_deposits" to "service_role";

grant update on table "public"."bridge_deposits" to "service_role";

grant delete on table "public"."bridge_transfer_templates" to "anon";

grant insert on table "public"."bridge_transfer_templates" to "anon";

grant references on table "public"."bridge_transfer_templates" to "anon";

grant select on table "public"."bridge_transfer_templates" to "anon";

grant trigger on table "public"."bridge_transfer_templates" to "anon";

grant truncate on table "public"."bridge_transfer_templates" to "anon";

grant update on table "public"."bridge_transfer_templates" to "anon";

grant delete on table "public"."bridge_transfer_templates" to "authenticated";

grant insert on table "public"."bridge_transfer_templates" to "authenticated";

grant references on table "public"."bridge_transfer_templates" to "authenticated";

grant select on table "public"."bridge_transfer_templates" to "authenticated";

grant trigger on table "public"."bridge_transfer_templates" to "authenticated";

grant truncate on table "public"."bridge_transfer_templates" to "authenticated";

grant update on table "public"."bridge_transfer_templates" to "authenticated";

grant delete on table "public"."bridge_transfer_templates" to "service_role";

grant insert on table "public"."bridge_transfer_templates" to "service_role";

grant references on table "public"."bridge_transfer_templates" to "service_role";

grant select on table "public"."bridge_transfer_templates" to "service_role";

grant trigger on table "public"."bridge_transfer_templates" to "service_role";

grant truncate on table "public"."bridge_transfer_templates" to "service_role";

grant update on table "public"."bridge_transfer_templates" to "service_role";

grant delete on table "public"."bridge_virtual_accounts" to "anon";

grant insert on table "public"."bridge_virtual_accounts" to "anon";

grant references on table "public"."bridge_virtual_accounts" to "anon";

grant select on table "public"."bridge_virtual_accounts" to "anon";

grant trigger on table "public"."bridge_virtual_accounts" to "anon";

grant truncate on table "public"."bridge_virtual_accounts" to "anon";

grant update on table "public"."bridge_virtual_accounts" to "anon";

grant delete on table "public"."bridge_virtual_accounts" to "authenticated";

grant insert on table "public"."bridge_virtual_accounts" to "authenticated";

grant references on table "public"."bridge_virtual_accounts" to "authenticated";

grant select on table "public"."bridge_virtual_accounts" to "authenticated";

grant trigger on table "public"."bridge_virtual_accounts" to "authenticated";

grant truncate on table "public"."bridge_virtual_accounts" to "authenticated";

grant update on table "public"."bridge_virtual_accounts" to "authenticated";

grant delete on table "public"."bridge_virtual_accounts" to "service_role";

grant insert on table "public"."bridge_virtual_accounts" to "service_role";

grant references on table "public"."bridge_virtual_accounts" to "service_role";

grant select on table "public"."bridge_virtual_accounts" to "service_role";

grant trigger on table "public"."bridge_virtual_accounts" to "service_role";

grant truncate on table "public"."bridge_virtual_accounts" to "service_role";

grant update on table "public"."bridge_virtual_accounts" to "service_role";

grant delete on table "public"."bridge_webhook_events" to "anon";

grant insert on table "public"."bridge_webhook_events" to "anon";

grant references on table "public"."bridge_webhook_events" to "anon";

grant select on table "public"."bridge_webhook_events" to "anon";

grant trigger on table "public"."bridge_webhook_events" to "anon";

grant truncate on table "public"."bridge_webhook_events" to "anon";

grant update on table "public"."bridge_webhook_events" to "anon";

grant delete on table "public"."bridge_webhook_events" to "authenticated";

grant insert on table "public"."bridge_webhook_events" to "authenticated";

grant references on table "public"."bridge_webhook_events" to "authenticated";

grant select on table "public"."bridge_webhook_events" to "authenticated";

grant trigger on table "public"."bridge_webhook_events" to "authenticated";

grant truncate on table "public"."bridge_webhook_events" to "authenticated";

grant update on table "public"."bridge_webhook_events" to "authenticated";

grant delete on table "public"."bridge_webhook_events" to "service_role";

grant insert on table "public"."bridge_webhook_events" to "service_role";

grant references on table "public"."bridge_webhook_events" to "service_role";

grant select on table "public"."bridge_webhook_events" to "service_role";

grant trigger on table "public"."bridge_webhook_events" to "service_role";

grant truncate on table "public"."bridge_webhook_events" to "service_role";

grant update on table "public"."bridge_webhook_events" to "service_role";

create policy "Users can view own bridge customer"
on "public"."bridge_customers"
as permissive
for select
to public
using ((( SELECT auth.uid() AS uid) = user_id));


create policy "Users can view own deposits"
on "public"."bridge_deposits"
as permissive
for select
to public
using (((EXISTS ( SELECT 1
   FROM (bridge_virtual_accounts bva
     JOIN bridge_customers bc ON ((bc.id = bva.bridge_customer_id)))
  WHERE ((bva.id = bridge_deposits.virtual_account_id) AND (bc.user_id = ( SELECT auth.uid() AS uid))))) OR (EXISTS ( SELECT 1
   FROM (bridge_transfer_templates btt
     JOIN bridge_customers bc ON ((bc.id = btt.bridge_customer_id)))
  WHERE ((btt.id = bridge_deposits.transfer_template_id) AND (bc.user_id = ( SELECT auth.uid() AS uid)))))));


create policy "Users can view own transfer templates"
on "public"."bridge_transfer_templates"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM bridge_customers bc
  WHERE ((bc.id = bridge_transfer_templates.bridge_customer_id) AND (bc.user_id = ( SELECT auth.uid() AS uid))))));


create policy "Users can view own virtual accounts"
on "public"."bridge_virtual_accounts"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM bridge_customers bc
  WHERE ((bc.id = bridge_virtual_accounts.bridge_customer_id) AND (bc.user_id = ( SELECT auth.uid() AS uid))))));


CREATE TRIGGER bridge_customers_updated_at BEFORE UPDATE ON public.bridge_customers FOR EACH ROW EXECUTE FUNCTION set_current_timestamp_updated_at();

CREATE TRIGGER bridge_deposits_updated_at BEFORE UPDATE ON public.bridge_deposits FOR EACH ROW EXECUTE FUNCTION set_current_timestamp_updated_at();

CREATE TRIGGER bridge_transfer_templates_updated_at BEFORE UPDATE ON public.bridge_transfer_templates FOR EACH ROW EXECUTE FUNCTION set_current_timestamp_updated_at();

CREATE TRIGGER bridge_virtual_accounts_updated_at BEFORE UPDATE ON public.bridge_virtual_accounts FOR EACH ROW EXECUTE FUNCTION set_current_timestamp_updated_at();


