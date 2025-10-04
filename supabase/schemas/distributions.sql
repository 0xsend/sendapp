-- Types
CREATE TYPE "public"."verification_type" AS ENUM (
    'tag_registration',
    'tag_referral',
    'create_passkey',
    'send_ten',
    'send_one_hundred',
    'total_tag_referrals',
    'send_streak',
    'send_ceiling'
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

ALTER TABLE ONLY "public"."distributions" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."distributions_id_seq"'::"regclass");
ALTER TABLE ONLY "public"."distribution_shares" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."distribution_shares_id_seq"'::"regclass");

-- Primary Keys and Constraints
ALTER TABLE ONLY "public"."distributions"
    ADD CONSTRAINT "distributions_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."distributions"
    ADD CONSTRAINT "distributions_tranche_id_key" UNIQUE ("merkle_drop_addr", "tranche_id");



ALTER TABLE ONLY "public"."send_slash"
    ADD CONSTRAINT "send_slash_pkey" PRIMARY KEY ("distribution_number");

-- Indexes
CREATE UNIQUE INDEX "distribution_shares_address_idx" ON "public"."distribution_shares" USING "btree" ("address", "distribution_id");
CREATE INDEX "distribution_shares_distribution_id_idx" ON "public"."distribution_shares" USING "btree" ("distribution_id");
CREATE UNIQUE INDEX "distribution_shares_distribution_id_index_uindex" ON "public"."distribution_shares" USING "btree" ("distribution_id", "index");
CREATE UNIQUE INDEX "distribution_shares_user_id_idx" ON "public"."distribution_shares" USING "btree" ("user_id", "distribution_id");
CREATE INDEX "idx_distributions_qualification_dates" ON "public"."distributions" USING "btree" ("qualification_start", "qualification_end");

-- Foreign Keys
ALTER TABLE ONLY "public"."distribution_shares"
    ADD CONSTRAINT "distribution_shares_distribution_id_fkey" FOREIGN KEY ("distribution_id") REFERENCES "public"."distributions"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."distribution_shares"
    ADD CONSTRAINT "distribution_shares_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;





ALTER TABLE ONLY "public"."send_slash"
    ADD CONSTRAINT "send_slash_distribution_id_fkey" FOREIGN KEY ("distribution_id") REFERENCES "public"."distributions"("id") ON DELETE CASCADE;





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


GRANT ALL ON TABLE "public"."send_slash" TO "anon";
GRANT ALL ON TABLE "public"."send_slash" TO "authenticated";
GRANT ALL ON TABLE "public"."send_slash" TO "service_role";

-- RLS Policies
-- distributions table
ALTER TABLE ONLY "public"."distributions" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access to public" ON "public"."distributions" FOR SELECT TO "authenticated" USING (true);

-- distribution_shares table
ALTER TABLE ONLY "public"."distribution_shares" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User can see own shares" ON "public"."distribution_shares" FOR SELECT USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));


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
-- Revoke all public and authenticated access, grant only to service_role
-- For all functions:


REVOKE ALL ON FUNCTION "public"."insert_send_slash"("distribution_number" integer, "scaling_divisor" integer, "minimum_sends" integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION "public"."insert_send_slash"("distribution_number" integer, "scaling_divisor" integer, "minimum_sends" integer) FROM authenticated;
GRANT ALL ON FUNCTION "public"."insert_send_slash"("distribution_number" integer, "scaling_divisor" integer, "minimum_sends" integer) TO service_role;










REVOKE ALL ON FUNCTION "public"."distribution_shares"("public"."profiles") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."distribution_shares"("public"."profiles") TO "anon";
GRANT ALL ON FUNCTION "public"."distribution_shares"("public"."profiles") TO "authenticated";
GRANT ALL ON FUNCTION "public"."distribution_shares"("public"."profiles") TO "service_role";