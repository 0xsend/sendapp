-- Fix referral verification not updating weight
CREATE OR REPLACE FUNCTION public.update_referral_verifications(
    distribution_id INTEGER,
    shares distribution_shares[]
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    -- Create temp table for shares lookup
    CREATE TEMPORARY TABLE temp_shares ON COMMIT DROP AS
    SELECT DISTINCT user_id
    FROM unnest(shares) ds;

    -- Update tag_referral weights - just check if in shares
    UPDATE distribution_verifications dv
    SET weight = CASE
        WHEN ts.user_id IS NOT NULL THEN 1
        ELSE 0
    END
    FROM referrals r
    LEFT JOIN temp_shares ts ON ts.user_id = r.referred_id
    WHERE dv.distribution_id = $1
    AND dv.type = 'tag_referral'
    AND dv.user_id = r.referrer_id
    AND (dv.metadata->>'referred_id')::uuid = r.referred_id;

    -- Insert total_tag_referrals if doesn't exist
    INSERT INTO distribution_verifications (distribution_id, user_id, type, weight)
    SELECT
        $1,
        r.referrer_id,
        'total_tag_referrals',
        COUNT(ts.user_id)
    FROM referrals r
    JOIN temp_shares ts ON ts.user_id = r.referred_id
    WHERE NOT EXISTS (
        SELECT 1 FROM distribution_verifications dv
        WHERE dv.distribution_id = $1
        AND dv.type = 'total_tag_referrals'
        AND dv.user_id = r.referrer_id
    )
    GROUP BY r.referrer_id;

    -- Update existing total_tag_referrals
    UPDATE distribution_verifications dv
    SET weight = rc.referral_count
    FROM (
        SELECT
            r.referrer_id,
            COUNT(ts.user_id) as referral_count
        FROM referrals r
        JOIN temp_shares ts ON ts.user_id = r.referred_id
        GROUP BY r.referrer_id
    ) rc
    WHERE dv.distribution_id = $1
    AND dv.type = 'total_tag_referrals'
    AND dv.user_id = rc.referrer_id;

    DROP TABLE temp_shares;
END;
$function$;