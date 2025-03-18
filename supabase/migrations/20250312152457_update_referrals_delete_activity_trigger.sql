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
    where event_name = 'referrals'
      and event_id in (
        select private.generate_referral_event_id(OLD_TABLE.referrer_id, array[]::text[])
        from OLD_TABLE
        group by OLD_TABLE.referrer_id
      );
  RETURN NULL;
END;
$$;
