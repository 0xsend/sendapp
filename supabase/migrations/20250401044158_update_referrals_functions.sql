-- Update insert_verification_referral function to not reference tag
CREATE OR REPLACE FUNCTION "public"."insert_verification_referral"()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
  AS $$
DECLARE
  curr_distribution_id bigint;
  total_referrals bigint;
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
  -- Insert verification for referrer
  IF curr_distribution_id IS NOT NULL AND NOT EXISTS (
    SELECT
      1
    FROM
      public.distribution_verifications
    WHERE
      user_id = NEW.referrer_id AND metadata ->> 'referred_id' = NEW.referred_id::text AND distribution_id = curr_distribution_id AND type = 'tag_referral'::public.verification_type) THEN
    INSERT INTO public.distribution_verifications(
      distribution_id,
      user_id,
      type,
      metadata)
    VALUES (
      curr_distribution_id,
      NEW.referrer_id,
      'tag_referral' ::public.verification_type,
      jsonb_build_object(
        'referred_id', NEW.referred_id));
    -- Count total referrals for the user
    SELECT
      COUNT(*) INTO total_referrals
    FROM
      referrals
    WHERE
      referrer_id = NEW.referrer_id;
    -- Update total_tag_referrals verification if it exists
    UPDATE
      public.distribution_verifications
    SET
      weight = total_referrals
    WHERE
      distribution_id = curr_distribution_id
      AND user_id = NEW.referrer_id
      AND type = 'total_tag_referrals'::public.verification_type;
    -- Insert total_tag_referrals verification if it doesn't exist
    IF NOT FOUND THEN
      INSERT INTO public.distribution_verifications(
        distribution_id,
        user_id,
        type,
        weight)
      VALUES (
        curr_distribution_id,
        NEW.referrer_id,
        'total_tag_referrals' ::public.verification_type,
        total_referrals);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Update leaderboard_referrals_all_time population query
CREATE OR REPLACE FUNCTION private.update_leaderboard_referrals_all_time_referrals()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER AS
$$
declare
    _referrer_id uuid;
begin
    -- update the referral count for the user
    insert into private.leaderboard_referrals_all_time (user_id, referrals, updated_at)
    values (NEW.referrer_id, 1, now())
    on conflict (user_id) do update set referrals = private.leaderboard_referrals_all_time.referrals + 1,
                                        updated_at = now();
    return NEW;
end
$$;

-- Update the leaderboard population query to use count(r.referred_id) instead of count(r.tag)
CREATE OR REPLACE FUNCTION public.leaderboard_referrals_all_time()
    RETURNS TABLE (
                      rewards_usdc      numeric,
                      referrals         integer,
                      "user"            activity_feed_user
                  )
    LANGUAGE plpgsql stable
    SECURITY DEFINER
    SET search_path = public
AS
$$
begin
    return query select l.rewards_usdc,
                        l.referrals,
                        (case when l.user_id = ( select auth.uid() ) then ( select auth.uid() ) end, -- user_id
                         p.name, -- name
                         p.avatar_url, -- avatar_url
                         p.send_id, -- send_id
                         ( select array_agg(name) from tags where user_id = p.id and status = 'confirmed' ) -- tags
                            )::activity_feed_user                      as "user"
                 from private.leaderboard_referrals_all_time l
                          join profiles p on p.id = user_id
                 where p.is_public = true;
end
$$ ;
