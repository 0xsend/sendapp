-- View to get active (unclaimed) checks
-- A check is active if it was created but not claimed
CREATE OR REPLACE VIEW "public"."send_checks_active" AS
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
    -- Computed fields
    (c.expires_at <= EXTRACT(EPOCH FROM NOW()))::boolean AS is_expired
FROM "public"."send_check_created" c
LEFT JOIN "public"."send_check_claimed" cl
    ON c.ephemeral_address = cl.ephemeral_address
    AND c.chain_id = cl.chain_id
WHERE cl.id IS NULL;

ALTER VIEW "public"."send_checks_active" OWNER TO "postgres";

-- Grant access to the view
GRANT SELECT ON "public"."send_checks_active" TO "anon";
GRANT SELECT ON "public"."send_checks_active" TO "authenticated";
GRANT SELECT ON "public"."send_checks_active" TO "service_role";

-- Function to get active checks for a sender address
CREATE OR REPLACE FUNCTION public.get_user_active_checks(user_address bytea)
RETURNS TABLE(
    id integer,
    chain_id numeric,
    block_time numeric,
    tx_hash bytea,
    ephemeral_address bytea,
    sender bytea,
    amount numeric,
    token bytea,
    expires_at numeric,
    block_num numeric,
    is_expired boolean
)
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
$function$;

ALTER FUNCTION "public"."get_user_active_checks"("user_address" bytea) OWNER TO "postgres";

REVOKE ALL ON FUNCTION "public"."get_user_active_checks"("user_address" bytea) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_user_active_checks"("user_address" bytea) TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_active_checks"("user_address" bytea) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_active_checks"("user_address" bytea) TO "service_role";

-- Function to get all checks created by a sender (including claimed ones)
CREATE OR REPLACE FUNCTION public.get_user_checks_history(user_address bytea)
RETURNS TABLE(
    id integer,
    chain_id numeric,
    block_time numeric,
    tx_hash bytea,
    ephemeral_address bytea,
    sender bytea,
    amount numeric,
    token bytea,
    expires_at numeric,
    block_num numeric,
    is_claimed boolean,
    claimed_by bytea,
    claimed_at numeric
)
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
$function$;

ALTER FUNCTION "public"."get_user_checks_history"("user_address" bytea) OWNER TO "postgres";

REVOKE ALL ON FUNCTION "public"."get_user_checks_history"("user_address" bytea) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_user_checks_history"("user_address" bytea) TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_checks_history"("user_address" bytea) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_checks_history"("user_address" bytea) TO "service_role";
