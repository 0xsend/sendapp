CREATE OR REPLACE FUNCTION "public"."generate_referral_code"() RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
BEGIN

RETURN substr(md5(random()::text), 0, 12);

END;
$$;


ALTER FUNCTION "public"."generate_referral_code"() OWNER TO "postgres";

REVOKE ALL ON FUNCTION "public"."generate_referral_code"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."generate_referral_code"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_referral_code"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_referral_code"() TO "service_role";




CREATE SEQUENCE IF NOT EXISTS "public"."profiles_send_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."profiles_send_id_seq" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "avatar_url" "text",
    "name" "text",
    "about" "text",
    "referral_code" "text" DEFAULT "public"."generate_referral_code"(),
    "is_public" boolean DEFAULT true,
    "send_id" integer DEFAULT "nextval"('"public"."profiles_send_id_seq"'::"regclass") NOT NULL,
    "x_username" "text",
    "birthday" "date",
    CONSTRAINT "profiles_about_update" CHECK (("length"("about") < 255)),
    CONSTRAINT "profiles_name_update" CHECK (("length"("name") < 63)),
    CONSTRAINT "profiles_x_username_update" CHECK (("length"("x_username") <= 64)),
    "nickname" "text"
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";

-- Primary Keys and Constraints
ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");

-- Indexes
CREATE UNIQUE INDEX "profiles_send_id_unique" ON "public"."profiles" USING "btree" ("send_id");
CREATE UNIQUE INDEX "profiles_referral_code_unique" ON "public"."profiles" USING "btree" ("referral_code");

-- Foreign Keys
ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

-- RLS
ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone." ON "public"."profiles" FOR SELECT TO "authenticated", "anon" USING (("is_public" = true));

CREATE POLICY "Users can insert their own profile." ON "public"."profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));

CREATE POLICY "Users can update own profile." ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"));

-- Grants
GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";

GRANT ALL ON SEQUENCE "public"."profiles_send_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."profiles_send_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."profiles_send_id_seq" TO "service_role";
