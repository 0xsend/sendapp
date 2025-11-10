-- Types
CREATE TYPE "public"."verification_type" AS ENUM (
    'tag_registration',
    'tag_referral',
    'create_passkey',
    'send_ten',
    'send_one_hundred',
    'total_tag_referrals',
    'send_streak',
    'send_ceiling',
    'sendpot_ticket_purchase'
);

ALTER TYPE "public"."verification_type" OWNER TO "postgres";

-- Sequences
CREATE SEQUENCE IF NOT EXISTS "public"."distributions_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER TABLE "public"."distributions_id_seq" OWNER TO "postgres";

CREATE SEQUENCE IF NOT EXISTS "public"."distribution_shares_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER TABLE "public"."distribution_shares_id_seq" OWNER TO "postgres";

CREATE SEQUENCE IF NOT EXISTS "public"."distribution_verifications_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER TABLE "public"."distribution_verifications_id_seq" OWNER TO "postgres";

-- Tables (in dependency order)
CREATE TABLE IF NOT EXISTS "public"."distributions" (
    "id" integer NOT NULL,
    "number" integer NOT NULL,
    "amount" numeric NOT NULL,
    "hodler_pool_bips" bigint NOT NULL,
    "bonus_pool_bips" bigint NOT NULL,
    "fixed_pool_bips" bigint NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "qualification_start" timestamp with time zone NOT NULL,
    "qualification_end" timestamp with time zone NOT NULL,
    "claim_end" timestamp with time zone NOT NULL,
    "hodler_min_balance" numeric NOT NULL,
    "created_at" timestamp with time zone DEFAULT ("now"() AT TIME ZONE 'utc'::"text") NOT NULL,
    "updated_at" timestamp with time zone DEFAULT ("now"() AT TIME ZONE 'utc'::"text") NOT NULL,
    "snapshot_block_num" bigint,
    "chain_id" integer NOT NULL,
    "merkle_drop_addr" "bytea",
    "token_addr" "bytea",
    "token_decimals" numeric,
    "tranche_id" integer NOT NULL,
    "earn_min_balance" bigint NOT NULL DEFAULT 0
);

ALTER TABLE "public"."distributions" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."distribution_shares" (
    "id" integer NOT NULL,
    "distribution_id" integer NOT NULL,
    "user_id" "uuid" NOT NULL,
    "address" "public"."citext" NOT NULL,
    "amount" numeric NOT NULL,
    "hodler_pool_amount" numeric NOT NULL,
    "bonus_pool_amount" numeric NOT NULL,
    "fixed_pool_amount" numeric NOT NULL,
    "created_at" timestamp with time zone DEFAULT ("now"() AT TIME ZONE 'utc'::"text") NOT NULL,
    "updated_at" timestamp with time zone DEFAULT ("now"() AT TIME ZONE 'utc'::"text") NOT NULL,
    "index" bigint NOT NULL,
    CONSTRAINT "distribution_shares_address_check" CHECK ((("length"(("address")::"text") = 42) AND ("address" OPERATOR("public".~) '^0x[A-Fa-f0-9]{40}$'::"public"."citext")))
);

ALTER TABLE "public"."distribution_shares" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."distribution_verifications" (
    "id" integer NOT NULL,
    "distribution_id" integer NOT NULL,
    "user_id" "uuid" NOT NULL,
    "type" "public"."verification_type" NOT NULL,
    "metadata" "jsonb",
    "created_at" timestamp with time zone DEFAULT ("now"() AT TIME ZONE 'utc'::"text") NOT NULL,
    "weight" numeric DEFAULT 1 NOT NULL
);

ALTER TABLE "public"."distribution_verifications" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."distribution_verification_values" (
    "type" "public"."verification_type" NOT NULL,
    "fixed_value" numeric NOT NULL,
    "bips_value" bigint NOT NULL,
    "distribution_id" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT ("now"() AT TIME ZONE 'utc'::"text") NOT NULL,
    "updated_at" timestamp with time zone DEFAULT ("now"() AT TIME ZONE 'utc'::"text") NOT NULL,
    "multiplier_min" numeric(10,4) DEFAULT 1.0 NOT NULL,
    "multiplier_max" numeric(10,4) DEFAULT 1.0 NOT NULL,
    "multiplier_step" numeric(10,4) DEFAULT 0.0 NOT NULL
);

ALTER TABLE "public"."distribution_verification_values" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."send_slash" (
    "distribution_number" integer NOT NULL,
    "minimum_sends" smallint DEFAULT '1'::smallint NOT NULL,
    "scaling_divisor" smallint DEFAULT '1'::smallint NOT NULL,
    "distribution_id" integer NOT NULL
);

ALTER TABLE "public"."send_slash" OWNER TO "postgres";

-- Sequence ownership and defaults
ALTER SEQUENCE "public"."distributions_id_seq" OWNED BY "public"."distributions"."id";
ALTER SEQUENCE "public"."distribution_shares_id_seq" OWNED BY "public"."distribution_shares"."id";
ALTER SEQUENCE "public"."distribution_verifications_id_seq" OWNED BY "public"."distribution_verifications"."id";

ALTER TABLE ONLY "public"."distributions" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."distributions_id_seq"'::"regclass");
ALTER TABLE ONLY "public"."distribution_shares" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."distribution_shares_id_seq"'::"regclass");
ALTER TABLE ONLY "public"."distribution_verifications" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."distribution_verifications_id_seq"'::"regclass");

-- Primary Keys and Constraints
ALTER TABLE ONLY "public"."distributions"
    ADD CONSTRAINT "distributions_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."distributions"
    ADD CONSTRAINT "distributions_tranche_id_key" UNIQUE ("merkle_drop_addr", "tranche_id");

ALTER TABLE ONLY "public"."distribution_verifications"
    ADD CONSTRAINT "distribution_verifications_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."distribution_verification_values"
    ADD CONSTRAINT "distribution_verification_values_pkey" PRIMARY KEY ("type", "distribution_id");

ALTER TABLE ONLY "public"."send_slash"
    ADD CONSTRAINT "send_slash_pkey" PRIMARY KEY ("distribution_number");

-- Indexes
CREATE UNIQUE INDEX "distribution_shares_address_idx" ON "public"."distribution_shares" USING "btree" ("address", "distribution_id");
CREATE INDEX "distribution_shares_distribution_id_idx" ON "public"."distribution_shares" USING "btree" ("distribution_id");
CREATE UNIQUE INDEX "distribution_shares_distribution_id_index_uindex" ON "public"."distribution_shares" USING "btree" ("distribution_id", "index");
CREATE UNIQUE INDEX "distribution_shares_user_id_idx" ON "public"."distribution_shares" USING "btree" ("user_id", "distribution_id");
CREATE INDEX "distribution_verifications_distribution_id_index" ON "public"."distribution_verifications" USING "btree" ("distribution_id");
CREATE INDEX "distribution_verifications_user_id_index" ON "public"."distribution_verifications" USING "btree" ("user_id");
CREATE INDEX "idx_distribution_verifications_composite" ON "public"."distribution_verifications" USING "btree" ("distribution_id", "user_id", "type");
CREATE INDEX "idx_distributions_qualification_dates" ON "public"."distributions" USING "btree" ("qualification_start", "qualification_end");

-- Foreign Keys
ALTER TABLE ONLY "public"."distribution_shares"
    ADD CONSTRAINT "distribution_shares_distribution_id_fkey" FOREIGN KEY ("distribution_id") REFERENCES "public"."distributions"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."distribution_shares"
    ADD CONSTRAINT "distribution_shares_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."distribution_verification_values"
    ADD CONSTRAINT "distribution_verification_values_distribution_id_fkey" FOREIGN KEY ("distribution_id") REFERENCES "public"."distributions"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."distribution_verifications"
    ADD CONSTRAINT "distribution_verification_values_fk" FOREIGN KEY ("type", "distribution_id") REFERENCES "public"."distribution_verification_values"("type", "distribution_id");

ALTER TABLE ONLY "public"."distribution_verifications"
    ADD CONSTRAINT "distribution_verifications_distribution_id_fkey" FOREIGN KEY ("distribution_id") REFERENCES "public"."distributions"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."distribution_verifications"
    ADD CONSTRAINT "distribution_verifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."send_slash"
    ADD CONSTRAINT "send_slash_distribution_id_fkey" FOREIGN KEY ("distribution_id") REFERENCES "public"."distributions"("id") ON DELETE CASCADE;

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

CREATE OR REPLACE FUNCTION "public"."insert_create_passkey_verifications"("distribution_num" integer) RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    INSERT INTO public.distribution_verifications(
        distribution_id,
        user_id,
        type,
        metadata,
        created_at)
    SELECT
        (
            SELECT
                id
            FROM
                distributions
            WHERE
                "number" = distribution_num
            LIMIT 1) AS distribution_id,
        sa.user_id,
        'create_passkey'::public.verification_type AS type,
        jsonb_build_object('account_created_at', sa.created_at) AS metadata,
        sa.created_at AS created_at
    FROM
        send_accounts sa
    WHERE
        sa.created_at >= (
            SELECT
                qualification_start
            FROM
                distributions
            WHERE
                "number" = distribution_num
            LIMIT 1
        )
        AND sa.created_at <= (
            SELECT
                qualification_end
            FROM
                distributions
            WHERE
                "number" = distribution_num
            LIMIT 1
        );
END;
$$;

ALTER FUNCTION "public"."insert_create_passkey_verifications"("distribution_num" integer) OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."insert_send_slash"("distribution_number" integer, "scaling_divisor" integer DEFAULT NULL::integer, "minimum_sends" integer DEFAULT NULL::integer) RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    prev_send_slash RECORD;
BEGIN
    -- Retrieve the previous send_slash record
    SELECT * INTO prev_send_slash
    FROM public.send_slash
    WHERE distribution_id = (SELECT id FROM distributions WHERE "number" = insert_send_slash.distribution_number - 1 LIMIT 1);

    -- Use provided values or previous values or defaults
    INSERT INTO public.send_slash(
        distribution_id,
        distribution_number,
        scaling_divisor,
        minimum_sends
    ) VALUES (
        (SELECT id FROM distributions WHERE "number" = distribution_number LIMIT 1),
        insert_send_slash.distribution_number,
        COALESCE(scaling_divisor, prev_send_slash.scaling_divisor, 3),
        COALESCE(minimum_sends, prev_send_slash.minimum_sends, 50)
    );
END;
$$;

ALTER FUNCTION "public"."insert_send_slash"("distribution_number" integer, "scaling_divisor" integer, "minimum_sends" integer) OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."insert_send_streak_verifications"("distribution_num" integer) RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
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
            send_token_transfers stt
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
$$;

ALTER FUNCTION "public"."insert_send_streak_verifications"("distribution_num" integer) OWNER TO "postgres";

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

CREATE OR REPLACE FUNCTION "public"."insert_tag_referral_verifications"("distribution_num" integer) RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  dist_id integer;
  prev_dist_id integer;
  qual_start timestamp;
  qual_end timestamp;
BEGIN
  -- Get current distribution data once
  SELECT id, qualification_start, qualification_end INTO dist_id, qual_start, qual_end
  FROM distributions
  WHERE "number" = distribution_num
  LIMIT 1;

  -- Get previous distribution ID once
  SELECT id INTO prev_dist_id
  FROM distributions
  WHERE "number" = distribution_num - 1
  LIMIT 1;

  -- Add month referrals to distribution_verifications
  INSERT INTO public.distribution_verifications(
    distribution_id,
    user_id,
    type,
    metadata,
    created_at,
    weight)
  SELECT
    dist_id,
    referrer_id,
    'tag_referral'::public.verification_type,
    jsonb_build_object('referred_id', referred_id),
    referrals.created_at,
    CASE
      WHEN EXISTS (
        SELECT 1
        FROM distribution_shares ds
        WHERE ds.user_id = referrals.referred_id
          AND ds.distribution_id = prev_dist_id
      ) THEN 1
      ELSE 0
    END
  FROM
    referrals
  WHERE
    referrals.created_at < qual_end
    AND referrals.created_at > qual_start;
END;
$$;

ALTER FUNCTION "public"."insert_tag_referral_verifications"("distribution_num" integer) OWNER TO "postgres";

CREATE OR REPLACE FUNCTION insert_tag_registration_verifications(distribution_num integer)
RETURNS void AS $$
BEGIN
    -- Idempotent insert: avoid duplicating rows per (distribution_id, user_id, type, tag)
    INSERT INTO public.distribution_verifications(
        distribution_id,
        user_id,
        type,
        metadata,
        weight,
        created_at
    )
    SELECT
        (
            SELECT id
            FROM distributions
            WHERE "number" = distribution_num
            LIMIT 1
        ) AS distribution_id,
        t.user_id,
        'tag_registration'::public.verification_type AS type,
        jsonb_build_object('tag', t."name") AS metadata,
        CASE
            WHEN LENGTH(t.name) >= 6 THEN 1
            WHEN LENGTH(t.name) = 5 THEN 2
            WHEN LENGTH(t.name) = 4 THEN 3 -- Increase reward value of shorter tags
            WHEN LENGTH(t.name) > 0  THEN 4
            ELSE 0
        END AS weight,
        t.created_at AS created_at
    FROM tags t
    INNER JOIN tag_receipts tr ON t.name = tr.tag_name
    WHERE NOT EXISTS (
        SELECT 1
        FROM public.distribution_verifications dv
        WHERE dv.distribution_id = (
            SELECT id FROM distributions WHERE "number" = distribution_num LIMIT 1
        )
        AND dv.user_id = t.user_id
        AND dv.type = 'tag_registration'::public.verification_type
        AND dv.metadata->>'tag' = t.name
    );
END;
$$ LANGUAGE plpgsql;

ALTER FUNCTION "public"."insert_tag_registration_verifications"("distribution_num" integer) OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."insert_total_referral_verifications"("distribution_num" integer) RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  dist_id integer;
  prev_dist_id integer;
  qual_end timestamp;
BEGIN
  -- Get current distribution data once
  SELECT id, qualification_end INTO dist_id, qual_end
  FROM distributions
  WHERE "number" = distribution_num
  LIMIT 1;

  -- Get previous distribution ID once
  SELECT id INTO prev_dist_id
  FROM distributions
  WHERE "number" = distribution_num - 1
  LIMIT 1;

  -- Add total_tag_referrals to distribution_verifications
  INSERT INTO public.distribution_verifications(
    distribution_id,
    user_id,
    type,
    created_at,
    weight)
  WITH total_referrals AS (
    SELECT
      r.referrer_id,
      COUNT(*) FILTER (WHERE EXISTS (
        SELECT 1
        FROM distribution_shares ds
        WHERE ds.user_id = r.referred_id
        AND ds.distribution_id = prev_dist_id
      )) AS qualified_referrals,
      MAX(r.created_at) AS last_referral_date
    FROM
      referrals r
    WHERE
      r.created_at <= qual_end
    GROUP BY
      r.referrer_id
  )
  SELECT
    dist_id AS distribution_id,
    tr.referrer_id AS user_id,
    'total_tag_referrals'::public.verification_type AS type,
    LEAST(tr.last_referral_date, qual_end) AS created_at,
    tr.qualified_referrals AS weight
  FROM
    total_referrals tr
  WHERE
    tr.qualified_referrals > 0;
END;
$$;

ALTER FUNCTION "public"."insert_total_referral_verifications"("distribution_num" integer) OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."insert_verification_value"("distribution_number" integer, "type" "public"."verification_type", "fixed_value" numeric DEFAULT NULL::numeric, "bips_value" integer DEFAULT NULL::integer, "multiplier_min" numeric DEFAULT NULL::numeric, "multiplier_max" numeric DEFAULT NULL::numeric, "multiplier_step" numeric DEFAULT NULL::numeric) RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    prev_verification_values RECORD;
BEGIN
    SELECT * INTO prev_verification_values
    FROM public.distribution_verification_values dvv
    WHERE distribution_id = (SELECT id FROM distributions WHERE "number" = insert_verification_value.distribution_number - 1 LIMIT 1)
    AND dvv.type = insert_verification_value.type
    LIMIT 1;

    INSERT INTO public.distribution_verification_values(
        type,
        fixed_value,
        bips_value,
        multiplier_min,
        multiplier_max,
        multiplier_step,
        distribution_id
    ) VALUES (
        insert_verification_value.type,
        COALESCE(insert_verification_value.fixed_value, prev_verification_values.fixed_value, 0),
        COALESCE(insert_verification_value.bips_value, prev_verification_values.bips_value, 0),
        COALESCE(insert_verification_value.multiplier_min, prev_verification_values.multiplier_min),
        COALESCE(insert_verification_value.multiplier_max, prev_verification_values.multiplier_max),
        COALESCE(insert_verification_value.multiplier_step, prev_verification_values.multiplier_step),
        (SELECT id FROM distributions WHERE "number" = insert_verification_value.distribution_number LIMIT 1)
    );
END;
$$;

ALTER FUNCTION "public"."insert_verification_value"("distribution_number" integer, "type" "public"."verification_type", "fixed_value" numeric, "bips_value" integer, "multiplier_min" numeric, "multiplier_max" numeric, "multiplier_step" numeric) OWNER TO "postgres";

-- TODO require recipient to have send earn mininum balance
CREATE OR REPLACE FUNCTION public."insert_send_streak_verification"()
RETURNS trigger
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
$$;

CREATE OR REPLACE FUNCTION "public"."update_distribution_shares"("distribution_id" integer, "shares" "public"."distribution_shares"[]) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $_$
BEGIN
  -- validate shares are greater than 0
  IF(
    SELECT
      count(*)
    FROM
      unnest(shares) shares
    WHERE
      shares.amount <= 0) > 0 THEN
    RAISE EXCEPTION 'Shares must be greater than 0.';
  END IF;
  -- get the distribution
  IF(
    SELECT
      1
    FROM
      distributions d
    WHERE
      d.id = $1
    LIMIT 1) IS NULL THEN
    RAISE EXCEPTION 'Distribution not found.';
  END IF;
  -- validate shares are for the correct distribution
  IF(
    SELECT
      count(DISTINCT id)
    FROM
      distributions
    WHERE
      id IN(
      SELECT
        shares.distribution_id
      FROM
        unnest(shares) shares)) <> 1 THEN
    RAISE EXCEPTION 'Shares are for the wrong distribution.';
  END IF;
  -- delete existing shares
  DELETE FROM distribution_shares
  WHERE distribution_shares.distribution_id = $1;
  -- insert new shares
  INSERT INTO distribution_shares(
    distribution_id,
    user_id,
    address,
    amount,
    hodler_pool_amount,
    bonus_pool_amount,
    fixed_pool_amount,
    "index")
  SELECT
    update_distribution_shares.distribution_id,
    shares.user_id,
    shares.address,
    shares.amount,
    shares.hodler_pool_amount,
    shares.bonus_pool_amount,
    shares.fixed_pool_amount,
    row_number() OVER(PARTITION BY update_distribution_shares.distribution_id ORDER BY shares.address) - 1 AS "index"
  FROM
    unnest(shares) shares
ORDER BY
  shares.address;
END;
$_$;

ALTER FUNCTION "public"."update_distribution_shares"("distribution_id" integer, "shares" "public"."distribution_shares"[]) OWNER TO "postgres";

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
    -- Create temp table for shares lookup
    CREATE TEMPORARY TABLE temp_shares ON COMMIT DROP AS
    SELECT DISTINCT user_id
    FROM unnest(shares) ds;

    -- Update tag_referral weights - just check if in shares
    UPDATE distribution_verifications dv
    SET weight = CASE
        WHEN ts.user_id IS NOT NULL THEN 1
        ELSE 0
    END
    FROM referrals r
    LEFT JOIN temp_shares ts ON ts.user_id = r.referred_id
    WHERE dv.distribution_id = $1
    AND dv.type = 'tag_referral'
    AND dv.user_id = r.referrer_id
    AND (dv.metadata->>'referred_id')::uuid = r.referred_id;

    -- Insert total_tag_referrals if doesn't exist
    INSERT INTO distribution_verifications (distribution_id, user_id, type, weight)
    SELECT
        $1,
        r.referrer_id,
        'total_tag_referrals',
        COUNT(ts.user_id)
    FROM referrals r
    JOIN temp_shares ts ON ts.user_id = r.referred_id
    WHERE NOT EXISTS (
        SELECT 1 FROM distribution_verifications dv
        WHERE dv.distribution_id = $1
        AND dv.type = 'total_tag_referrals'
        AND dv.user_id = r.referrer_id
    )
    GROUP BY r.referrer_id;

    -- Update existing total_tag_referrals
    UPDATE distribution_verifications dv
    SET weight = rc.referral_count
    FROM (
        SELECT
            r.referrer_id,
            COUNT(ts.user_id) as referral_count
        FROM referrals r
        JOIN temp_shares ts ON ts.user_id = r.referred_id
        GROUP BY r.referrer_id
    ) rc
    WHERE dv.distribution_id = $1
    AND dv.type = 'total_tag_referrals'
    AND dv.user_id = rc.referrer_id;

    DROP TABLE temp_shares;
END;
$function$;

ALTER FUNCTION "public"."update_referral_verifications"("distribution_id" integer, "shares" "public"."distribution_shares"[]) OWNER TO "postgres";

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
$function$
;

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
$function$
;

ALTER FUNCTION "public"."insert_verification_send_ceiling"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION public.insert_verification_sendpot_ticket_purchase()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    curr_distribution_id integer;
    curr_distribution_start_epoch numeric;
    curr_distribution_end_epoch numeric;
    buyer_user_id uuid;
    max_jackpot_block_time numeric;
    recalculated_weight numeric;
    existing_verification_id bigint;
BEGIN
    -- Get the current active distribution
    SELECT id, EXTRACT(EPOCH FROM qualification_start), EXTRACT(EPOCH FROM qualification_end)
    INTO curr_distribution_id, curr_distribution_start_epoch, curr_distribution_end_epoch
    FROM distributions
    WHERE qualification_start <= CURRENT_TIMESTAMP AT TIME ZONE 'UTC'
      AND qualification_end >= CURRENT_TIMESTAMP AT TIME ZONE 'UTC'
    ORDER BY qualification_start DESC
    LIMIT 1;

    -- Get user_id from send_accounts using buyer address
    SELECT user_id INTO buyer_user_id
    FROM send_accounts
    WHERE address_bytes = NEW.buyer;

    -- Exit early if no active distribution or user not found
    IF curr_distribution_id IS NULL OR buyer_user_id IS NULL THEN
        RETURN NEW;
    END IF;

    -- Get the largest (most recent) jackpot block_time
    SELECT COALESCE(MAX(block_time), 0) INTO max_jackpot_block_time
    FROM sendpot_jackpot_runs;

    -- Only process if this purchase is AFTER the last jackpot
    IF NEW.block_time <= max_jackpot_block_time THEN
        RETURN NEW;
    END IF;

    -- Calculate total tickets for this user in current distribution that are AFTER the last jackpot
    SELECT COALESCE(SUM(tickets_purchased_total_bps), 0) INTO recalculated_weight
    FROM sendpot_user_ticket_purchases
    WHERE buyer = NEW.buyer
      AND block_time >= curr_distribution_start_epoch
      AND block_time < curr_distribution_end_epoch
      AND block_time > max_jackpot_block_time;

    -- Find existing verification for this user/distribution/type in the same jackpot period
    -- If created_at > max_jackpot_block_time, it's in the current pending period
    SELECT id INTO existing_verification_id
    FROM distribution_verifications
    WHERE user_id = buyer_user_id
      AND distribution_id = curr_distribution_id
      AND type = 'sendpot_ticket_purchase'
      AND EXTRACT(EPOCH FROM created_at) > max_jackpot_block_time
    LIMIT 1;

    -- If no verification exists, insert it; otherwise update it
    IF existing_verification_id IS NULL THEN
        INSERT INTO distribution_verifications(
            distribution_id,
            user_id,
            type,
            weight,
            metadata,
            created_at
        )
        VALUES (
            curr_distribution_id,
            buyer_user_id,
            'sendpot_ticket_purchase',
            recalculated_weight,
            jsonb_build_object('lastJackpotEndTime', max_jackpot_block_time),
            to_timestamp(NEW.block_time) AT TIME ZONE 'UTC'
        );
    ELSE
        UPDATE distribution_verifications
        SET weight = recalculated_weight,
            created_at = to_timestamp(NEW.block_time) AT TIME ZONE 'UTC',
            metadata = jsonb_build_object('lastJackpotEndTime', max_jackpot_block_time)
        WHERE id = existing_verification_id;
    END IF;

    RETURN NEW;
END;
$function$;

ALTER FUNCTION "public"."insert_verification_sendpot_ticket_purchase"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."insert_sendpot_ticket_purchase_verifications"("distribution_num" integer) RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Insert verification rows for ticket purchases grouped by jackpot period
    -- Pattern mirrored from insert_create_passkey_verifications
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
    -- Get all jackpot runs that occurred during this distribution
    jackpot_periods AS (
        SELECT
            block_time,
            COALESCE(
                LAG(block_time) OVER (ORDER BY block_time ASC),
                0
            ) AS prev_block_time
        FROM sendpot_jackpot_runs
        WHERE block_time >= EXTRACT(EPOCH FROM (
            SELECT qualification_start FROM distribution_info
        ))
        AND block_time <= EXTRACT(EPOCH FROM (
            SELECT qualification_end FROM distribution_info
        ))
    ),
    max_jackpot AS (
        SELECT COALESCE(MAX(block_time), 0) AS max_block_time
        FROM sendpot_jackpot_runs
    ),
    -- Group ticket purchases by user and jackpot period
    purchases_by_period AS (
        SELECT
            sa.user_id,
            CASE
                -- If matched a completed jackpot period, use that
                WHEN jp.block_time IS NOT NULL THEN jp.block_time
                -- If purchase is after max jackpot, use max jackpot (pending period)
                WHEN (SELECT max_block_time FROM max_jackpot) > 0
                     AND utp.block_time > (SELECT max_block_time FROM max_jackpot)
                THEN (SELECT max_block_time FROM max_jackpot)
                -- Otherwise, use 0 (before first jackpot or no jackpots exist)
                ELSE 0
            END AS jackpot_block_time,
            SUM(utp.tickets_purchased_total_bps) AS total_tickets,
            MAX(to_timestamp(utp.block_time) AT TIME ZONE 'UTC') AS last_purchase_time
        FROM sendpot_user_ticket_purchases utp
        JOIN send_accounts sa ON sa.address_bytes = utp.buyer
        -- Find the jackpot period this purchase belongs to
        LEFT JOIN jackpot_periods jp ON utp.block_time > jp.prev_block_time
            AND utp.block_time <= jp.block_time
        WHERE utp.block_time >= EXTRACT(EPOCH FROM (
            SELECT qualification_start FROM distribution_info
        ))
        AND utp.block_time < EXTRACT(EPOCH FROM (
            SELECT qualification_end FROM distribution_info
        ))
        GROUP BY sa.user_id,
            CASE
                WHEN jp.block_time IS NOT NULL THEN jp.block_time
                WHEN (SELECT max_block_time FROM max_jackpot) > 0
                     AND utp.block_time > (SELECT max_block_time FROM max_jackpot)
                THEN (SELECT max_block_time FROM max_jackpot)
                ELSE 0
            END
    )
    INSERT INTO public.distribution_verifications(
        distribution_id,
        user_id,
        type,
        weight,
        metadata,
        created_at
    )
    SELECT
        (SELECT id FROM distribution_info),
        pbp.user_id,
        'sendpot_ticket_purchase'::public.verification_type,
        pbp.total_tickets,
        jsonb_build_object('lastJackpotEndTime', pbp.jackpot_block_time),
        pbp.last_purchase_time
    FROM purchases_by_period pbp
    WHERE pbp.user_id IS NOT NULL;
END;
$$;

ALTER FUNCTION "public"."insert_sendpot_ticket_purchase_verifications"("distribution_num" integer) OWNER TO "postgres";

-- Grants for tables
GRANT ALL ON TABLE "public"."distributions" TO "anon";
GRANT ALL ON TABLE "public"."distributions" TO "authenticated";
GRANT ALL ON TABLE "public"."distributions" TO "service_role";

GRANT ALL ON SEQUENCE "public"."distributions_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."distributions_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."distributions_id_seq" TO "service_role";

GRANT ALL ON TABLE "public"."distribution_shares" TO "anon";
GRANT ALL ON TABLE "public"."distribution_shares" TO "authenticated";
GRANT ALL ON TABLE "public"."distribution_shares" TO "service_role";

GRANT ALL ON SEQUENCE "public"."distribution_shares_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."distribution_shares_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."distribution_shares_id_seq" TO "service_role";

GRANT ALL ON TABLE "public"."distribution_verifications" TO "anon";
GRANT ALL ON TABLE "public"."distribution_verifications" TO "authenticated";
GRANT ALL ON TABLE "public"."distribution_verifications" TO "service_role";

GRANT ALL ON SEQUENCE "public"."distribution_verifications_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."distribution_verifications_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."distribution_verifications_id_seq" TO "service_role";

GRANT ALL ON TABLE "public"."distribution_verification_values" TO "anon";
GRANT ALL ON TABLE "public"."distribution_verification_values" TO "authenticated";
GRANT ALL ON TABLE "public"."distribution_verification_values" TO "service_role";

GRANT ALL ON TABLE "public"."send_slash" TO "anon";
GRANT ALL ON TABLE "public"."send_slash" TO "authenticated";
GRANT ALL ON TABLE "public"."send_slash" TO "service_role";

-- RLS Policies
-- distributions table
ALTER TABLE ONLY "public"."distributions" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access to public" ON "public"."distribution_verification_values" FOR SELECT TO "authenticated" USING (true);
CREATE POLICY "Enable read access to public" ON "public"."distributions" FOR SELECT TO "authenticated" USING (true);
CREATE POLICY "Allow anonymous read access to distributions" ON "public"."distributions" FOR SELECT TO "anon" USING (true);

-- distribution_shares table
ALTER TABLE ONLY "public"."distribution_shares" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User can see own shares" ON "public"."distribution_shares" FOR SELECT USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));

-- distribution_verifications table
ALTER TABLE ONLY "public"."distribution_verifications" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can see their own distribution verifications" ON "public"."distribution_verifications" FOR SELECT USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));

-- distribution_verification_values table
ALTER TABLE ONLY "public"."distribution_verification_values" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can see distribution_verification_values" ON "public"."distribution_verification_values" FOR SELECT USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));

-- send_slash table
ALTER TABLE ONLY "public"."send_slash" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON "public"."send_slash" FOR SELECT USING (true);

-- Functions for relationships
CREATE OR REPLACE FUNCTION "public"."distribution_shares"("public"."profiles") RETURNS SETOF "public"."distribution_shares"
    LANGUAGE "sql" STABLE
    AS $_$
    SELECT * FROM distribution_shares WHERE user_id = $1.id
$_$;

ALTER FUNCTION "public"."distribution_shares"("public"."profiles") OWNER TO "postgres";

-- Function grants
REVOKE ALL ON FUNCTION "public"."calculate_and_insert_send_ceiling_verification"("distribution_number" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."calculate_and_insert_send_ceiling_verification"("distribution_number" integer) TO "service_role";
-- Revoke all public and authenticated access, grant only to service_role
-- For all functions:

REVOKE ALL ON FUNCTION "public"."insert_create_passkey_verifications"("distribution_num" integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION "public"."insert_create_passkey_verifications"("distribution_num" integer) FROM authenticated;
GRANT ALL ON FUNCTION "public"."insert_create_passkey_verifications"("distribution_num" integer) TO service_role;

REVOKE ALL ON FUNCTION "public"."insert_send_slash"("distribution_number" integer, "scaling_divisor" integer, "minimum_sends" integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION "public"."insert_send_slash"("distribution_number" integer, "scaling_divisor" integer, "minimum_sends" integer) FROM authenticated;
GRANT ALL ON FUNCTION "public"."insert_send_slash"("distribution_number" integer, "scaling_divisor" integer, "minimum_sends" integer) TO service_role;

REVOKE ALL ON FUNCTION "public"."insert_send_streak_verifications"("distribution_num" integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION "public"."insert_send_streak_verifications"("distribution_num" integer) FROM authenticated;
GRANT ALL ON FUNCTION "public"."insert_send_streak_verifications"("distribution_num" integer) TO service_role;

REVOKE ALL ON FUNCTION "public"."insert_send_verifications"("distribution_num" integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION "public"."insert_send_verifications"("distribution_num" integer) FROM authenticated;
GRANT ALL ON FUNCTION "public"."insert_send_verifications"("distribution_num" integer) TO service_role;

REVOKE ALL ON FUNCTION "public"."insert_tag_referral_verifications"("distribution_num" integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION "public"."insert_tag_referral_verifications"("distribution_num" integer) FROM authenticated;
GRANT ALL ON FUNCTION "public"."insert_tag_referral_verifications"("distribution_num" integer) TO service_role;

REVOKE ALL ON FUNCTION "public"."insert_tag_registration_verifications"("distribution_num" integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION "public"."insert_tag_registration_verifications"("distribution_num" integer) FROM authenticated;
GRANT ALL ON FUNCTION "public"."insert_tag_registration_verifications"("distribution_num" integer) TO service_role;

REVOKE ALL ON FUNCTION "public"."insert_total_referral_verifications"("distribution_num" integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION "public"."insert_total_referral_verifications"("distribution_num" integer) FROM authenticated;
GRANT ALL ON FUNCTION "public"."insert_total_referral_verifications"("distribution_num" integer) TO service_role;

REVOKE ALL ON FUNCTION "public"."insert_verification_value"("distribution_number" integer, "type" "public"."verification_type", "fixed_value" numeric, "bips_value" integer, "multiplier_min" numeric, "multiplier_max" numeric, "multiplier_step" numeric) FROM PUBLIC;
REVOKE ALL ON FUNCTION "public"."insert_verification_value"("distribution_number" integer, "type" "public"."verification_type", "fixed_value" numeric, "bips_value" integer, "multiplier_min" numeric, "multiplier_max" numeric, "multiplier_step" numeric) FROM authenticated;
GRANT ALL ON FUNCTION "public"."insert_verification_value"("distribution_number" integer, "type" "public"."verification_type", "fixed_value" numeric, "bips_value" integer, "multiplier_min" numeric, "multiplier_max" numeric, "multiplier_step" numeric) TO service_role;

REVOKE ALL ON FUNCTION "public"."update_referral_verifications"("distribution_id" integer, "shares" "public"."distribution_shares"[]) FROM PUBLIC;
REVOKE ALL ON FUNCTION "public"."update_referral_verifications"("distribution_id" integer, "shares" "public"."distribution_shares"[]) FROM authenticated;
GRANT ALL ON FUNCTION "public"."update_referral_verifications"("distribution_id" integer, "shares" "public"."distribution_shares"[]) TO service_role;

REVOKE ALL ON FUNCTION "public"."insert_verification_sends"() FROM PUBLIC;
REVOKE ALL ON FUNCTION "public"."insert_verification_sends"() FROM authenticated;
GRANT ALL ON FUNCTION "public"."insert_verification_sends"() TO service_role;

REVOKE ALL ON FUNCTION "public"."insert_verification_send_ceiling"() FROM PUBLIC;
REVOKE ALL ON FUNCTION "public"."insert_verification_send_ceiling"() FROM authenticated;
GRANT ALL ON FUNCTION "public"."insert_verification_send_ceiling"() TO service_role;

REVOKE ALL ON FUNCTION "public"."distribution_shares"("public"."profiles") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."distribution_shares"("public"."profiles") TO "anon";
GRANT ALL ON FUNCTION "public"."distribution_shares"("public"."profiles") TO "authenticated";
GRANT ALL ON FUNCTION "public"."distribution_shares"("public"."profiles") TO "service_role";

REVOKE ALL ON FUNCTION "public"."insert_verification_sendpot_ticket_purchase"() FROM PUBLIC;
REVOKE ALL ON FUNCTION "public"."insert_verification_sendpot_ticket_purchase"() FROM authenticated;
GRANT ALL ON FUNCTION "public"."insert_verification_sendpot_ticket_purchase"() TO service_role;

REVOKE ALL ON FUNCTION "public"."insert_sendpot_ticket_purchase_verifications"("distribution_num" integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION "public"."insert_sendpot_ticket_purchase_verifications"("distribution_num" integer) FROM authenticated;
GRANT ALL ON FUNCTION "public"."insert_sendpot_ticket_purchase_verifications"("distribution_num" integer) TO service_role;