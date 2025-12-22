drop function if exists "public"."get_user_checks"(user_address bytea, page_limit integer, page_offset integer);

set check_function_bodies = off;

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


