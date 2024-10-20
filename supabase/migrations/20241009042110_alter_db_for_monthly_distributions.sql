ALTER TABLE public.distribution_verification_values
  ADD COLUMN multiplier_min NUMERIC(10, 4) NOT NULL DEFAULT 1.0,
  ADD COLUMN multiplier_max NUMERIC(10, 4) NOT NULL DEFAULT 1.0,
  ADD COLUMN multiplier_step NUMERIC(10, 4) NOT NULL DEFAULT 0.0;

ALTER TYPE public.verification_type
  ADD VALUE IF NOT EXISTS 'create_passkey';

ALTER TYPE public.verification_type
  ADD VALUE IF NOT EXISTS 'send_ten';

ALTER TYPE public.verification_type
  ADD VALUE IF NOT EXISTS 'send_one_hundred';

ALTER TYPE public.verification_type
  ADD VALUE IF NOT EXISTS 'total_tag_referrals';

DROP FUNCTION IF EXISTS public.distribution_hodler_addresses(integer);

CREATE OR REPLACE FUNCTION public.distribution_hodler_addresses(distribution_id integer)
  RETURNS SETOF send_accounts
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
BEGIN
  -- get the distribution
  IF(
    SELECT
      1
    FROM
      distributions
    WHERE
      id = distribution_id
    LIMIT 1) IS NULL THEN
    RAISE EXCEPTION 'Distribution not found.';
  END IF;
  -- return the hodler addresses that had no sells during the qualification period and have verifications
  RETURN query WITH sellers AS(
    -- find sellers during the qualification period
    SELECT
      lower(concat('0x', encode(f, 'hex')))::citext AS seller
    FROM
      distributions
      JOIN send_token_transfers ON to_timestamp(send_token_transfers.block_time) >= distributions.qualification_start
        AND to_timestamp(send_token_transfers.block_time) <= distributions.qualification_end
      JOIN send_liquidity_pools ON send_liquidity_pools.address = send_token_transfers.t
    WHERE
      distributions.id = $1)
    -- the hodler addresses that had no sells during the qualification period and have verifications
    SELECT DISTINCT
      send_accounts.*
    FROM
      distributions
      JOIN distribution_verifications ON distribution_verifications.distribution_id = distributions.id
      JOIN send_accounts ON send_accounts.user_id = distribution_verifications.user_id
    WHERE
      distributions.id = $1
      AND send_accounts.address NOT IN(
        SELECT
          seller
        FROM
          sellers);
END;
$function$;

-- only service role can execute this function
REVOKE EXECUTE ON FUNCTION "public"."distribution_hodler_addresses"(integer) FROM PUBLIC;

REVOKE EXECUTE ON FUNCTION "public"."distribution_hodler_addresses"(integer) FROM anon;

REVOKE EXECUTE ON FUNCTION "public"."distribution_hodler_addresses"(integer) FROM authenticated;

