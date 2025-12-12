-- Add balance_rank column to distribution_shares
-- This stores the user's rank position (0-based index) within the distribution cohort
-- The value represents where the user ranks among qualifying distribution participants after slashing,
-- with 0 being lowest and higher numbers representing higher effective balance
-- This rank is calculated for all distribution modes, not just sigmoid
-- Clients can calculate percentile or other transformations using: (rank / (total_count - 1)) * 100

ALTER TABLE "public"."distribution_shares"
ADD COLUMN IF NOT EXISTS "balance_rank" integer;

COMMENT ON COLUMN "public"."distribution_shares"."balance_rank" IS 'User rank position (0-based index) within the distribution cohort based on effective balance rank after qualification and slashing. Clients can calculate percentile using: (rank / (total_count - 1)) * 100';

-- Add verified_count column to distributions
-- This tracks the count of verified users (users with distribution_shares rows) for this distribution
ALTER TABLE "public"."distributions"
ADD COLUMN IF NOT EXISTS "verified_count" integer DEFAULT 0 NOT NULL;

COMMENT ON COLUMN "public"."distributions"."verified_count" IS 'Count of verified users who have distribution_shares for this distribution. Updated when distribution_shares are saved.';

-- Backfill verified_count for existing distributions
UPDATE "public"."distributions" d
SET verified_count = (
  SELECT COUNT(*)
  FROM "public"."distribution_shares" ds
  WHERE ds.distribution_id = d.id
);

-- Update the update_distribution_shares function to set the verified_count
CREATE OR REPLACE FUNCTION "public"."update_distribution_shares"("distribution_id" integer, "shares" "public"."distribution_shares"[]) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $_$
BEGIN
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
    hodler_pool_amount,
    bonus_pool_amount,
    fixed_pool_amount,
    "index")
  SELECT
    update_distribution_shares.distribution_id,
    shares.user_id,
    shares.address,
    shares.amount,
    shares.hodler_pool_amount,
    shares.bonus_pool_amount,
    shares.fixed_pool_amount,
    row_number() OVER(PARTITION BY update_distribution_shares.distribution_id ORDER BY shares.address) - 1 AS "index"
  FROM
    unnest(shares) shares
ORDER BY
  shares.address;
  -- Update the verified_count on the distribution
  UPDATE distributions
  SET verified_count = (
    SELECT COUNT(*)
    FROM distribution_shares
    WHERE distribution_shares.distribution_id = $1
  )
  WHERE id = $1;
  -- Refresh profile verification status after batch update
  -- This ensures verified_at is correctly set based on the updated shares
  PERFORM refresh_profile_verification_status();
END;
$_$;

ALTER FUNCTION "public"."update_distribution_shares"("distribution_id" integer, "shares" "public"."distribution_shares"[]) OWNER TO "postgres";
