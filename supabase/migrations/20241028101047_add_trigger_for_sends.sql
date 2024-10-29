CREATE OR REPLACE FUNCTION "public"."insert_verification_sends"()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
  AS $$
DECLARE
  curr_distribution_id bigint;
  from_user_id uuid;
  to_user_id uuid;
  unique_recipient_count integer;
  current_streak integer;
  existing_record_id bigint;
  ignored_addresses bytea[] := ARRAY['\x592e1224d203be4214b15e205f6081fbbacfcd2d'::bytea, '\x36f43082d01df4801af2d95aeed1a0200c5510ae'::bytea];
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
  -- Get user_ids from send_accounts
  SELECT
    user_id INTO from_user_id
  FROM
    send_accounts
  WHERE
    address = concat('0x', encode(NEW.f, 'hex'))::citext;
  SELECT
    user_id INTO to_user_id
  FROM
    send_accounts
  WHERE
    address = concat('0x', encode(NEW.t, 'hex'))::citext;
  IF curr_distribution_id IS NOT NULL AND from_user_id IS NOT NULL AND to_user_id IS NOT NULL THEN
    -- Count unique recipients for the sender
    SELECT
      COUNT(DISTINCT t) INTO unique_recipient_count
    FROM
      send_account_transfers
    WHERE
      f = NEW.f
      AND NOT (t = ANY (ignored_addresses))
      AND block_time >=(
        SELECT
          extract(epoch FROM qualification_start)
        FROM
          distributions
        WHERE
          id = curr_distribution_id)
      AND block_time <=(
        SELECT
          extract(epoch FROM qualification_end)
        FROM
          distributions
        WHERE
          id = curr_distribution_id);
    -- Handle send_ten verification
    SELECT
      id INTO existing_record_id
    FROM
      public.distribution_verifications
    WHERE
      distribution_id = curr_distribution_id
      AND user_id = from_user_id
      AND type = 'send_ten'::public.verification_type;
    IF existing_record_id IS NOT NULL THEN
      UPDATE
        public.distribution_verifications
      SET
        metadata = jsonb_build_object('value', unique_recipient_count),
        weight = CASE WHEN unique_recipient_count >= 10 THEN
          1
        ELSE
          0
        END,
        created_at = to_timestamp(NEW.block_time) at time zone 'UTC'
      WHERE
        id = existing_record_id;
    ELSE
      INSERT INTO public.distribution_verifications(
        distribution_id,
        user_id,
        type,
        metadata,
        weight,
        created_at)
      VALUES (
        curr_distribution_id,
        from_user_id,
        'send_ten' ::public.verification_type,
        jsonb_build_object(
          'value', unique_recipient_count),
        CASE WHEN unique_recipient_count >= 10 THEN
          1
        ELSE
          0
        END,
        to_timestamp(
          NEW.block_time) at time zone 'UTC');
    END IF;
    -- Handle send_one_hundred verification
    SELECT
      id INTO existing_record_id
    FROM
      public.distribution_verifications
    WHERE
      distribution_id = curr_distribution_id
      AND user_id = from_user_id
      AND type = 'send_one_hundred'::public.verification_type;
    IF existing_record_id IS NOT NULL THEN
      UPDATE
        public.distribution_verifications
      SET
        metadata = jsonb_build_object('value', unique_recipient_count),
        weight = CASE WHEN unique_recipient_count >= 100 THEN
          1
        ELSE
          0
        END,
        created_at = to_timestamp(NEW.block_time) at time zone 'UTC'
      WHERE
        id = existing_record_id;
    ELSE
      INSERT INTO public.distribution_verifications(
        distribution_id,
        user_id,
        type,
        metadata,
        weight,
        created_at)
      VALUES (
        curr_distribution_id,
        from_user_id,
        'send_one_hundred' ::public.verification_type,
        jsonb_build_object(
          'value', unique_recipient_count),
        CASE WHEN unique_recipient_count >= 100 THEN
          1
        ELSE
          0
        END,
        to_timestamp(
          NEW.block_time) at time zone 'UTC');
    END IF;
    -- Calculate current streak
    WITH daily_transfers AS (
      SELECT DISTINCT
        DATE(to_timestamp(block_time) at time zone 'UTC') AS transfer_date
      FROM
        send_account_transfers
      WHERE
        f = NEW.f
        AND block_time >=(
          SELECT
            extract(epoch FROM qualification_start)
          FROM
            distributions
          WHERE
            id = curr_distribution_id)
),
streaks AS (
  SELECT
    transfer_date,
    transfer_date -(ROW_NUMBER() OVER (ORDER BY transfer_date))::integer AS streak_group
  FROM
    daily_transfers
)
SELECT
  COUNT(*) INTO current_streak
FROM
  streaks
WHERE
  streak_group =(
    SELECT
      streak_group
    FROM
      streaks
    WHERE
      transfer_date = DATE(to_timestamp(NEW.block_time) at time zone 'UTC'));
  -- Handle send_streak verification
  SELECT
    id INTO existing_record_id
  FROM
    public.distribution_verifications
  WHERE
    distribution_id = curr_distribution_id
    AND user_id = from_user_id
    AND type = 'send_streak'::public.verification_type;
  IF existing_record_id IS NOT NULL THEN
    UPDATE
      public.distribution_verifications
    SET
      weight = GREATEST(current_streak, weight),
      created_at = to_timestamp(NEW.block_time) at time zone 'UTC'
    WHERE
      id = existing_record_id;
  ELSE
    INSERT INTO public.distribution_verifications(
      distribution_id,
      user_id,
      type,
      created_at,
      weight)
    VALUES (
      curr_distribution_id,
      from_user_id,
      'send_streak' ::public.verification_type,
      to_timestamp(
        NEW.block_time) at time zone 'UTC',
      current_streak);
  END IF;
END IF;
  RETURN NEW;
END;
$$;

-- Create the trigger
CREATE TRIGGER "insert_verification_sends"
  AFTER INSERT ON "public"."send_account_transfers"
  FOR EACH ROW
  EXECUTE PROCEDURE "public"."insert_verification_sends"();

