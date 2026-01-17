create table "public"."send_earn_revenue_harvest" (
    "id" bigint generated always as identity not null,
    "vault" bytea not null,
    "token" bytea not null,
    "amount" numeric not null,
    "tx_hash" bytea not null,
    "block_num" numeric not null,
    "block_time" numeric not null,
    "created_at" timestamp with time zone not null default now()
);


alter table "public"."send_earn_revenue_harvest" enable row level security;

create table "public"."send_earn_revenue_sweep" (
    "id" bigint generated always as identity not null,
    "vault" bytea not null,
    "token" bytea not null,
    "amount" numeric not null,
    "destination" bytea not null,
    "tx_hash" bytea not null,
    "block_num" numeric not null,
    "block_time" numeric not null,
    "created_at" timestamp with time zone not null default now()
);


alter table "public"."send_earn_revenue_sweep" enable row level security;

create table "public"."send_earn_reward_claims" (
    "id" bigint generated always as identity not null,
    "vault" bytea not null,
    "token" bytea not null,
    "amount" numeric not null,
    "tx_hash" bytea not null,
    "block_num" numeric not null,
    "block_time" numeric not null,
    "created_at" timestamp with time zone not null default now()
);


alter table "public"."send_earn_reward_claims" enable row level security;

CREATE INDEX idx_revenue_harvest_block_time ON public.send_earn_revenue_harvest USING btree (block_time);

CREATE INDEX idx_revenue_harvest_token ON public.send_earn_revenue_harvest USING btree (token);

CREATE INDEX idx_revenue_harvest_vault ON public.send_earn_revenue_harvest USING btree (vault);

CREATE INDEX idx_revenue_sweep_block_time ON public.send_earn_revenue_sweep USING btree (block_time);

CREATE INDEX idx_revenue_sweep_destination ON public.send_earn_revenue_sweep USING btree (destination);

CREATE INDEX idx_revenue_sweep_token ON public.send_earn_revenue_sweep USING btree (token);

CREATE INDEX idx_revenue_sweep_vault ON public.send_earn_revenue_sweep USING btree (vault);

CREATE INDEX idx_reward_claims_block_time ON public.send_earn_reward_claims USING btree (block_time);

CREATE INDEX idx_reward_claims_token ON public.send_earn_reward_claims USING btree (token);

CREATE INDEX idx_reward_claims_vault ON public.send_earn_reward_claims USING btree (vault);

CREATE UNIQUE INDEX u_revenue_harvest ON public.send_earn_revenue_harvest USING btree (vault, token, tx_hash);

CREATE UNIQUE INDEX u_revenue_sweep ON public.send_earn_revenue_sweep USING btree (vault, token, tx_hash);

CREATE UNIQUE INDEX u_reward_claims ON public.send_earn_reward_claims USING btree (vault, token, tx_hash);

create or replace view "public"."send_earn_revenue_summary" as  SELECT send_earn_revenue_sweep.token,
    sum(send_earn_revenue_sweep.amount) AS total_collected,
    count(DISTINCT send_earn_revenue_sweep.vault) AS vaults_collected,
    max(send_earn_revenue_sweep.block_time) AS last_collection_time
   FROM send_earn_revenue_sweep
  GROUP BY send_earn_revenue_sweep.token;


create or replace view "public"."send_earn_rewards_summary" as  SELECT send_earn_reward_claims.vault,
    send_earn_reward_claims.token,
    sum(send_earn_reward_claims.amount) AS total_claimed,
    count(*) AS claim_count,
    max(send_earn_reward_claims.block_time) AS last_claim_time
   FROM send_earn_reward_claims
  GROUP BY send_earn_reward_claims.vault, send_earn_reward_claims.token;


grant delete on table "public"."send_earn_revenue_harvest" to "anon";

grant insert on table "public"."send_earn_revenue_harvest" to "anon";

grant references on table "public"."send_earn_revenue_harvest" to "anon";

grant select on table "public"."send_earn_revenue_harvest" to "anon";

grant trigger on table "public"."send_earn_revenue_harvest" to "anon";

grant truncate on table "public"."send_earn_revenue_harvest" to "anon";

grant update on table "public"."send_earn_revenue_harvest" to "anon";

grant delete on table "public"."send_earn_revenue_harvest" to "authenticated";

grant insert on table "public"."send_earn_revenue_harvest" to "authenticated";

grant references on table "public"."send_earn_revenue_harvest" to "authenticated";

grant select on table "public"."send_earn_revenue_harvest" to "authenticated";

grant trigger on table "public"."send_earn_revenue_harvest" to "authenticated";

grant truncate on table "public"."send_earn_revenue_harvest" to "authenticated";

grant update on table "public"."send_earn_revenue_harvest" to "authenticated";

grant delete on table "public"."send_earn_revenue_harvest" to "service_role";

grant insert on table "public"."send_earn_revenue_harvest" to "service_role";

grant references on table "public"."send_earn_revenue_harvest" to "service_role";

grant select on table "public"."send_earn_revenue_harvest" to "service_role";

grant trigger on table "public"."send_earn_revenue_harvest" to "service_role";

grant truncate on table "public"."send_earn_revenue_harvest" to "service_role";

grant update on table "public"."send_earn_revenue_harvest" to "service_role";

grant delete on table "public"."send_earn_revenue_sweep" to "anon";

grant insert on table "public"."send_earn_revenue_sweep" to "anon";

grant references on table "public"."send_earn_revenue_sweep" to "anon";

grant select on table "public"."send_earn_revenue_sweep" to "anon";

grant trigger on table "public"."send_earn_revenue_sweep" to "anon";

grant truncate on table "public"."send_earn_revenue_sweep" to "anon";

grant update on table "public"."send_earn_revenue_sweep" to "anon";

grant delete on table "public"."send_earn_revenue_sweep" to "authenticated";

grant insert on table "public"."send_earn_revenue_sweep" to "authenticated";

grant references on table "public"."send_earn_revenue_sweep" to "authenticated";

grant select on table "public"."send_earn_revenue_sweep" to "authenticated";

grant trigger on table "public"."send_earn_revenue_sweep" to "authenticated";

grant truncate on table "public"."send_earn_revenue_sweep" to "authenticated";

grant update on table "public"."send_earn_revenue_sweep" to "authenticated";

grant delete on table "public"."send_earn_revenue_sweep" to "service_role";

grant insert on table "public"."send_earn_revenue_sweep" to "service_role";

grant references on table "public"."send_earn_revenue_sweep" to "service_role";

grant select on table "public"."send_earn_revenue_sweep" to "service_role";

grant trigger on table "public"."send_earn_revenue_sweep" to "service_role";

grant truncate on table "public"."send_earn_revenue_sweep" to "service_role";

grant update on table "public"."send_earn_revenue_sweep" to "service_role";

grant delete on table "public"."send_earn_reward_claims" to "anon";

grant insert on table "public"."send_earn_reward_claims" to "anon";

grant references on table "public"."send_earn_reward_claims" to "anon";

grant select on table "public"."send_earn_reward_claims" to "anon";

grant trigger on table "public"."send_earn_reward_claims" to "anon";

grant truncate on table "public"."send_earn_reward_claims" to "anon";

grant update on table "public"."send_earn_reward_claims" to "anon";

grant delete on table "public"."send_earn_reward_claims" to "authenticated";

grant insert on table "public"."send_earn_reward_claims" to "authenticated";

grant references on table "public"."send_earn_reward_claims" to "authenticated";

grant select on table "public"."send_earn_reward_claims" to "authenticated";

grant trigger on table "public"."send_earn_reward_claims" to "authenticated";

grant truncate on table "public"."send_earn_reward_claims" to "authenticated";

grant update on table "public"."send_earn_reward_claims" to "authenticated";

grant delete on table "public"."send_earn_reward_claims" to "service_role";

grant insert on table "public"."send_earn_reward_claims" to "service_role";

grant references on table "public"."send_earn_reward_claims" to "service_role";

grant select on table "public"."send_earn_reward_claims" to "service_role";

grant trigger on table "public"."send_earn_reward_claims" to "service_role";

grant truncate on table "public"."send_earn_reward_claims" to "service_role";

grant update on table "public"."send_earn_reward_claims" to "service_role";

create policy "send_earn_revenue_harvest viewable by authenticated users"
on "public"."send_earn_revenue_harvest"
as permissive
for select
to authenticated
using (true);


create policy "send_earn_revenue_sweep viewable by authenticated users"
on "public"."send_earn_revenue_sweep"
as permissive
for select
to authenticated
using (true);


create policy "send_earn_reward_claims viewable by authenticated users"
on "public"."send_earn_reward_claims"
as permissive
for select
to authenticated
using (true);



