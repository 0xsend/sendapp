WITH dist AS (
    SELECT id FROM distributions WHERE number = 14
),
qualifying_referrals AS (
    SELECT DISTINCT
        ds.user_id::text AS referred_id,
        r.referrer_id
    FROM public.distribution_shares ds
    LEFT JOIN public.referrals r ON r.referred_id = ds.user_id
    WHERE ds.distribution_id = (SELECT id FROM dist)
)
UPDATE public.distribution_verifications dv
SET weight = CASE
    WHEN dv.type = 'tag_referral' AND
         dv.metadata->>'referred_id' IN (SELECT referred_id FROM qualifying_referrals)
    THEN 1
    WHEN dv.type = 'total_tag_referrals' AND
         EXISTS (SELECT 1 FROM qualifying_referrals qr WHERE qr.referrer_id = dv.user_id)
    THEN (SELECT COUNT(*) FROM qualifying_referrals qr WHERE qr.referrer_id = dv.user_id)
    ELSE 0
END
WHERE dv.distribution_id = (SELECT id FROM dist)
AND dv.type IN ('tag_referral', 'total_tag_referrals');

UPDATE public.distribution_verification_values
SET
    multiplier_step = CASE
        WHEN type = 'tag_referral' THEN 0.2
        WHEN type = 'total_tag_referrals' THEN 0.05
    END,
    multiplier_min = CASE
        WHEN type = 'tag_referral' THEN 1.2
        WHEN type = 'total_tag_referrals' THEN 1.05
    END
WHERE distribution_id = (SELECT id FROM distributions WHERE number = 14)
AND type IN ('tag_referral', 'total_tag_referrals');

CREATE OR REPLACE FUNCTION "public"."insert_verification_referral"()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
  AS $$
DECLARE
  curr_distribution_id bigint;
  total_referrals bigint;
  is_qualifying boolean;
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

  -- Check if referred user is qualifying
  is_qualifying := EXISTS (
    SELECT 1
    FROM public.distribution_shares
    WHERE user_id = NEW.referred_id
      AND distribution_id = curr_distribution_id
  );

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
    CASE WHEN is_qualifying THEN 1 ELSE 0 END
  );

  SELECT COUNT(*) INTO total_referrals
  FROM referrals r
  JOIN distribution_shares ds ON r.referred_id = ds.user_id
  WHERE r.referrer_id = NEW.referrer_id
    AND ds.distribution_id = curr_distribution_id;

  -- Update total_tag_referrals if exists, insert if not
  UPDATE public.distribution_verifications
  SET weight = total_referrals
  WHERE distribution_id = curr_distribution_id
    AND user_id = NEW.referrer_id
    AND type = 'total_tag_referrals';

  IF NOT FOUND THEN
    INSERT INTO public.distribution_verifications(
      distribution_id,
      user_id,
      type,
      weight
    ) VALUES (
      curr_distribution_id,
      NEW.referrer_id,
      'total_tag_referrals'::public.verification_type,
      total_referrals
    );
  END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_referral_verifications(distribution_id integer, shares distribution_shares[])
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
BEGIN

WITH dist AS (
    SELECT id FROM distributions WHERE number = 14
),
qualifying_referrals AS (
    SELECT DISTINCT
        ds.user_id::text AS referred_id,
        r.referrer_id
    FROM public.distribution_shares ds
    LEFT JOIN public.referrals r ON r.referred_id = ds.user_id
    WHERE ds.distribution_id = (SELECT id FROM dist)
)
UPDATE public.distribution_verifications dv
SET weight = CASE
    WHEN dv.type = 'tag_referral' AND
         dv.metadata->>'referred_id' IN (SELECT referred_id FROM qualifying_referrals)
    THEN 1
    WHEN dv.type = 'total_tag_referrals' AND
         EXISTS (SELECT 1 FROM qualifying_referrals qr WHERE qr.referrer_id = dv.user_id)
    THEN (SELECT COUNT(*) FROM qualifying_referrals qr WHERE qr.referrer_id = dv.user_id)
    ELSE 0
END
WHERE dv.distribution_id = (SELECT id FROM dist)
AND dv.type IN ('tag_referral', 'total_tag_referrals');

END;
$function$;