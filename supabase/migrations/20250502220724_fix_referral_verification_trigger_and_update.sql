-- Fix use correct distribution id and search on shares param
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
    WITH qualifying_referrals AS (
        SELECT DISTINCT
            ds.user_id::TEXT AS referred_id,
            r.referrer_id
        FROM
            unnest(shares) ds
            LEFT JOIN public.referrals r ON r.referred_id = ds.user_id
        WHERE
            ds.distribution_id = $1
    )
    UPDATE public.distribution_verifications dv
    SET weight = CASE
        WHEN dv.type = 'tag_referral' AND
             dv.metadata->>'referred_id' IN (SELECT referred_id FROM qualifying_referrals)
        THEN 1
        WHEN dv.type = 'total_tag_referrals' AND
             EXISTS (
                 SELECT 1
                 FROM qualifying_referrals qr
                 WHERE qr.referrer_id = dv.user_id
             )
        THEN (
            SELECT COUNT(*)
            FROM qualifying_referrals qr
            WHERE qr.referrer_id = dv.user_id
        )
        ELSE 0
    END
    WHERE
        dv.distribution_id = $1 AND
        dv.type IN ('tag_referral', 'total_tag_referrals');
END;
$function$;

-- Remove deprecated metadata from distribution_verifications total_tag_referrals type
UPDATE public.distribution_verifications dv
SET metadata = NULL
WHERE dv.type = 'total_tag_referrals';

-- remove checks for distribution qualification
-- impossible for new referral to have entry in distribution shares
CREATE OR REPLACE FUNCTION "public"."insert_verification_referral"()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
  AS $$
DECLARE
  curr_distribution_id bigint;
BEGIN
  -- Get the current distribution id
  SELECT
    id INTO curr_distribution_id
  FROM
    distributions
  WHERE
    qualification_start <= now()
    AND qualification_end >= now()
  ORDER BY
    qualification_start DESC
  LIMIT 1;

  -- Return early if current distribution doesn't exist
  IF curr_distribution_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Insert verification for referrer
  INSERT INTO public.distribution_verifications(
    distribution_id,
    user_id,
    type,
    metadata,
    weight
  )
  VALUES (
    curr_distribution_id,
    NEW.referrer_id,
    'tag_referral'::public.verification_type,
    jsonb_build_object(
      'referred_id', NEW.referred_id
    ),
    0
  );
  RETURN NEW;
END;
$$;