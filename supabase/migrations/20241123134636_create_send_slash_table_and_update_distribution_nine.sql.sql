-- Change the amount of the distribution to 300,000,000 SEND
UPDATE
  public.distributions
SET
  amount = 300000000 -- 300,000,000 SEND
WHERE
  id = 9;

CREATE INDEX idx_transfers_composite ON send_token_transfers(block_time, f, t, v);

-- Add send_ceiling verification type
ALTER TYPE public.verification_type
  ADD VALUE IF NOT EXISTS 'send_ceiling';

-- Create new table for send slash settings
CREATE TABLE "public"."send_slash"(
  "distribution_number" integer PRIMARY KEY,
  "minimum_sends" smallint DEFAULT '1' ::smallint NOT NULL,
  "scaling_divisor" smallint DEFAULT '1' ::smallint NOT NULL,
  CONSTRAINT "send_slash_distribution_number_fkey" FOREIGN KEY ("distribution_number") REFERENCES "public"."distributions"("number") ON DELETE CASCADE
);

ALTER TABLE send_slash ENABLE ROW LEVEL SECURITY;

-- Add amount_after_slash column to distribution_shares
ALTER TABLE public.distribution_shares
  ADD COLUMN amount_after_slash numeric NOT NULL DEFAULT 0;

UPDATE
  public.distribution_shares
SET
  amount_after_slash = amount;

-- After update, we could remove the default if desired
ALTER TABLE public.distribution_shares
  ALTER COLUMN amount_after_slash DROP DEFAULT;

INSERT INTO public.send_slash(
  distribution_number,
  minimum_sends,
  scaling_divisor)
VALUES (
  9,
  50,
  3);

CREATE OR REPLACE FUNCTION public.update_distribution_shares(distribution_id integer, shares distribution_shares[])
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
BEGIN
  -- validate shares are greater than 0
  IF(
    SELECT
      count(*)
    FROM
      unnest(shares) shares
    WHERE
      shares.amount_after_slash <= 0) > 0 THEN
    RAISE EXCEPTION 'Shares must be greater than 0.';
  END IF;
  -- get the distribution
  IF(
    SELECT
      1
    FROM
      distributions d
    WHERE
      d.id = $1
    LIMIT 1) IS NULL THEN
    RAISE EXCEPTION 'Distribution not found.';
  END IF;
  -- validate shares are for the correct distribution
  IF(
    SELECT
      count(DISTINCT id)
    FROM
      distributions
    WHERE
      id IN(
      SELECT
        shares.distribution_id
      FROM
        unnest(shares) shares)) <> 1 THEN
    RAISE EXCEPTION 'Shares are for the wrong distribution.';
  END IF;
  -- delete existing shares
  DELETE FROM distribution_shares
  WHERE distribution_shares.distribution_id = $1;
  -- insert new shares
  INSERT INTO distribution_shares(
    distribution_id,
    user_id,
    address,
    amount,
    amount_after_slash,
    hodler_pool_amount,
    bonus_pool_amount,
    fixed_pool_amount,
    "index")
  SELECT
    update_distribution_shares.distribution_id,
    shares.user_id,
    shares.address,
    shares.amount,
    shares.amount_after_slash,
    shares.hodler_pool_amount,
    shares.bonus_pool_amount,
    shares.fixed_pool_amount,
    row_number() OVER(PARTITION BY update_distribution_shares.distribution_id ORDER BY shares.address) - 1 AS "index"
  FROM
    unnest(shares) shares
ORDER BY
  shares.address;
END;
$function$;

