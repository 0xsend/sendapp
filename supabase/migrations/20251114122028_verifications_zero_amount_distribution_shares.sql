set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.update_distribution_shares(distribution_id integer, shares distribution_shares[])
 RETURNS void
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
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_referral_verifications(distribution_id integer, shares distribution_shares[])
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    -- Create temp table for shares lookup with amount
    CREATE TEMPORARY TABLE temp_shares ON COMMIT DROP AS
    SELECT user_id, SUM(amount) as amount
    FROM unnest(shares) ds
    GROUP BY user_id;

    -- Update tag_referral weights - check if in shares and amount > 0
    UPDATE distribution_verifications dv
    SET weight = CASE
        WHEN ts.user_id IS NOT NULL AND ts.amount > 0 THEN 1
        ELSE 0
    END
    FROM referrals r
    LEFT JOIN temp_shares ts ON ts.user_id = r.referred_id
    WHERE dv.distribution_id = $1
    AND dv.type = 'tag_referral'
    AND dv.user_id = r.referrer_id
    AND (dv.metadata->>'referred_id')::uuid = r.referred_id;

    -- Insert total_tag_referrals if doesn't exist (only count shares with amount > 0)
    INSERT INTO distribution_verifications (distribution_id, user_id, type, weight)
    SELECT
        $1,
        r.referrer_id,
        'total_tag_referrals',
        COUNT(ts.user_id)
    FROM referrals r
    JOIN temp_shares ts ON ts.user_id = r.referred_id
    WHERE ts.amount > 0
    AND NOT EXISTS (
        SELECT 1 FROM distribution_verifications dv
        WHERE dv.distribution_id = $1
        AND dv.type = 'total_tag_referrals'
        AND dv.user_id = r.referrer_id
    )
    GROUP BY r.referrer_id;

    -- Update existing total_tag_referrals (only count shares with amount > 0)
    UPDATE distribution_verifications dv
    SET weight = rc.referral_count
    FROM (
        SELECT
            r.referrer_id,
            COUNT(ts.user_id) as referral_count
        FROM referrals r
        JOIN temp_shares ts ON ts.user_id = r.referred_id
        WHERE ts.amount > 0
        GROUP BY r.referrer_id
    ) rc
    WHERE dv.distribution_id = $1
    AND dv.type = 'total_tag_referrals'
    AND dv.user_id = rc.referrer_id;

    DROP TABLE temp_shares;
END;
$function$
;


