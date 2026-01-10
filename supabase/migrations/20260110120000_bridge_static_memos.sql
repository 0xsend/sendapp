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

alter table "public"."bridge_deposits" drop constraint if exists "bridge_deposits_source_check";

alter table "public"."bridge_deposits"
    add constraint "bridge_deposits_source_check" check (
        "virtual_account_id" is not null
        or "transfer_template_id" is not null
        or "static_memo_id" is not null
    );

create index bridge_static_memos_bridge_customer_id_idx on public.bridge_static_memos using btree (bridge_customer_id);
create index bridge_static_memos_bridge_static_memo_id_idx on public.bridge_static_memos using btree (bridge_static_memo_id);
create unique index bridge_static_memos_active_unique on public.bridge_static_memos using btree (bridge_customer_id) where (status = 'active'::text);
create unique index bridge_static_memos_bridge_static_memo_id_key on public.bridge_static_memos using btree (bridge_static_memo_id);
create unique index bridge_static_memos_pkey on public.bridge_static_memos using btree (id);

create index bridge_deposits_static_memo_id_idx on public.bridge_deposits using btree (static_memo_id);

alter table "public"."bridge_static_memos" add constraint "bridge_static_memos_pkey" primary key using index "bridge_static_memos_pkey";

alter table "public"."bridge_static_memos"
    add constraint "bridge_static_memos_status_check" check ((status = any (array['active'::text, 'inactive'::text, 'closed'::text]))) not valid;
alter table "public"."bridge_static_memos" validate constraint "bridge_static_memos_status_check";

alter table "public"."bridge_static_memos"
    add constraint "bridge_static_memos_bridge_customer_id_fkey" foreign key (bridge_customer_id) references bridge_customers(id) on delete cascade not valid;
alter table "public"."bridge_static_memos" validate constraint "bridge_static_memos_bridge_customer_id_fkey";

alter table "public"."bridge_deposits"
    add constraint "bridge_deposits_static_memo_id_fkey" foreign key (static_memo_id) references bridge_static_memos(id) on delete cascade not valid;
alter table "public"."bridge_deposits" validate constraint "bridge_deposits_static_memo_id_fkey";

create policy "Users can view own static memos"
    on "public"."bridge_static_memos" for select
    using (
        exists (
            select 1 from "public"."bridge_customers" bc
            where bc."id" = "bridge_static_memos"."bridge_customer_id"
            and bc."user_id" = (select auth.uid())
        )
    );

drop policy if exists "Users can view own deposits" on "public"."bridge_deposits";
create policy "Users can view own deposits"
    on "public"."bridge_deposits" for select
    using (
        exists (
            select 1 from "public"."bridge_virtual_accounts" bva
            join "public"."bridge_customers" bc on bc."id" = bva."bridge_customer_id"
            where bva."id" = "bridge_deposits"."virtual_account_id"
            and bc."user_id" = (select auth.uid())
        )
        or exists (
            select 1 from "public"."bridge_transfer_templates" btt
            join "public"."bridge_customers" bc on bc."id" = btt."bridge_customer_id"
            where btt."id" = "bridge_deposits"."transfer_template_id"
            and bc."user_id" = (select auth.uid())
        )
        or exists (
            select 1 from "public"."bridge_static_memos" bsm
            join "public"."bridge_customers" bc on bc."id" = bsm."bridge_customer_id"
            where bsm."id" = "bridge_deposits"."static_memo_id"
            and bc."user_id" = (select auth.uid())
        )
    );

create or replace trigger "bridge_static_memos_updated_at"
    before update on "public"."bridge_static_memos"
    for each row execute function "public"."set_current_timestamp_updated_at"();

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
