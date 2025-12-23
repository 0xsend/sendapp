drop function if exists "public"."get_check_by_ephemeral_address"(check_ephemeral_address bytea, check_chain_id numeric);

drop function if exists "public"."get_user_checks"(user_address bytea, page_limit integer, page_offset integer);

create table "public"."send_check_notes" (
    "ephemeral_address" bytea not null,
    "chain_id" numeric not null,
    "note" text not null,
    "created_at" timestamp with time zone not null default CURRENT_TIMESTAMP
);


alter table "public"."send_check_notes" enable row level security;

CREATE INDEX idx_send_check_notes_created_at ON public.send_check_notes USING btree (created_at);

CREATE UNIQUE INDEX send_check_notes_pkey ON public.send_check_notes USING btree (ephemeral_address, chain_id);

alter table "public"."send_check_notes" add constraint "send_check_notes_pkey" PRIMARY KEY using index "send_check_notes_pkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.get_check_by_ephemeral_address(check_ephemeral_address bytea, check_chain_id numeric)
 RETURNS TABLE(ephemeral_address bytea, sender bytea, chain_id numeric, block_time numeric, tx_hash bytea, block_num numeric, expires_at numeric, tokens bytea[], amounts numeric[], is_expired boolean, is_claimed boolean, claimed_by bytea, claimed_at numeric, is_active boolean, is_canceled boolean, note text)
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
    (bool_or(cl.id IS NOT NULL) AND (array_agg(cl.redeemer) FILTER (WHERE cl.redeemer IS NOT NULL))[1] = c.sender)::boolean AS is_canceled,
    MAX(n.note) AS note
FROM "public"."send_check_created" c
LEFT JOIN "public"."send_check_claimed" cl
    ON c.ephemeral_address = cl.ephemeral_address
    AND c.chain_id = cl.chain_id
    AND c.abi_idx = cl.abi_idx
LEFT JOIN "public"."send_check_notes" n
    ON c.ephemeral_address = n.ephemeral_address
    AND c.chain_id = n.chain_id
WHERE c.ephemeral_address = check_ephemeral_address
    AND c.chain_id = check_chain_id
GROUP BY c.ephemeral_address, c.sender, c.chain_id;
$function$
;

CREATE OR REPLACE FUNCTION public.get_user_checks(user_address bytea, page_limit integer DEFAULT 50, page_offset integer DEFAULT 0)
 RETURNS TABLE(ephemeral_address bytea, sender bytea, chain_id numeric, block_time numeric, tx_hash bytea, block_num numeric, expires_at numeric, tokens bytea[], amounts numeric[], is_expired boolean, is_claimed boolean, claimed_by bytea, claimed_at numeric, is_active boolean, is_canceled boolean, is_sender boolean, note text)
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
SELECT
    combined.ephemeral_address,
    combined.sender,
    combined.chain_id,
    combined.block_time,
    combined.tx_hash,
    combined.block_num,
    combined.expires_at,
    combined.tokens,
    combined.amounts,
    combined.is_expired,
    combined.is_claimed,
    combined.claimed_by,
    combined.claimed_at,
    combined.is_active,
    combined.is_canceled,
    combined.is_sender,
    n.note
FROM (
    SELECT * FROM sent_checks
    UNION ALL
    SELECT * FROM received_checks
) combined
LEFT JOIN "public"."send_check_notes" n
    ON combined.ephemeral_address = n.ephemeral_address
    AND combined.chain_id = n.chain_id
ORDER BY
    -- Active checks first (only sent checks can be active)
    combined.is_active DESC,
    -- Expired but unclaimed checks second (need action from sender to reclaim)
    (NOT combined.is_claimed AND combined.is_expired) DESC,
    -- Then by block_time descending
    combined.block_time DESC
LIMIT page_limit
OFFSET page_offset;
$function$
;

grant delete on table "public"."send_check_notes" to "anon";

grant insert on table "public"."send_check_notes" to "anon";

grant references on table "public"."send_check_notes" to "anon";

grant select on table "public"."send_check_notes" to "anon";

grant trigger on table "public"."send_check_notes" to "anon";

grant truncate on table "public"."send_check_notes" to "anon";

grant update on table "public"."send_check_notes" to "anon";

grant delete on table "public"."send_check_notes" to "authenticated";

grant insert on table "public"."send_check_notes" to "authenticated";

grant references on table "public"."send_check_notes" to "authenticated";

grant select on table "public"."send_check_notes" to "authenticated";

grant trigger on table "public"."send_check_notes" to "authenticated";

grant truncate on table "public"."send_check_notes" to "authenticated";

grant update on table "public"."send_check_notes" to "authenticated";

grant delete on table "public"."send_check_notes" to "service_role";

grant insert on table "public"."send_check_notes" to "service_role";

grant references on table "public"."send_check_notes" to "service_role";

grant select on table "public"."send_check_notes" to "service_role";

grant trigger on table "public"."send_check_notes" to "service_role";

grant truncate on table "public"."send_check_notes" to "service_role";

grant update on table "public"."send_check_notes" to "service_role";

create policy "sender can insert send check notes"
on "public"."send_check_notes"
as permissive
for insert
to authenticated
with check ((EXISTS ( SELECT 1
   FROM (send_check_created c
     JOIN send_accounts sa ON ((sa.address = (('0x'::text || encode(c.sender, 'hex'::text)))::citext)))
  WHERE ((c.ephemeral_address = send_check_notes.ephemeral_address) AND (c.chain_id = send_check_notes.chain_id) AND (sa.user_id = auth.uid())))));


create policy "sender or receiver can read send check notes"
on "public"."send_check_notes"
as permissive
for select
to authenticated
using (((EXISTS ( SELECT 1
   FROM (send_check_created c
     JOIN send_accounts sa ON ((sa.address = (('0x'::text || encode(c.sender, 'hex'::text)))::citext)))
  WHERE ((c.ephemeral_address = send_check_notes.ephemeral_address) AND (c.chain_id = send_check_notes.chain_id) AND (sa.user_id = auth.uid())))) OR (EXISTS ( SELECT 1
   FROM (send_check_claimed cl
     JOIN send_accounts sa ON ((sa.address = (('0x'::text || encode(cl.redeemer, 'hex'::text)))::citext)))
  WHERE ((cl.ephemeral_address = send_check_notes.ephemeral_address) AND (cl.chain_id = send_check_notes.chain_id) AND (sa.user_id = auth.uid()))))));



