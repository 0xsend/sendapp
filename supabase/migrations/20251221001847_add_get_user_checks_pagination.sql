set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.get_user_checks(user_address bytea, page_limit integer DEFAULT 20, page_offset integer DEFAULT 0)
 RETURNS TABLE(id integer, chain_id numeric, block_time numeric, tx_hash bytea, ephemeral_address bytea, sender bytea, token bytea, amount numeric, expires_at numeric, block_num numeric, abi_idx smallint, is_expired boolean, is_claimed boolean, claimed_by bytea, claimed_at numeric, is_active boolean)
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
    c.token,
    c.amount,
    c.expires_at,
    c.block_num,
    c.abi_idx,
    c.is_expired,
    c.is_claimed,
    c.claimed_by,
    c.claimed_at,
    c.is_active
FROM "public"."send_checks" c
WHERE c.sender = user_address
ORDER BY
    c.is_active DESC,  -- Active checks first
    c.block_time DESC  -- Then by date descending
LIMIT page_limit
OFFSET page_offset;
$function$
;

create or replace view "public"."send_checks" as  SELECT c.id,
    c.chain_id,
    c.block_time,
    c.tx_hash,
    c.ephemeral_address,
    c.sender,
    c.token,
    c.amount,
    c.expires_at,
    c.block_num,
    c.abi_idx,
    (c.expires_at <= EXTRACT(epoch FROM now())) AS is_expired,
    (cl.id IS NOT NULL) AS is_claimed,
    cl.redeemer AS claimed_by,
    cl.block_time AS claimed_at,
    ((cl.id IS NULL) AND (c.expires_at > EXTRACT(epoch FROM now()))) AS is_active
   FROM (send_check_created c
     LEFT JOIN send_check_claimed cl ON (((c.ephemeral_address = cl.ephemeral_address) AND (c.chain_id = cl.chain_id) AND (c.abi_idx = cl.abi_idx))));



