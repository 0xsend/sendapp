drop policy "Users can view own deposits" on "public"."bridge_deposits";

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

alter table "public"."bridge_deposits" add column "transfer_template_id" uuid;

alter table "public"."bridge_deposits" alter column "virtual_account_id" drop not null;

CREATE INDEX bridge_deposits_transfer_template_id_idx ON public.bridge_deposits USING btree (transfer_template_id);

CREATE UNIQUE INDEX bridge_transfer_templates_active_unique ON public.bridge_transfer_templates USING btree (bridge_customer_id) WHERE (status = 'active'::text);

CREATE INDEX bridge_transfer_templates_bridge_customer_id_idx ON public.bridge_transfer_templates USING btree (bridge_customer_id);

CREATE INDEX bridge_transfer_templates_bridge_template_id_idx ON public.bridge_transfer_templates USING btree (bridge_transfer_template_id);

CREATE UNIQUE INDEX bridge_transfer_templates_bridge_transfer_template_id_key ON public.bridge_transfer_templates USING btree (bridge_transfer_template_id);

CREATE UNIQUE INDEX bridge_transfer_templates_pkey ON public.bridge_transfer_templates USING btree (id);

alter table "public"."bridge_transfer_templates" add constraint "bridge_transfer_templates_pkey" PRIMARY KEY using index "bridge_transfer_templates_pkey";

alter table "public"."bridge_deposits" add constraint "bridge_deposits_source_check" CHECK (((virtual_account_id IS NOT NULL) OR (transfer_template_id IS NOT NULL))) not valid;

alter table "public"."bridge_deposits" validate constraint "bridge_deposits_source_check";

alter table "public"."bridge_deposits" add constraint "bridge_deposits_transfer_template_id_fkey" FOREIGN KEY (transfer_template_id) REFERENCES bridge_transfer_templates(id) ON DELETE CASCADE not valid;

alter table "public"."bridge_deposits" validate constraint "bridge_deposits_transfer_template_id_fkey";

alter table "public"."bridge_transfer_templates" add constraint "bridge_transfer_templates_bridge_customer_id_fkey" FOREIGN KEY (bridge_customer_id) REFERENCES bridge_customers(id) ON DELETE CASCADE not valid;

alter table "public"."bridge_transfer_templates" validate constraint "bridge_transfer_templates_bridge_customer_id_fkey";

alter table "public"."bridge_transfer_templates" add constraint "bridge_transfer_templates_bridge_transfer_template_id_key" UNIQUE using index "bridge_transfer_templates_bridge_transfer_template_id_key";

alter table "public"."bridge_transfer_templates" add constraint "bridge_transfer_templates_status_check" CHECK ((status = ANY (ARRAY['active'::text, 'inactive'::text, 'closed'::text]))) not valid;

alter table "public"."bridge_transfer_templates" validate constraint "bridge_transfer_templates_status_check";

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

create policy "Users can view own transfer templates"
on "public"."bridge_transfer_templates"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM bridge_customers bc
  WHERE ((bc.id = bridge_transfer_templates.bridge_customer_id) AND (bc.user_id = ( SELECT auth.uid() AS uid))))));


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


CREATE TRIGGER bridge_transfer_templates_updated_at BEFORE UPDATE ON public.bridge_transfer_templates FOR EACH ROW EXECUTE FUNCTION set_current_timestamp_updated_at();


