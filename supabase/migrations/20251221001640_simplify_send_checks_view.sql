drop function if exists "public"."get_user_active_checks"(user_address bytea);

drop function if exists "public"."get_user_checks_history"(user_address bytea);

drop view if exists "public"."send_checks_active";

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
    cl.block_time AS claimed_at
   FROM (send_check_created c
     LEFT JOIN send_check_claimed cl ON (((c.ephemeral_address = cl.ephemeral_address) AND (c.chain_id = cl.chain_id) AND (c.abi_idx = cl.abi_idx))));



