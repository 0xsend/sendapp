-- Function to get paginated checks for a user (both sent and received)
-- Aggregates multiple tokens per check into arrays
-- Active checks (not claimed, not expired) come first, then history by date descending
-- NOTE: Groups by tx_hash to handle edge case where same ephemeral_address was reused
-- (possible if a check was claimed quickly and a new check created before component unmounted)
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
    is_active boolean,
    is_canceled boolean,
    is_sender boolean,
    note text,
    is_potential_duplicate boolean
)
LANGUAGE sql
STABLE
AS $function$
WITH sent_checks AS (
    -- Checks sent by the user
    -- Group by tx_hash to treat each transaction as a separate check
    -- This handles the edge case where the same ephemeral_address was reused
    SELECT
        c.ephemeral_address,
        c.sender,
        c.chain_id,
        MAX(c.block_time) AS block_time,
        c.tx_hash,
        MAX(c.block_num) AS block_num,
        MAX(c.expires_at) AS expires_at,
        array_agg(c.token ORDER BY c.abi_idx) AS tokens,
        array_agg(c.amount ORDER BY c.abi_idx) AS amounts,
        (MAX(c.expires_at) <= EXTRACT(EPOCH FROM NOW()))::boolean AS is_expired,
        -- A claim applies to this check only if it joined (JOIN conditions handle the filtering)
        bool_or(cl.id IS NOT NULL) AS is_claimed,
        (array_agg(cl.redeemer) FILTER (WHERE cl.redeemer IS NOT NULL))[1] AS claimed_by,
        MAX(cl.block_time) AS claimed_at,
        (NOT bool_or(cl.id IS NOT NULL) AND MAX(c.expires_at) > EXTRACT(EPOCH FROM NOW()))::boolean AS is_active,
        (bool_or(cl.id IS NOT NULL) AND (array_agg(cl.redeemer) FILTER (WHERE cl.redeemer IS NOT NULL))[1] = c.sender)::boolean AS is_canceled,
        true AS is_sender,
        -- Check if this is a duplicate (not the first check with this ephemeral_address)
        -- Only subsequent checks are considered duplicates, not the original
        (EXISTS (
            SELECT 1 FROM send_check_created c2
            WHERE c2.ephemeral_address = c.ephemeral_address
            AND c2.chain_id = c.chain_id
            AND c2.block_num < c.block_num
        )) AS is_potential_duplicate
    FROM "public"."send_check_created" c
    LEFT JOIN "public"."send_check_claimed" cl
        ON c.ephemeral_address = cl.ephemeral_address
        AND c.chain_id = cl.chain_id
        AND c.abi_idx = cl.abi_idx
        -- Only join claims that are valid for THIS check:
        -- 1. Claim must be after this check was created
        AND cl.block_num > c.block_num
        -- 2. No other check was created between this check and the claim
        AND NOT EXISTS (
            SELECT 1 FROM send_check_created c2
            WHERE c2.ephemeral_address = c.ephemeral_address
            AND c2.chain_id = c.chain_id
            AND c2.block_num > c.block_num
            AND c2.block_num < cl.block_num
        )
    WHERE c.sender = user_address
    GROUP BY c.ephemeral_address, c.sender, c.chain_id, c.tx_hash, c.block_num
),
received_checks AS (
    -- Checks claimed by the user (where they are not the sender)
    -- For received checks, we join on the claim, so we group by the claim's tx_hash
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
        false AS is_sender,
        -- Check if this is a duplicate (not the first check with this ephemeral_address)
        -- Only subsequent checks are considered duplicates, not the original
        (EXISTS (
            SELECT 1 FROM send_check_created c2
            WHERE c2.ephemeral_address = c.ephemeral_address
            AND c2.chain_id = c.chain_id
            AND c2.block_num < c.block_num
        )) AS is_potential_duplicate
    FROM "public"."send_check_created" c
    INNER JOIN "public"."send_check_claimed" cl
        ON c.ephemeral_address = cl.ephemeral_address
        AND c.chain_id = cl.chain_id
        AND c.abi_idx = cl.abi_idx
        -- Only match claims that happened after this check was created
        AND cl.block_num > c.block_num
        -- And no other check was created with this ephemeral_address between creation and claim
        AND NOT EXISTS (
            SELECT 1 FROM send_check_created c2
            WHERE c2.ephemeral_address = c.ephemeral_address
            AND c2.chain_id = c.chain_id
            AND c2.block_num > c.block_num
            AND c2.block_num < cl.block_num
        )
    WHERE cl.redeemer = user_address
        AND c.sender != user_address
    GROUP BY c.ephemeral_address, c.sender, c.chain_id, cl.tx_hash, c.block_num
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
    n.note,
    combined.is_potential_duplicate
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
$function$;

ALTER FUNCTION "public"."get_user_checks"(bytea, integer, integer) OWNER TO "postgres";

REVOKE ALL ON FUNCTION "public"."get_user_checks"(bytea, integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION "public"."get_user_checks"(bytea, integer, integer) TO "anon";
GRANT EXECUTE ON FUNCTION "public"."get_user_checks"(bytea, integer, integer) TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."get_user_checks"(bytea, integer, integer) TO "service_role";

-- Function to get a single check by ephemeral address for claim flow
-- Returns same structure as get_user_checks for consistency
-- NOTE: Returns the most recent check creation for this ephemeral_address
-- to handle edge case where the same address was reused
CREATE OR REPLACE FUNCTION public.get_check_by_ephemeral_address(
    check_ephemeral_address bytea,
    check_chain_id numeric
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
    is_active boolean,
    is_canceled boolean,
    note text,
    is_potential_duplicate boolean
)
LANGUAGE sql
STABLE
AS $function$
WITH latest_check AS (
    -- Find the most recent check creation for this ephemeral_address
    SELECT DISTINCT ON (c.ephemeral_address, c.chain_id)
        c.tx_hash,
        c.block_num
    FROM "public"."send_check_created" c
    WHERE c.ephemeral_address = check_ephemeral_address
        AND c.chain_id = check_chain_id
    ORDER BY c.ephemeral_address, c.chain_id, c.block_num DESC
)
SELECT
    c.ephemeral_address,
    c.sender,
    c.chain_id,
    MAX(c.block_time) AS block_time,
    c.tx_hash,
    MAX(c.block_num) AS block_num,
    MAX(c.expires_at) AS expires_at,
    array_agg(c.token ORDER BY c.abi_idx) AS tokens,
    array_agg(c.amount ORDER BY c.abi_idx) AS amounts,
    (MAX(c.expires_at) <= EXTRACT(EPOCH FROM NOW()))::boolean AS is_expired,
    -- A claim applies to this check only if it happened after this check was created
    -- and no other check was created between this one and the claim
    bool_or(
        cl.id IS NOT NULL
        AND cl.block_num > c.block_num
        AND NOT EXISTS (
            SELECT 1 FROM send_check_created c2
            WHERE c2.ephemeral_address = c.ephemeral_address
            AND c2.chain_id = c.chain_id
            AND c2.block_num > c.block_num
            AND c2.block_num < cl.block_num
        )
    ) AS is_claimed,
    (array_agg(cl.redeemer) FILTER (
        WHERE cl.redeemer IS NOT NULL
        AND cl.block_num > c.block_num
        AND NOT EXISTS (
            SELECT 1 FROM send_check_created c2
            WHERE c2.ephemeral_address = c.ephemeral_address
            AND c2.chain_id = c.chain_id
            AND c2.block_num > c.block_num
            AND c2.block_num < cl.block_num
        )
    ))[1] AS claimed_by,
    MAX(cl.block_time) FILTER (
        WHERE cl.block_num > c.block_num
        AND NOT EXISTS (
            SELECT 1 FROM send_check_created c2
            WHERE c2.ephemeral_address = c.ephemeral_address
            AND c2.chain_id = c.chain_id
            AND c2.block_num > c.block_num
            AND c2.block_num < cl.block_num
        )
    ) AS claimed_at,
    (NOT bool_or(
        cl.id IS NOT NULL
        AND cl.block_num > c.block_num
        AND NOT EXISTS (
            SELECT 1 FROM send_check_created c2
            WHERE c2.ephemeral_address = c.ephemeral_address
            AND c2.chain_id = c.chain_id
            AND c2.block_num > c.block_num
            AND c2.block_num < cl.block_num
        )
    ) AND MAX(c.expires_at) > EXTRACT(EPOCH FROM NOW()))::boolean AS is_active,
    (bool_or(
        cl.id IS NOT NULL
        AND cl.block_num > c.block_num
        AND NOT EXISTS (
            SELECT 1 FROM send_check_created c2
            WHERE c2.ephemeral_address = c.ephemeral_address
            AND c2.chain_id = c.chain_id
            AND c2.block_num > c.block_num
            AND c2.block_num < cl.block_num
        )
    ) AND (array_agg(cl.redeemer) FILTER (
        WHERE cl.redeemer IS NOT NULL
        AND cl.block_num > c.block_num
        AND NOT EXISTS (
            SELECT 1 FROM send_check_created c2
            WHERE c2.ephemeral_address = c.ephemeral_address
            AND c2.chain_id = c.chain_id
            AND c2.block_num > c.block_num
            AND c2.block_num < cl.block_num
        )
    ))[1] = c.sender)::boolean AS is_canceled,
    MAX(n.note) AS note,
    -- Check if this is a duplicate (not the first check with this ephemeral_address)
    -- Only subsequent checks are considered duplicates, not the original
    (EXISTS (
        SELECT 1 FROM send_check_created c2
        WHERE c2.ephemeral_address = c.ephemeral_address
        AND c2.chain_id = c.chain_id
        AND c2.block_num < lc.block_num
    )) AS is_potential_duplicate
FROM "public"."send_check_created" c
INNER JOIN latest_check lc
    ON c.tx_hash = lc.tx_hash
LEFT JOIN "public"."send_check_claimed" cl
    ON c.ephemeral_address = cl.ephemeral_address
    AND c.chain_id = cl.chain_id
    AND c.abi_idx = cl.abi_idx
LEFT JOIN "public"."send_check_notes" n
    ON c.ephemeral_address = n.ephemeral_address
    AND c.chain_id = n.chain_id
WHERE c.ephemeral_address = check_ephemeral_address
    AND c.chain_id = check_chain_id
GROUP BY c.ephemeral_address, c.sender, c.chain_id, c.tx_hash, lc.block_num;
$function$;

ALTER FUNCTION "public"."get_check_by_ephemeral_address"(bytea, numeric) OWNER TO "postgres";

REVOKE ALL ON FUNCTION "public"."get_check_by_ephemeral_address"(bytea, numeric) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION "public"."get_check_by_ephemeral_address"(bytea, numeric) TO "anon";
GRANT EXECUTE ON FUNCTION "public"."get_check_by_ephemeral_address"(bytea, numeric) TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."get_check_by_ephemeral_address"(bytea, numeric) TO "service_role";
