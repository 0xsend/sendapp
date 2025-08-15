-- Functions that depend on send_scores for distribution verifications
CREATE OR REPLACE FUNCTION public.calculate_and_insert_send_ceiling_verification(distribution_number integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

ALTER FUNCTION "public"."calculate_and_insert_send_ceiling_verification"("distribution_number" integer) OWNER TO "postgres";

CREATE OR REPLACE FUNCTION public.insert_send_verifications(distribution_num integer)
RETURNS void
LANGUAGE plpgsql
AS $$
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
$$;

ALTER FUNCTION "public"."insert_send_verifications"("distribution_num" integer) OWNER TO "postgres";

CREATE OR REPLACE FUNCTION public.insert_verification_sends()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    -- Update existing verifications
    UPDATE public.distribution_verifications dv
    SET metadata = jsonb_build_object('value', s.unique_sends),
        weight = CASE
            WHEN dv.type = 'send_ten' AND s.unique_sends >= 10 THEN 1
            WHEN dv.type = 'send_one_hundred' AND s.unique_sends >= 100 THEN 1
            ELSE 0
        END,
        created_at = to_timestamp(NEW.block_time) at time zone 'UTC'
    FROM private.get_send_score(NEW.f) s
    JOIN send_accounts sa ON sa.address = concat('0x', encode(NEW.f, 'hex'))::citext
    WHERE dv.distribution_id = s.distribution_id
        AND dv.user_id = sa.user_id
        AND dv.type IN ('send_ten', 'send_one_hundred');

    -- Insert new verifications if they don't exist
    INSERT INTO public.distribution_verifications(
        distribution_id,
        user_id,
        type,
        metadata,
        weight,
        created_at
    )
    SELECT
        s.distribution_id,
        sa.user_id,
        v.type,
        jsonb_build_object('value', s.unique_sends),
        CASE
            WHEN v.type = 'send_ten' AND s.unique_sends >= 10 THEN 1
            WHEN v.type = 'send_one_hundred' AND s.unique_sends >= 100 THEN 1
            ELSE 0
        END,
        to_timestamp(NEW.block_time) at time zone 'UTC'
    FROM private.get_send_score(NEW.f) s
    JOIN send_accounts sa ON sa.address = concat('0x', encode(NEW.f, 'hex'))::citext
    CROSS JOIN (
        VALUES
            ('send_ten'::verification_type),
            ('send_one_hundred'::verification_type)
    ) v(type)
    WHERE NOT EXISTS (
        SELECT 1
        FROM distribution_verifications dv
        WHERE dv.user_id = sa.user_id
            AND dv.distribution_id = s.distribution_id
            AND dv.type = v.type
    );

    RETURN NEW;
END;
$function$;

ALTER FUNCTION "public"."insert_verification_sends"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION public.insert_verification_send_ceiling()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    -- Exit early if value is not positive
    IF NOT (NEW.v > 0) THEN
        RETURN NEW;
    END IF;

    -- Try to update existing verification
    UPDATE distribution_verifications dv
    SET
        weight = s.score,
        metadata = jsonb_build_object('value', s.send_ceiling::text)
    FROM private.get_send_score(NEW.f) s
    CROSS JOIN (
        SELECT user_id
        FROM send_accounts
        WHERE address = concat('0x', encode(NEW.f, 'hex'))::citext
    ) sa
    WHERE dv.user_id = sa.user_id
        AND dv.distribution_id = s.distribution_id
        AND dv.type = 'send_ceiling';

    -- If no row was updated, insert new verification
    IF NOT FOUND THEN
        INSERT INTO distribution_verifications(
            distribution_id,
            user_id,
            type,
            weight,
            metadata
        )
        SELECT
            s.distribution_id,
            sa.user_id,
            'send_ceiling',
            s.score,
            jsonb_build_object('value', s.send_ceiling::text)
        FROM private.get_send_score(NEW.f) s
        CROSS JOIN (
            SELECT user_id
            FROM send_accounts
            WHERE address = concat('0x', encode(NEW.f, 'hex'))::citext
        ) sa
        WHERE s.score > 0;
    END IF;

    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error in insert_verification_send_ceiling: %', SQLERRM;
        RETURN NEW;
END;
$function$;

ALTER FUNCTION "public"."insert_verification_send_ceiling"() OWNER TO "postgres";

-- Triggers
CREATE OR REPLACE TRIGGER "insert_verification_send_ceiling_trigger" AFTER INSERT ON "public"."send_token_transfers" FOR EACH ROW EXECUTE FUNCTION "public"."insert_verification_send_ceiling"();
CREATE OR REPLACE TRIGGER "insert_verification_sends" AFTER INSERT ON "public"."send_token_transfers" FOR EACH ROW EXECUTE FUNCTION "public"."insert_verification_sends"();
CREATE OR REPLACE TRIGGER "insert_send_streak_verification" AFTER INSERT ON "public"."send_token_transfers" FOR EACH ROW EXECUTE FUNCTION "public"."insert_send_streak_verification"();

CREATE OR REPLACE TRIGGER "insert_verification_sends_sendv0" AFTER INSERT ON "public"."send_token_v0_transfers" FOR EACH ROW EXECUTE FUNCTION "public"."insert_verification_sends"();
CREATE OR REPLACE TRIGGER "insert_verification_send_ceiling_sendv0" AFTER INSERT ON "public"."send_token_v0_transfers" FOR EACH ROW EXECUTE FUNCTION "public"."insert_verification_send_ceiling"();


-- Function grants
REVOKE ALL ON FUNCTION "public"."calculate_and_insert_send_ceiling_verification"("distribution_number" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."calculate_and_insert_send_ceiling_verification"("distribution_number" integer) TO "service_role";

REVOKE ALL ON FUNCTION "public"."insert_send_verifications"("distribution_num" integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION "public"."insert_send_verifications"("distribution_num" integer) FROM authenticated;
GRANT ALL ON FUNCTION "public"."insert_send_verifications"("distribution_num" integer) TO service_role;

REVOKE ALL ON FUNCTION "public"."insert_verification_sends"() FROM PUBLIC;
REVOKE ALL ON FUNCTION "public"."insert_verification_sends"() FROM authenticated;
GRANT ALL ON FUNCTION "public"."insert_verification_sends"() TO service_role;

REVOKE ALL ON FUNCTION "public"."insert_verification_send_ceiling"() FROM PUBLIC;
REVOKE ALL ON FUNCTION "public"."insert_verification_send_ceiling"() FROM authenticated;
GRANT ALL ON FUNCTION "public"."insert_verification_send_ceiling"() TO service_role;
