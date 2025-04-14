-- Update the referrals_insert_activity_trigger function to not reference tag
CREATE OR REPLACE FUNCTION public.referrals_insert_activity_trigger()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
  AS $$
BEGIN
  insert into activity (event_name, event_id, from_user_id, to_user_id, data, created_at)
    select 'referrals',
           private.generate_referral_event_id(NEW_TABLE.referrer_id, NEW_TABLE.referred_id),
           NEW_TABLE.referrer_id,
           NEW_TABLE.referred_id,
           jsonb_build_object('tags', (
             select array_agg(name)
             from tags
             where user_id = NEW_TABLE.referred_id
               and status = 'confirmed'
           )),
           current_timestamp
    from NEW_TABLE
    group by NEW_TABLE.referrer_id, NEW_TABLE.referred_id;
  RETURN NULL;
END;
$$;

-- Update the private.generate_referral_event_id function to not reference tag
CREATE OR REPLACE FUNCTION private.generate_referral_event_id(referrer_id uuid, referred_id uuid)
  RETURNS text
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
  AS $$
BEGIN
  RETURN sha256(decode(replace(referrer_id::text, '-', '') || replace(referred_id::text, '-', ''), 'hex'))::text;
END;
$$;

-- Drop the private.generate_referral_event_id function that was using tag
DROP FUNCTION IF EXISTS public.generate_referral_event_id(referrer_id uuid, tags text[]);

-- Update the referrals_delete_activity_trigger function to not reference tag
CREATE OR REPLACE FUNCTION public.referrals_delete_activity_trigger()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
  AS $$
BEGIN
  delete
    from activity
    where exists (
      select 1
        from OLD_TABLE
        where activity.from_user_id = OLD_TABLE.referrer_id
          and activity.to_user_id = OLD_TABLE.referred_id
          and activity.event_name = 'referrals'
      );
  RETURN NULL;
END;
$$;
