drop policy "Users can view own deposits" on "public"."bridge_deposits";

alter table "public"."bridge_deposits" drop constraint "bridge_deposits_source_check";

create table "public"."bridge_static_memos" (
    "id" uuid not null default gen_random_uuid(),
    "bridge_customer_id" uuid not null,
    "bridge_static_memo_id" text not null,
    "source_currency" text not null default 'usd'::text,
    "destination_currency" text not null default 'usdc'::text,
    "destination_payment_rail" text not null default 'base'::text,
    "destination_address" text not null,
    "source_deposit_instructions" jsonb,
    "status" text not null default 'active'::text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "public"."bridge_static_memos" enable row level security;

alter table "public"."bridge_deposits" add column "static_memo_id" uuid;

CREATE INDEX bridge_deposits_static_memo_id_idx ON public.bridge_deposits USING btree (static_memo_id);

CREATE UNIQUE INDEX bridge_static_memos_active_unique ON public.bridge_static_memos USING btree (bridge_customer_id) WHERE (status = 'active'::text);

CREATE INDEX bridge_static_memos_bridge_customer_id_idx ON public.bridge_static_memos USING btree (bridge_customer_id);

CREATE INDEX bridge_static_memos_bridge_static_memo_id_idx ON public.bridge_static_memos USING btree (bridge_static_memo_id);

CREATE UNIQUE INDEX bridge_static_memos_bridge_static_memo_id_key ON public.bridge_static_memos USING btree (bridge_static_memo_id);

CREATE UNIQUE INDEX bridge_static_memos_pkey ON public.bridge_static_memos USING btree (id);

alter table "public"."bridge_static_memos" add constraint "bridge_static_memos_pkey" PRIMARY KEY using index "bridge_static_memos_pkey";

alter table "public"."bridge_deposits" add constraint "bridge_deposits_static_memo_id_fkey" FOREIGN KEY (static_memo_id) REFERENCES bridge_static_memos(id) ON DELETE CASCADE not valid;

alter table "public"."bridge_deposits" validate constraint "bridge_deposits_static_memo_id_fkey";

alter table "public"."bridge_static_memos" add constraint "bridge_static_memos_bridge_customer_id_fkey" FOREIGN KEY (bridge_customer_id) REFERENCES bridge_customers(id) ON DELETE CASCADE not valid;

alter table "public"."bridge_static_memos" validate constraint "bridge_static_memos_bridge_customer_id_fkey";

alter table "public"."bridge_static_memos" add constraint "bridge_static_memos_bridge_static_memo_id_key" UNIQUE using index "bridge_static_memos_bridge_static_memo_id_key";

alter table "public"."bridge_static_memos" add constraint "bridge_static_memos_status_check" CHECK ((status = ANY (ARRAY['active'::text, 'inactive'::text, 'closed'::text]))) not valid;

alter table "public"."bridge_static_memos" validate constraint "bridge_static_memos_status_check";

alter table "public"."bridge_deposits" add constraint "bridge_deposits_source_check" CHECK (((virtual_account_id IS NOT NULL) OR (transfer_template_id IS NOT NULL) OR (static_memo_id IS NOT NULL))) not valid;

alter table "public"."bridge_deposits" validate constraint "bridge_deposits_source_check";

grant delete on table "public"."bridge_static_memos" to "anon";

grant insert on table "public"."bridge_static_memos" to "anon";

grant references on table "public"."bridge_static_memos" to "anon";

grant select on table "public"."bridge_static_memos" to "anon";

grant trigger on table "public"."bridge_static_memos" to "anon";

grant truncate on table "public"."bridge_static_memos" to "anon";

grant update on table "public"."bridge_static_memos" to "anon";

grant delete on table "public"."bridge_static_memos" to "authenticated";

grant insert on table "public"."bridge_static_memos" to "authenticated";

grant references on table "public"."bridge_static_memos" to "authenticated";

grant select on table "public"."bridge_static_memos" to "authenticated";

grant trigger on table "public"."bridge_static_memos" to "authenticated";

grant truncate on table "public"."bridge_static_memos" to "authenticated";

grant update on table "public"."bridge_static_memos" to "authenticated";

grant delete on table "public"."bridge_static_memos" to "service_role";

grant insert on table "public"."bridge_static_memos" to "service_role";

grant references on table "public"."bridge_static_memos" to "service_role";

grant select on table "public"."bridge_static_memos" to "service_role";

grant trigger on table "public"."bridge_static_memos" to "service_role";

grant truncate on table "public"."bridge_static_memos" to "service_role";

grant update on table "public"."bridge_static_memos" to "service_role";

create policy "Users can view own static memos"
on "public"."bridge_static_memos"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM bridge_customers bc
  WHERE ((bc.id = bridge_static_memos.bridge_customer_id) AND (bc.user_id = ( SELECT auth.uid() AS uid))))));


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
  WHERE ((btt.id = bridge_deposits.transfer_template_id) AND (bc.user_id = ( SELECT auth.uid() AS uid))))) OR (EXISTS ( SELECT 1
   FROM (bridge_static_memos bsm
     JOIN bridge_customers bc ON ((bc.id = bsm.bridge_customer_id)))
  WHERE ((bsm.id = bridge_deposits.static_memo_id) AND (bc.user_id = ( SELECT auth.uid() AS uid)))))));


CREATE TRIGGER bridge_static_memos_updated_at BEFORE UPDATE ON public.bridge_static_memos FOR EACH ROW EXECUTE FUNCTION set_current_timestamp_updated_at();


