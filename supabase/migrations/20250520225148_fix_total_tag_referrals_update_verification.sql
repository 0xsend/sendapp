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
    -- Create temporary table for shares to avoid repeated unnesting - O(x)
    CREATE TEMPORARY TABLE temp_shares ON COMMIT DROP AS
    SELECT DISTINCT user_id
    FROM unnest(shares) ds
    WHERE ds.distribution_id = $1;

    -- Create index for better join performance - O(x log(x))
    CREATE INDEX ON temp_shares(user_id);

    -- Create temporary table for referrers and their counts - O(x log(y))
    CREATE TEMPORARY TABLE temp_referrers ON COMMIT DROP AS
    SELECT
        r.referrer_id,
        COUNT(ts.user_id) as referral_count
    FROM temp_shares ts
    JOIN referrals r ON r.referred_id = ts.user_id
    GROUP BY r.referrer_id;

    -- Single operation combining both updates and inserts - O(x log(y))
    INSERT INTO public.distribution_verifications (
        distribution_id,
        user_id,
        type,
        weight
    )
    SELECT
        $1,
        tr.referrer_id,
        'tag_referral'::verification_type,
        1
    FROM temp_referrers tr
    WHERE NOT EXISTS (
        SELECT 1
        FROM distribution_verifications dv
        WHERE dv.distribution_id = $1
        AND dv.user_id = tr.referrer_id
        AND dv.type = 'tag_referral'
    )
    UNION ALL
    SELECT
        $1,
        tr.referrer_id,
        'total_tag_referrals'::verification_type,
        tr.referral_count
    FROM temp_referrers tr
    WHERE NOT EXISTS (
        SELECT 1
        FROM distribution_verifications dv
        WHERE dv.distribution_id = $1
        AND dv.user_id = tr.referrer_id
        AND dv.type = 'total_tag_referrals'
    );

    -- Update existing verifications - O(x log(y))
    UPDATE distribution_verifications dv
    SET weight = tr.referral_count
    FROM temp_referrers tr
    WHERE dv.distribution_id = $1
    AND dv.user_id = tr.referrer_id
    AND dv.type = 'total_tag_referrals';

    -- Cleanup
    DROP TABLE temp_shares;
    DROP TABLE temp_referrers;
END;
$function$;