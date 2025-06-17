set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.insert_send_streak_verification()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
  SELECT id INTO curr_distribution_id
  FROM distributions
  WHERE qualification_start <= CURRENT_TIMESTAMP AT TIME ZONE 'UTC'
    AND qualification_end >= CURRENT_TIMESTAMP AT TIME ZONE 'UTC'
  ORDER BY qualification_start DESC
  LIMIT 1;

  -- Get user_ids from send_accounts
  SELECT user_id INTO from_user_id
  FROM send_accounts
  WHERE address = concat('0x', encode(NEW.f, 'hex'))::citext;

  SELECT user_id INTO to_user_id
  FROM send_accounts
  WHERE address = concat('0x', encode(NEW.t, 'hex'))::citext;

  IF curr_distribution_id IS NOT NULL AND from_user_id IS NOT NULL AND to_user_id IS NOT NULL THEN
    -- Calculate streak with simplified unique recipients per day logic
    WITH daily_unique_transfers AS (
      SELECT
        DATE(to_timestamp(block_time) at time zone 'UTC') AS transfer_date
      FROM send_token_transfers stt
      WHERE f = NEW.f
        AND NOT (t = ANY (ignored_addresses))
        AND block_time >= (
          SELECT extract(epoch FROM qualification_start)
          FROM distributions
          WHERE id = curr_distribution_id
        )
      GROUP BY DATE(to_timestamp(block_time) at time zone 'UTC')
      HAVING COUNT(DISTINCT t) > 0
    ),
    streaks AS (
      SELECT
        transfer_date,
        transfer_date - (ROW_NUMBER() OVER (ORDER BY transfer_date))::integer AS streak_group
      FROM daily_unique_transfers
    )
    SELECT COUNT(*) INTO current_streak
    FROM streaks
    WHERE streak_group = (
      SELECT streak_group
      FROM streaks
      WHERE transfer_date = DATE(to_timestamp(NEW.block_time) at time zone 'UTC')
    );

    -- Handle send_streak verification
    SELECT id INTO existing_record_id
    FROM public.distribution_verifications
    WHERE distribution_id = curr_distribution_id
      AND user_id = from_user_id
      AND type = 'send_streak'::public.verification_type;

    IF existing_record_id IS NOT NULL THEN
      UPDATE public.distribution_verifications
      SET weight = GREATEST(current_streak, weight),
          created_at = to_timestamp(NEW.block_time) at time zone 'UTC'
      WHERE id = existing_record_id;
    ELSE
      INSERT INTO public.distribution_verifications(
        distribution_id,
        user_id,
        type,
        created_at,
        weight
      )
      VALUES (
        curr_distribution_id,
        from_user_id,
        'send_streak'::public.verification_type,
        to_timestamp(NEW.block_time) at time zone 'UTC',
        current_streak
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$function$
;

select * from insert_send_streak_verifications(16);

-- Add security settings to existing views
ALTER MATERIALIZED VIEW "private"."send_scores_history" OWNER TO postgres;
ALTER VIEW "public"."send_scores_current_unique" OWNER TO postgres;
ALTER VIEW "public"."send_scores_current" OWNER TO postgres;
ALTER VIEW "public"."send_scores" OWNER TO postgres;

-- Permissions
REVOKE ALL ON "private"."send_scores_history" FROM PUBLIC;
REVOKE ALL ON "private"."send_scores_history" FROM authenticated;
GRANT ALL ON "private"."send_scores_history" TO service_role;

GRANT ALL ON "public"."send_scores_current_unique" TO PUBLIC;
GRANT ALL ON "public"."send_scores_current_unique" TO service_role;
GRANT ALL ON "public"."send_scores_current_unique" TO authenticated;

REVOKE ALL ON "public"."send_scores_current" FROM PUBLIC;
REVOKE ALL ON "public"."send_scores_current" FROM anon;
GRANT ALL ON "public"."send_scores_current" TO service_role;
GRANT ALL ON "public"."send_scores_current" TO authenticated;

GRANT ALL ON "public"."send_scores" TO PUBLIC;
GRANT ALL ON "public"."send_scores" TO service_role;
GRANT ALL ON "public"."send_scores" TO authenticated;