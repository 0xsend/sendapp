drop trigger if exists "insert_verification_sends" on "public"."send_account_transfers";
drop function if exists "public"."sum_qualification_sends"(distribution_number integer);

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

  -- Get user_id from send_accounts
  SELECT user_id INTO from_user_id
  FROM send_accounts
  WHERE address = concat('0x', encode(NEW.f, 'hex'))::citext;

  IF curr_distribution_id IS NOT NULL AND from_user_id IS NOT NULL THEN
    -- Calculate current streak with unique recipients per day
    WITH daily_unique_transfers AS (
      SELECT DISTINCT
        DATE(to_timestamp(block_time) at time zone 'UTC') AS transfer_date
      FROM send_token_transfers stt
      WHERE f = NEW.f
        AND NOT (t = ANY (ignored_addresses))
        AND block_time >= (
          SELECT extract(epoch FROM qualification_start)
          FROM distributions
          WHERE id = curr_distribution_id
        )
        AND EXISTS (
          SELECT 1
          FROM (
            SELECT DISTINCT t
            FROM send_token_transfers
            WHERE f = stt.f
            AND DATE(to_timestamp(block_time) at time zone 'UTC') = DATE(to_timestamp(stt.block_time) at time zone 'UTC')
            AND NOT (t = ANY (ignored_addresses))
          ) unique_recipients
        )
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

CREATE OR REPLACE FUNCTION public.calculate_and_insert_send_ceiling_verification(distribution_number integer)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  WITH dist_scores AS (
    SELECT * FROM send_scores ss
    WHERE ss.distribution_id = (
      SELECT id FROM distributions WHERE number = $1
    )
  ),
  updated_rows AS (
    UPDATE distribution_verifications dv
    SET
      weight = ds.score,
      metadata = jsonb_build_object('value', ds.send_ceiling::text)
    FROM dist_scores ds
    WHERE dv.user_id = ds.user_id
      AND dv.distribution_id = ds.distribution_id
      AND dv.type = 'send_ceiling'
    RETURNING dv.user_id
  )
  INSERT INTO distribution_verifications(
    distribution_id,
    user_id,
    type,
    weight,
    metadata
  )
  SELECT
    distribution_id,
    user_id,
    'send_ceiling'::public.verification_type,
    score,
    jsonb_build_object('value', send_ceiling::text)
  FROM dist_scores ds
  WHERE NOT EXISTS (
    SELECT 1 FROM updated_rows ur
    WHERE ur.user_id = ds.user_id
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.insert_send_streak_verifications(distribution_num integer)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
    -- Perform the entire operation within a single function
    WITH distribution_info AS (
        SELECT
            id,
            qualification_start,
            qualification_end
        FROM
            distributions
        WHERE
            "number" = distribution_num
        LIMIT 1
    ),
    daily_transfers AS (
        SELECT
            sa.user_id,
            DATE(to_timestamp(stt.block_time) AT TIME ZONE 'UTC') AS transfer_date,
            COUNT(DISTINCT stt.t) AS unique_recipients
        FROM
            stt stt
            JOIN send_accounts sa ON sa.address = CONCAT('0x', ENCODE(stt.f, 'hex'))::CITEXT
        WHERE
            stt.block_time >= EXTRACT(EPOCH FROM (
                SELECT
                    qualification_start
                FROM distribution_info))
            AND stt.block_time < EXTRACT(EPOCH FROM (
                SELECT
                    qualification_end
                FROM distribution_info))
        GROUP BY
            sa.user_id,
            DATE(to_timestamp(stt.block_time) AT TIME ZONE 'UTC')
    ),
    streaks AS (
        SELECT
            user_id,
            transfer_date,
            unique_recipients,
            transfer_date - (ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY transfer_date))::INTEGER AS streak_group
        FROM
            daily_transfers
        WHERE
            unique_recipients > 0
    ),
    max_streaks AS (
        SELECT
            user_id,
            MAX(streak_length) AS max_streak_length
        FROM (
            SELECT
                user_id,
                streak_group,
                COUNT(*) AS streak_length
            FROM
                streaks
            GROUP BY
                user_id,
                streak_group) AS streak_lengths
        GROUP BY
            user_id
    )
    INSERT INTO public.distribution_verifications(
        distribution_id,
        user_id,
        type,
        created_at,
        weight
    )
    SELECT
        (
            SELECT
                id
            FROM
                distribution_info),
        ms.user_id,
        'send_streak'::public.verification_type,
        (SELECT NOW() AT TIME ZONE 'UTC'),
        ms.max_streak_length
    FROM
        max_streaks ms
    WHERE
        ms.max_streak_length > 0;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.insert_send_verifications(distribution_num integer)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
    INSERT INTO public.distribution_verifications(
        distribution_id,
        user_id,
        type,
        metadata,
        created_at,
        weight
    )
    SELECT
        d.id,
        ss.user_id,
        type,
        JSONB_BUILD_OBJECT('value', ss.unique_sends),
        d.qualification_end,
        CASE
            WHEN type = 'send_ten'::public.verification_type
                AND ss.unique_sends >= 10 THEN 1
            WHEN type = 'send_one_hundred'::public.verification_type
                AND ss.unique_sends >= 100 THEN 1
            ELSE 0
        END
    FROM
        distributions d
        JOIN send_scores ss ON ss.distribution_id = d.id
        CROSS JOIN (
            SELECT 'send_ten'::public.verification_type AS type
            UNION ALL
            SELECT 'send_one_hundred'::public.verification_type
        ) types
    WHERE d.number = distribution_num;
END;
$function$
;


CREATE OR REPLACE FUNCTION public.insert_verification_send_ceiling()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE distribution_verifications dv
  SET weight = ss.score,
      metadata = jsonb_build_object('value', ss.send_ceiling::text)
  FROM send_scores_current ss
  JOIN send_accounts sa ON sa.user_id = ss.user_id
  WHERE dv.user_id = ss.user_id
    AND dv.distribution_id = ss.distribution_id
    AND dv.type = 'send_ceiling'
    AND sa.address = concat('0x', encode(NEW.f, 'hex'))::citext
    AND NEW.v > 0;

  IF NOT FOUND THEN
    INSERT INTO distribution_verifications(
      distribution_id,
      user_id,
      type,
      weight,
      metadata
    )
    SELECT
      ss.distribution_id,
      ss.user_id,
      'send_ceiling',
      ss.score,
      jsonb_build_object('value', ss.send_ceiling::text)
    FROM send_scores_current ss
    JOIN send_accounts sa ON sa.user_id = ss.user_id
    WHERE sa.address = concat('0x', encode(NEW.f, 'hex'))::citext
    AND NEW.v > 0;
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error in insert_verification_send_ceiling: %', SQLERRM;
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.insert_verification_sends()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.distribution_verifications dv
  SET metadata = jsonb_build_object('value', ss.unique_sends),
      weight = CASE
        WHEN dv.type = 'send_ten' AND ss.unique_sends >= 10 THEN 1
        WHEN dv.type = 'send_one_hundred' AND ss.unique_sends >= 100 THEN 1
        ELSE 0
      END,
      created_at = to_timestamp(NEW.block_time) at time zone 'UTC'
  FROM send_scores_current ss
  JOIN send_accounts sa ON sa.user_id = ss.user_id
  WHERE dv.distribution_id = ss.distribution_id
    AND dv.user_id = ss.user_id
    AND dv.type IN ('send_ten', 'send_one_hundred')
    AND sa.address = concat('0x', encode(NEW.f, 'hex'))::citext;

  INSERT INTO public.distribution_verifications(
    distribution_id,
    user_id,
    type,
    metadata,
    weight,
    created_at
  )
  SELECT
    ss.distribution_id,
    ss.user_id,
    v.type,
    jsonb_build_object('value', ss.unique_sends),
    CASE
      WHEN v.type = 'send_ten' AND ss.unique_sends >= 10 THEN 1
      WHEN v.type = 'send_one_hundred' AND ss.unique_sends >= 100 THEN 1
      ELSE 0
    END,
    to_timestamp(NEW.block_time) at time zone 'UTC'
  FROM send_scores_current ss
  JOIN send_accounts sa ON sa.user_id = ss.user_id
  CROSS JOIN (
    VALUES
      ('send_ten'::verification_type),
      ('send_one_hundred'::verification_type)
  ) v(type)
  WHERE sa.address = concat('0x', encode(NEW.f, 'hex'))::citext
    AND NOT EXISTS (
      SELECT 1
      FROM distribution_verifications dv
      WHERE dv.user_id = ss.user_id
        AND dv.distribution_id = ss.distribution_id
        AND dv.type = v.type
    );

  RETURN NEW;
END;
$function$
;


CREATE TRIGGER insert_send_streak_verification AFTER INSERT ON public.send_token_transfers FOR EACH ROW EXECUTE FUNCTION insert_send_streak_verification();

CREATE TRIGGER insert_verification_sends AFTER INSERT ON public.send_token_transfers FOR EACH ROW EXECUTE FUNCTION insert_verification_sends();

CREATE TRIGGER insert_verification_send_ceiling AFTER INSERT ON public.send_token_v0_transfers FOR EACH ROW EXECUTE FUNCTION insert_verification_send_ceiling();

CREATE TRIGGER insert_verification_sends AFTER INSERT ON public.send_token_v0_transfers FOR EACH ROW EXECUTE FUNCTION insert_verification_sends();


