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
    "token" bytea,
    "amount" numeric,
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
    "token" bytea,
    "amount" numeric,
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

CREATE INDEX idx_send_check_claimed_ephemeral_chain_abi ON public.send_check_claimed USING btree (ephemeral_address, chain_id, abi_idx);

CREATE INDEX idx_send_check_claimed_redeemer ON public.send_check_claimed USING btree (redeemer);

CREATE INDEX idx_send_check_claimed_sender ON public.send_check_claimed USING btree (sender);

CREATE INDEX idx_send_check_created_block_num ON public.send_check_created USING btree (block_num);

CREATE INDEX idx_send_check_created_ephemeral_chain_abi ON public.send_check_created USING btree (ephemeral_address, chain_id, abi_idx);

CREATE INDEX idx_send_check_created_expires_at ON public.send_check_created USING btree (expires_at);

CREATE INDEX idx_send_check_created_sender ON public.send_check_created USING btree (sender);

CREATE UNIQUE INDEX send_check_claimed_pkey ON public.send_check_claimed USING btree (id);

CREATE UNIQUE INDEX send_check_created_pkey ON public.send_check_created USING btree (id);

CREATE UNIQUE INDEX u_send_check_claimed ON public.send_check_claimed USING btree (ig_name, src_name, block_num, tx_idx, log_idx, abi_idx);

CREATE UNIQUE INDEX u_send_check_created ON public.send_check_created USING btree (ig_name, src_name, block_num, tx_idx, log_idx, abi_idx);

alter table "public"."send_check_claimed" add constraint "send_check_claimed_pkey" PRIMARY KEY using index "send_check_claimed_pkey";

alter table "public"."send_check_created" add constraint "send_check_created_pkey" PRIMARY KEY using index "send_check_created_pkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.get_check_by_ephemeral_address(check_ephemeral_address bytea, check_chain_id numeric)
 RETURNS TABLE(ephemeral_address bytea, sender bytea, chain_id numeric, block_time numeric, tx_hash bytea, block_num numeric, expires_at numeric, tokens bytea[], amounts numeric[], is_expired boolean, is_claimed boolean, claimed_by bytea, claimed_at numeric, is_active boolean, is_canceled boolean)
 LANGUAGE sql
 STABLE
AS $function$
SELECT
    c.ephemeral_address,
    c.sender,
    c.chain_id,
    MAX(c.block_time) AS block_time,
    (array_agg(c.tx_hash))[1] AS tx_hash,
    MAX(c.block_num) AS block_num,
    MAX(c.expires_at) AS expires_at,
    array_agg(c.token ORDER BY c.abi_idx) AS tokens,
    array_agg(c.amount ORDER BY c.abi_idx) AS amounts,
    (MAX(c.expires_at) <= EXTRACT(EPOCH FROM NOW()))::boolean AS is_expired,
    bool_or(cl.id IS NOT NULL) AS is_claimed,
    (array_agg(cl.redeemer) FILTER (WHERE cl.redeemer IS NOT NULL))[1] AS claimed_by,
    MAX(cl.block_time) AS claimed_at,
    (NOT bool_or(cl.id IS NOT NULL) AND MAX(c.expires_at) > EXTRACT(EPOCH FROM NOW()))::boolean AS is_active,
    (bool_or(cl.id IS NOT NULL) AND (array_agg(cl.redeemer) FILTER (WHERE cl.redeemer IS NOT NULL))[1] = c.sender)::boolean AS is_canceled
FROM "public"."send_check_created" c
LEFT JOIN "public"."send_check_claimed" cl
    ON c.ephemeral_address = cl.ephemeral_address
    AND c.chain_id = cl.chain_id
    AND c.abi_idx = cl.abi_idx
WHERE c.ephemeral_address = check_ephemeral_address
    AND c.chain_id = check_chain_id
GROUP BY c.ephemeral_address, c.sender, c.chain_id;
$function$
;

CREATE OR REPLACE FUNCTION public.get_user_checks(user_address bytea, page_limit integer DEFAULT 50, page_offset integer DEFAULT 0)
 RETURNS TABLE(ephemeral_address bytea, sender bytea, chain_id numeric, block_time numeric, tx_hash bytea, block_num numeric, expires_at numeric, tokens bytea[], amounts numeric[], is_expired boolean, is_claimed boolean, claimed_by bytea, claimed_at numeric, is_active boolean, is_canceled boolean, is_sender boolean)
 LANGUAGE sql
 STABLE
AS $function$
WITH sent_checks AS (
    -- Checks sent by the user
    SELECT
        c.ephemeral_address,
        c.sender,
        c.chain_id,
        MAX(c.block_time) AS block_time,
        (array_agg(c.tx_hash))[1] AS tx_hash,
        MAX(c.block_num) AS block_num,
        MAX(c.expires_at) AS expires_at,
        array_agg(c.token ORDER BY c.abi_idx) AS tokens,
        array_agg(c.amount ORDER BY c.abi_idx) AS amounts,
        (MAX(c.expires_at) <= EXTRACT(EPOCH FROM NOW()))::boolean AS is_expired,
        bool_or(cl.id IS NOT NULL) AS is_claimed,
        (array_agg(cl.redeemer) FILTER (WHERE cl.redeemer IS NOT NULL))[1] AS claimed_by,
        MAX(cl.block_time) AS claimed_at,
        (NOT bool_or(cl.id IS NOT NULL) AND MAX(c.expires_at) > EXTRACT(EPOCH FROM NOW()))::boolean AS is_active,
        (bool_or(cl.id IS NOT NULL) AND (array_agg(cl.redeemer) FILTER (WHERE cl.redeemer IS NOT NULL))[1] = c.sender)::boolean AS is_canceled,
        true AS is_sender
    FROM "public"."send_check_created" c
    LEFT JOIN "public"."send_check_claimed" cl
        ON c.ephemeral_address = cl.ephemeral_address
        AND c.chain_id = cl.chain_id
        AND c.abi_idx = cl.abi_idx
    WHERE c.sender = user_address
    GROUP BY c.ephemeral_address, c.sender, c.chain_id
),
received_checks AS (
    -- Checks claimed by the user (where they are not the sender)
    SELECT
        c.ephemeral_address,
        c.sender,
        c.chain_id,
        MAX(c.block_time) AS block_time,
        (array_agg(c.tx_hash))[1] AS tx_hash,
        MAX(c.block_num) AS block_num,
        MAX(c.expires_at) AS expires_at,
        array_agg(c.token ORDER BY c.abi_idx) AS tokens,
        array_agg(c.amount ORDER BY c.abi_idx) AS amounts,
        (MAX(c.expires_at) <= EXTRACT(EPOCH FROM NOW()))::boolean AS is_expired,
        true AS is_claimed,
        (array_agg(cl.redeemer) FILTER (WHERE cl.redeemer IS NOT NULL))[1] AS claimed_by,
        MAX(cl.block_time) AS claimed_at,
        false AS is_active,
        false AS is_canceled,
        false AS is_sender
    FROM "public"."send_check_created" c
    INNER JOIN "public"."send_check_claimed" cl
        ON c.ephemeral_address = cl.ephemeral_address
        AND c.chain_id = cl.chain_id
        AND c.abi_idx = cl.abi_idx
    WHERE cl.redeemer = user_address
        AND c.sender != user_address
    GROUP BY c.ephemeral_address, c.sender, c.chain_id
)
SELECT * FROM (
    SELECT * FROM sent_checks
    UNION ALL
    SELECT * FROM received_checks
) combined
ORDER BY
    -- Active checks first (only sent checks can be active)
    is_active DESC,
    -- Expired but unclaimed checks second (need action from sender to reclaim)
    (NOT is_claimed AND is_expired) DESC,
    -- Then by block_time descending
    block_time DESC
LIMIT page_limit
OFFSET page_offset;
$function$
;

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

create policy "anon and authenticated can read send check claimed"
on "public"."send_check_claimed"
as permissive
for select
to anon, authenticated
using (true);


create policy "anon and authenticated can read send check created"
on "public"."send_check_created"
as permissive
for select
to anon, authenticated
using (true);



