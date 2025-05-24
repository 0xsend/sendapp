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
    CONSTRAINT "profiles_x_username_update" CHECK (("length"("x_username") <= 64))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";
