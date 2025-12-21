drop function if exists "public"."get_user_active_checks"(user_address bytea);

drop function if exists "public"."get_user_checks_history"(user_address bytea);

drop view if exists "public"."send_checks_active";

alter table "public"."send_check_claimed" drop column "amounts";

alter table "public"."send_check_claimed" drop column "tokens";

alter table "public"."send_check_created" drop column "amounts";

alter table "public"."send_check_created" drop column "tokens";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.get_user_active_checks(user_address bytea)
 RETURNS TABLE(id integer, chain_id numeric, block_time numeric, tx_hash bytea, ephemeral_address bytea, sender bytea, expires_at numeric, block_num numeric, is_expired boolean)
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
    c.expires_at,
    c.block_num,
    c.is_expired
FROM "public"."send_checks_active" c
WHERE c.sender = user_address
ORDER BY c.block_time DESC;
$function$
;

CREATE OR REPLACE FUNCTION public.get_user_checks_history(user_address bytea)
 RETURNS TABLE(id integer, chain_id numeric, block_time numeric, tx_hash bytea, ephemeral_address bytea, sender bytea, expires_at numeric, block_num numeric, is_claimed boolean, claimed_by bytea, claimed_at numeric)
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
    c.expires_at,
    c.block_num,
    (c.expires_at <= EXTRACT(epoch FROM now())) AS is_expired
   FROM (send_check_created c
     LEFT JOIN send_check_claimed cl ON (((c.ephemeral_address = cl.ephemeral_address) AND (c.chain_id = cl.chain_id))))
  WHERE (cl.id IS NULL);



