SET check_function_bodies = OFF;

CREATE OR REPLACE FUNCTION public.confirm_tags(tag_names citext[], event_id text, referral_code_input text)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
DECLARE
  tag_owner_ids uuid[];
  distinct_user_ids int;
  tag_owner_id uuid;
  referrer_id uuid;
  _event_id alias FOR $2;
BEGIN
  -- Check if the tags exist and fetch their owners.
  SELECT
    array_agg(user_id) INTO tag_owner_ids
  FROM
    public.tags
  WHERE
    name = ANY (tag_names)
    AND status = 'pending'::public.tag_status;
  -- If any of the tags do not exist or are not in pending status, throw an error.
  IF array_length(tag_owner_ids, 1) <> array_length(tag_names, 1) THEN
    RAISE EXCEPTION 'One or more tags do not exist or are not in pending status.';
  END IF;
  -- Check if all tags belong to the same user
  SELECT
    count(DISTINCT user_id) INTO distinct_user_ids
  FROM
    unnest(tag_owner_ids) AS user_id;
  IF distinct_user_ids <> 1 THEN
    RAISE EXCEPTION 'Tags must belong to the same user.';
  END IF;
  -- Fetch single user_id
  SELECT DISTINCT
    user_id INTO tag_owner_id
  FROM
    unnest(tag_owner_ids) AS user_id;
  IF event_id IS NULL OR event_id = '' THEN
    RAISE EXCEPTION 'Receipt event ID is required for paid tags.';
  END IF;
  -- Ensure event_id matches the sender
  IF (
    SELECT
      count(DISTINCT scr.sender)
    FROM
      public.sendtag_checkout_receipts scr
      JOIN send_accounts sa ON decode(substring(sa.address, 3), 'hex') = scr.sender
    WHERE
      scr.event_id = _event_id AND sa.user_id = tag_owner_id) <> 1 THEN
    RAISE EXCEPTION 'Receipt event ID does not match the sender';
  END IF;
  -- save receipt event_id
  INSERT INTO public.receipts(
    event_id,
    user_id)
  VALUES (
    _event_id,
    tag_owner_id);
  -- Associate the tags with the onchain event
  INSERT INTO public.tag_receipts(
    tag_name,
    event_id)
  SELECT
    unnest(tag_names),
    event_id;
  -- Confirm the tags
  UPDATE
    public.tags
  SET
    status = 'confirmed'::public.tag_status
  WHERE
    name = ANY (tag_names)
    AND status = 'pending'::public.tag_status;
  -- Create referral code redemption (only if it doesn't exist)
  IF referral_code_input IS NOT NULL AND referral_code_input <> '' THEN
    SELECT
      id INTO referrer_id
    FROM
      public.profiles
    WHERE
      referral_code = referral_code_input;
    IF referrer_id IS NOT NULL AND referrer_id <> tag_owner_id THEN
      -- Referrer cannot be the tag owner.
      -- Check if a referral already exists for this user
      IF NOT EXISTS (
        SELECT
          1
        FROM
          public.referrals
        WHERE
          referred_id = tag_owner_id) THEN
      -- Insert only one referral for the user
      INSERT INTO public.referrals(
        referrer_id,
        referred_id,
        tag)
      SELECT
        referrer_id,
        tag_owner_id,
        unnest(tag_names)
      LIMIT 1;
    END IF;
  END IF;
END IF;
END;
$function$;

