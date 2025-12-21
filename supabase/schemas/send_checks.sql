-- Function to get paginated checks for a sender with claim status
-- Aggregates multiple tokens per check into arrays
-- Active checks (not claimed, not expired) come first, then history by date descending
CREATE OR REPLACE FUNCTION public.get_user_checks(
    user_address bytea,
    page_limit integer DEFAULT 50,
    page_offset integer DEFAULT 0
)
RETURNS TABLE(
    ephemeral_address bytea,
    sender bytea,
    chain_id numeric,
    block_time numeric,
    tx_hash bytea,
    block_num numeric,
    expires_at numeric,
    tokens bytea[],
    amounts numeric[],
    is_expired boolean,
    is_claimed boolean,
    claimed_by bytea,
    claimed_at numeric,
    is_active boolean
)
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
    (NOT bool_or(cl.id IS NOT NULL) AND MAX(c.expires_at) > EXTRACT(EPOCH FROM NOW()))::boolean AS is_active
FROM "public"."send_check_created" c
LEFT JOIN "public"."send_check_claimed" cl
    ON c.ephemeral_address = cl.ephemeral_address
    AND c.chain_id = cl.chain_id
    AND c.abi_idx = cl.abi_idx
WHERE c.sender = user_address
GROUP BY c.ephemeral_address, c.sender, c.chain_id
ORDER BY
    (NOT bool_or(cl.id IS NOT NULL) AND MAX(c.expires_at) > EXTRACT(EPOCH FROM NOW())) DESC,
    MAX(c.block_time) DESC
LIMIT page_limit
OFFSET page_offset;
$function$;

ALTER FUNCTION "public"."get_user_checks"(bytea, integer, integer) OWNER TO "postgres";

REVOKE ALL ON FUNCTION "public"."get_user_checks"(bytea, integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION "public"."get_user_checks"(bytea, integer, integer) TO "anon";
GRANT EXECUTE ON FUNCTION "public"."get_user_checks"(bytea, integer, integer) TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."get_user_checks"(bytea, integer, integer) TO "service_role";
