-- Functions
CREATE OR REPLACE FUNCTION "public"."update_affiliate_stats_on_transfer"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  sender_id uuid;
  receiver_id uuid;
  transfer_amount numeric;
BEGIN
  -- Get sender and receiver user_ids
  SELECT
    sa.user_id INTO sender_id
  FROM
    send_accounts sa
  WHERE
    sa.address = concat('0x', encode(NEW.f, 'hex'))::citext;
  SELECT
    sa.user_id INTO receiver_id
  FROM
    send_accounts sa
  WHERE
    sa.address = concat('0x', encode(NEW.t, 'hex'))::citext;
  transfer_amount := NEW.v::numeric;
  -- Update sender's stats (now increment)
  IF sender_id IS NOT NULL THEN
    IF EXISTS (
      SELECT
        1
      FROM
        affiliate_stats
      WHERE
        user_id = sender_id) THEN
    UPDATE
      affiliate_stats
    SET
      send_plus_minus = send_plus_minus + transfer_amount
    WHERE
      user_id = sender_id;
  ELSE
    INSERT INTO affiliate_stats(
      user_id,
      send_plus_minus)
    VALUES (
      sender_id,
      transfer_amount);
  END IF;
END IF;
  -- Update receiver's stats (now decrement) if not from referrer
  IF receiver_id IS NOT NULL THEN
    -- Check if sender is not the receiver's referrer
    IF NOT EXISTS (
      SELECT
        1
      FROM
        referrals r
        INNER JOIN send_accounts sa ON sa.user_id = r.referrer_id
      WHERE
        r.referred_id = receiver_id
        AND sa.address = concat('0x', encode(NEW.f, 'hex'))::citext) THEN
    IF EXISTS (
      SELECT
        1
      FROM
        affiliate_stats
      WHERE
        user_id = receiver_id) THEN
    UPDATE
      affiliate_stats
    SET
      send_plus_minus = send_plus_minus - transfer_amount
    WHERE
      user_id = receiver_id;
  ELSE
    INSERT INTO affiliate_stats(
      user_id,
      send_plus_minus)
    VALUES (
      receiver_id,
      - transfer_amount);
  END IF;
END IF;
END IF;
  RETURN NEW;
END;
$$;
ALTER FUNCTION "public"."update_affiliate_stats_on_transfer"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."get_affiliate_stats_summary"() RETURNS TABLE("id" "uuid", "created_at" timestamp with time zone, "user_id" "uuid", "referral_count" bigint)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    RETURN QUERY
        SELECT
            a.id,
            a.created_at,
            a.user_id,
            COUNT(DISTINCT r.referred_id)::bigint AS referral_count
        FROM
            affiliate_stats a
                LEFT JOIN referrals r ON r.referrer_id = a.user_id
        WHERE
            a.user_id = auth.uid()
        GROUP BY
            a.id,
            a.created_at,
            a.user_id;
END;
$$;
ALTER FUNCTION "public"."get_affiliate_stats_summary"() OWNER TO "postgres";

-- Table
CREATE TABLE IF NOT EXISTS "public"."affiliate_stats" (
    "user_id" "uuid",
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "send_plus_minus" numeric DEFAULT 0 NOT NULL
);
ALTER TABLE "public"."affiliate_stats" OWNER TO "postgres";

-- Primary Keys and Constraints
ALTER TABLE ONLY "public"."affiliate_stats"
    ADD CONSTRAINT "affiliate_stats_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."affiliate_stats"
    ADD CONSTRAINT "affiliate_stats_user_id_key" UNIQUE ("user_id");

-- Indexes
CREATE INDEX "idx_affiliate_stats_user_created" ON "public"."affiliate_stats" USING "btree" ("user_id", "created_at" DESC);

-- Foreign Keys
ALTER TABLE ONLY "public"."affiliate_stats"
    ADD CONSTRAINT "affiliate_stats_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON UPDATE CASCADE ON DELETE CASCADE;

-- Triggers
CREATE OR REPLACE TRIGGER "after_transfer_update_affiliate_stats" AFTER INSERT ON "public"."send_token_transfers" FOR EACH ROW EXECUTE FUNCTION "public"."update_affiliate_stats_on_transfer"();

-- RLS
ALTER TABLE "public"."affiliate_stats" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User can see own affiliate stats" ON "public"."affiliate_stats" FOR SELECT USING (("auth"."uid"() = "user_id"));

-- Grants
GRANT ALL ON FUNCTION "public"."update_affiliate_stats_on_transfer"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_affiliate_stats_on_transfer"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_affiliate_stats_on_transfer"() TO "service_role";

GRANT ALL ON FUNCTION "public"."get_affiliate_stats_summary"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_affiliate_stats_summary"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_affiliate_stats_summary"() TO "service_role";

GRANT ALL ON TABLE "public"."affiliate_stats" TO "anon";
GRANT ALL ON TABLE "public"."affiliate_stats" TO "authenticated";
GRANT ALL ON TABLE "public"."affiliate_stats" TO "service_role";