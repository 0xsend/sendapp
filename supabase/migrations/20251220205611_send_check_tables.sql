create sequence "public"."send_check_claimed_id_seq";

create sequence "public"."send_check_created_id_seq";

create table "public"."send_check_claimed" (
    "id" integer not null default nextval('send_check_claimed_id_seq'::regclass),
    "chain_id" numeric,
    "log_addr" bytea,
    "block_time" numeric,
    "tx_hash" bytea,
    "tx_idx" numeric,
    "ephemeral_address" bytea,
    "sender" bytea,
    "amount" numeric,
    "token" bytea,
    "expires_at" numeric,
    "redeemer" bytea,
    "ig_name" text,
    "src_name" text,
    "block_num" numeric,
    "log_idx" integer,
    "abi_idx" smallint
);


alter table "public"."send_check_claimed" enable row level security;

create table "public"."send_check_created" (
    "id" integer not null default nextval('send_check_created_id_seq'::regclass),
    "chain_id" numeric,
    "log_addr" bytea,
    "block_time" numeric,
    "tx_hash" bytea,
    "tx_idx" numeric,
    "ephemeral_address" bytea,
    "sender" bytea,
    "amount" numeric,
    "token" bytea,
    "expires_at" numeric,
    "ig_name" text,
    "src_name" text,
    "block_num" numeric,
    "log_idx" integer,
    "abi_idx" smallint
);


alter table "public"."send_check_created" enable row level security;

alter sequence "public"."send_check_claimed_id_seq" owned by "public"."send_check_claimed"."id";

alter sequence "public"."send_check_created_id_seq" owned by "public"."send_check_created"."id";

CREATE INDEX idx_send_check_claimed_block_num ON public.send_check_claimed USING btree (block_num);

CREATE INDEX idx_send_check_claimed_ephemeral_address ON public.send_check_claimed USING btree (ephemeral_address);

CREATE INDEX idx_send_check_claimed_redeemer ON public.send_check_claimed USING btree (redeemer);

CREATE INDEX idx_send_check_claimed_sender ON public.send_check_claimed USING btree (sender);

CREATE INDEX idx_send_check_created_block_num ON public.send_check_created USING btree (block_num);

CREATE INDEX idx_send_check_created_ephemeral_address ON public.send_check_created USING btree (ephemeral_address);

CREATE INDEX idx_send_check_created_expires_at ON public.send_check_created USING btree (expires_at);

CREATE INDEX idx_send_check_created_sender ON public.send_check_created USING btree (sender);

CREATE UNIQUE INDEX send_check_claimed_pkey ON public.send_check_claimed USING btree (id);

CREATE UNIQUE INDEX send_check_created_pkey ON public.send_check_created USING btree (id);

CREATE UNIQUE INDEX u_send_check_claimed ON public.send_check_claimed USING btree (ig_name, src_name, block_num, tx_idx, log_idx, abi_idx);

CREATE UNIQUE INDEX u_send_check_created ON public.send_check_created USING btree (ig_name, src_name, block_num, tx_idx, log_idx, abi_idx);

alter table "public"."send_check_claimed" add constraint "send_check_claimed_pkey" PRIMARY KEY using index "send_check_claimed_pkey";

alter table "public"."send_check_created" add constraint "send_check_created_pkey" PRIMARY KEY using index "send_check_created_pkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.get_user_active_checks(user_address bytea)
 RETURNS TABLE(id integer, chain_id numeric, block_time numeric, tx_hash bytea, ephemeral_address bytea, sender bytea, amount numeric, token bytea, expires_at numeric, block_num numeric, is_expired boolean)
 LANGUAGE sql
 STABLE
AS $function$
SELECT
    c.id,
    c.chain_id,
    c.block_time,
    c.tx_hash,
    c.ephemeral_address,
    c.sender,
    c.amount,
    c.token,
    c.expires_at,
    c.block_num,
    c.is_expired
FROM "public"."send_checks_active" c
WHERE c.sender = user_address
ORDER BY c.block_time DESC;
$function$
;

CREATE OR REPLACE FUNCTION public.get_user_checks_history(user_address bytea)
 RETURNS TABLE(id integer, chain_id numeric, block_time numeric, tx_hash bytea, ephemeral_address bytea, sender bytea, amount numeric, token bytea, expires_at numeric, block_num numeric, is_claimed boolean, claimed_by bytea, claimed_at numeric)
 LANGUAGE sql
 STABLE
AS $function$
SELECT
    c.id,
    c.chain_id,
    c.block_time,
    c.tx_hash,
    c.ephemeral_address,
    c.sender,
    c.amount,
    c.token,
    c.expires_at,
    c.block_num,
    (cl.id IS NOT NULL)::boolean AS is_claimed,
    cl.redeemer AS claimed_by,
    cl.block_time AS claimed_at
FROM "public"."send_check_created" c
LEFT JOIN "public"."send_check_claimed" cl
    ON c.ephemeral_address = cl.ephemeral_address
    AND c.chain_id = cl.chain_id
WHERE c.sender = user_address
ORDER BY c.block_time DESC;
$function$
;

create or replace view "public"."send_checks_active" as  SELECT c.id,
    c.chain_id,
    c.block_time,
    c.tx_hash,
    c.ephemeral_address,
    c.sender,
    c.amount,
    c.token,
    c.expires_at,
    c.block_num,
    (c.expires_at <= EXTRACT(epoch FROM now())) AS is_expired
   FROM (send_check_created c
     LEFT JOIN send_check_claimed cl ON (((c.ephemeral_address = cl.ephemeral_address) AND (c.chain_id = cl.chain_id))))
  WHERE (cl.id IS NULL);


grant delete on table "public"."send_check_claimed" to "anon";

grant insert on table "public"."send_check_claimed" to "anon";

grant references on table "public"."send_check_claimed" to "anon";

grant select on table "public"."send_check_claimed" to "anon";

grant trigger on table "public"."send_check_claimed" to "anon";

grant truncate on table "public"."send_check_claimed" to "anon";

grant update on table "public"."send_check_claimed" to "anon";

grant delete on table "public"."send_check_claimed" to "authenticated";

grant insert on table "public"."send_check_claimed" to "authenticated";

grant references on table "public"."send_check_claimed" to "authenticated";

grant select on table "public"."send_check_claimed" to "authenticated";

grant trigger on table "public"."send_check_claimed" to "authenticated";

grant truncate on table "public"."send_check_claimed" to "authenticated";

grant update on table "public"."send_check_claimed" to "authenticated";

grant delete on table "public"."send_check_claimed" to "service_role";

grant insert on table "public"."send_check_claimed" to "service_role";

grant references on table "public"."send_check_claimed" to "service_role";

grant select on table "public"."send_check_claimed" to "service_role";

grant trigger on table "public"."send_check_claimed" to "service_role";

grant truncate on table "public"."send_check_claimed" to "service_role";

grant update on table "public"."send_check_claimed" to "service_role";

grant delete on table "public"."send_check_created" to "anon";

grant insert on table "public"."send_check_created" to "anon";

grant references on table "public"."send_check_created" to "anon";

grant select on table "public"."send_check_created" to "anon";

grant trigger on table "public"."send_check_created" to "anon";

grant truncate on table "public"."send_check_created" to "anon";

grant update on table "public"."send_check_created" to "anon";

grant delete on table "public"."send_check_created" to "authenticated";

grant insert on table "public"."send_check_created" to "authenticated";

grant references on table "public"."send_check_created" to "authenticated";

grant select on table "public"."send_check_created" to "authenticated";

grant trigger on table "public"."send_check_created" to "authenticated";

grant truncate on table "public"."send_check_created" to "authenticated";

grant update on table "public"."send_check_created" to "authenticated";

grant delete on table "public"."send_check_created" to "service_role";

grant insert on table "public"."send_check_created" to "service_role";

grant references on table "public"."send_check_created" to "service_role";

grant select on table "public"."send_check_created" to "service_role";

grant trigger on table "public"."send_check_created" to "service_role";

grant truncate on table "public"."send_check_created" to "service_role";

grant update on table "public"."send_check_created" to "service_role";

create policy "authenticated can read send check claimed"
on "public"."send_check_claimed"
as permissive
for select
to authenticated
using (true);


create policy "authenticated can read send check created"
on "public"."send_check_created"
as permissive
for select
to authenticated
using (true);



