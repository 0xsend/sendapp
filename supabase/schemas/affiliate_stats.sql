

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

-- RLS
ALTER TABLE "public"."affiliate_stats" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User can see own affiliate stats" ON "public"."affiliate_stats" FOR SELECT USING (("auth"."uid"() = "user_id"));

GRANT ALL ON FUNCTION "public"."get_affiliate_stats_summary"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_affiliate_stats_summary"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_affiliate_stats_summary"() TO "service_role";

GRANT ALL ON TABLE "public"."affiliate_stats" TO "anon";
GRANT ALL ON TABLE "public"."affiliate_stats" TO "authenticated";
GRANT ALL ON TABLE "public"."affiliate_stats" TO "service_role";